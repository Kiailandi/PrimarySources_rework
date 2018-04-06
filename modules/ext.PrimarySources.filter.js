/**
 * Filter component.
 *
 * When the user clicks on the filter link, a modal window will open.
 * The user can view a table of suggested statements with eventual
 * references by building filters in several ways.
 */
(function (mw, $) {

    var ps = mw.ps || {};

    // BEGIN: baked SPARQL queries
    var searchSparqlQuery =
    'SELECT {{BINDINGS}} ' +
    'WHERE {' +
    '  GRAPH {{DATASET}} {' +
    '    ?subject a wikibase:Item ;' +
    '             {{PROPERTY}} ?statement_node .' +
    '    ?statement_node ?statement_property ?value .' +
    '    OPTIONAL { ?value ?reference_property ?reference_value . }' +
    '  } ' +
    '{{FILTER}}' +
    '} ' +
    'OFFSET {{OFFSET}} ' +
    'LIMIT {{LIMIT}}';

    var searchWithValueSparqlQuery =
    'SELECT {{BINDINGS}} ' +
    'WHERE {' +
    '  GRAPH {{DATASET}} {' +
    '    ?subject a wikibase:Item ;' +
    '             {{PROPERTY}} ?statement_node .' +
    '    { SELECT ?statement_node WHERE { ?statement_node ?statement_property wd:{{VALUE}} . } }' +
    '    ?statement_node ?statement_property ?value .  ' +
    '    OPTIONAL { ?value ?reference_property ?reference_value . }' +
    '  } ' +
    '{{FILTER}}' +
    '} ' +
    'OFFSET {{OFFSET}} ' +
    'LIMIT {{LIMIT}}';
    var datasetFilter = 'FILTER STRENDS(str(?dataset), "new") . ';

    var subjectsSparqlQuery = "SELECT ?subject WHERE { ?subject a wikibase:Item } OFFSET {{OFFSET}} LIMIT {{LIMIT}}";
    // END: baked SPARQL queries

    function filterDialog(windowManager, linkToBind) {
        /*
         * binding is:
         * Subject, property, value, reference_property, reference_value, dataset
         *   [0]      [1]      [2]           [3]               [4]          [5]
         */
        function SearchResultRow(binding, filteredProperty, filteredItemValue, filteredDataset, isBlacklisted) {
            SearchResultRow.super.call(this, binding, filteredProperty, filteredItemValue, filteredDataset, isBlacklisted);
            
            /*
             * Do not show blacklisted URLs.
             * Statements will not be blacklisted in the back end.
             * The item curation module is responsible for that.
             */
            var referenceValue = binding[4];
            if (isBlacklisted && ps.commons.isUrl(referenceValue) && isBlacklisted(referenceValue)) {
                ps.commons.debug.log('Skipping statement with blacklisted reference URL ' + referenceValue);
                return;
            }

            var widget = this;
            var cells = [];
            var uriPrefix = 'http://www.wikidata.org/';

            // BEGIN: data cells
            binding.forEach(function (value) {
                var cell = $('<td>');
                // Entities: format linked labels
                if (/[QP]\d+$/.test(value)) {
                    ps.commons.getEntityLabel(value.split('/').pop())
                        .then(function (label) {
                            cell.append(
                                $('<a>')
                                    .attr('href', value)
                                    .text(label)
                            );
                        });
                    cells.push(cell);
                }
                // URLs: make a link
                else if (ps.commons.isUrl(value)) {
                    cell.append(
                        $('<a>')
                            .attr('href', value)
                            .text(value)
                    );
                    cells.push(cell);
                }
                // Literals: return as is
                else {
                    cell.text(value);
                    cells.push(cell);
                }
            });
            // END: data cells
            
            // BEGIN: action buttons
            var curationButtons = new OO.ui.ButtonGroupWidget({
                items: [
                    new OO.ui.ButtonWidget({
                        label: 'Approve',
                        flags: 'progressive',
                        icon: 'add',
                        disabled: true
                    })
                    .connect(widget, { click: 'approve' }),
                    new OO.ui.ButtonWidget({
                        label: 'Reject',
                        flags: 'destructive',
                        icon: 'trash',
                        disabled: true
                    })
                    .connect(widget, { click: 'reject' })
                ]
            });
            // Build the QuickStatement needed for the /curate service
            var subject = binding[0].substring((uriPrefix + 'entity/').length);
            var actualProperty = filteredProperty
            ? filteredProperty
            : binding[1].substring((uriPrefix + 'prop/').length);
            var actualValue;
            if (filteredItemValue) {
                actualValue = filteredItemValue;
            } else {
                actualValue = binding[2].startsWith(uriPrefix + 'entity/')
                ? binding[2].substring((uriPrefix + 'entity/').length)
                : binding[2]
            }
            var referenceProperty, referenceValue;
            if (binding[3].startsWith(uriPrefix + 'prop/reference/')) {
                referenceProperty = binding[3].substring((uriPrefix + 'prop/reference/').length).replace('P', 'S');
                referenceValue = binding[4].startsWith(uriPrefix + 'entity/')
                ? binding[4].substring((uriPrefix + 'entity/').length)
                : binding[4]
                this.statementType = 'reference';
            } else {
                this.statementType = 'claim';
            }
            this.dataset = filteredDataset === '' ? binding[5] : filteredDataset;
            this.quickStatement = referenceProperty
            ? subject + '\t' + actualProperty + '\t' + actualValue + '\t' + referenceProperty + '\t' + referenceValue
            : subject + '\t' + actualProperty + '\t' + actualValue;
            // Generate the preview button only if we have a reference URL
            var previewButton;
            if (referenceProperty === 'S854') {
                previewButton = new OO.ui.ButtonWidget({
                    label: 'Preview',
                    flags: ['primary', 'progressive'],
                    icon: 'articleSearch'
                })
                .connect(widget, { click: function() {
                    curationButtons.getItems().forEach(function (item) { item.setDisabled(false); });
                    // Reuse the label from the cells
                    previewParams = [cells[0].text()];
                    if (filteredProperty) {
                        previewParams.push(filteredProperty);
                    } else {
                        previewParams.push(cells[1].text());
                    }
                    if (filteredItemValue) {
                        previewParams.push(filteredItemValue);
                    } else {
                        previewParams.push(cells[2].text());
                    }
                    previewParams.push(referenceValue);
                    console.log('PREVIEW PARAMS:', previewParams);
                    ps.referencePreview.openNav(
                        previewParams[0], previewParams[1], previewParams[2], previewParams[3],
                        $(curationButtons.$element)
                    )}
                });
            } else {
                curationButtons.getItems().forEach(function (item) { item.setDisabled(false); });
            }
            if (previewButton) {
                cells.push($('<td>').append(previewButton.$element, curationButtons.$element));
            } else {
                cells.push($('<td>').append(curationButtons.$element));
            }
            // END: action buttons

            this.$element.append(
                $('<tr>').css('text-align', 'center').append(cells)
            );
        }
        OO.inheritClass(SearchResultRow, OO.ui.Widget);
        SearchResultRow.static.tagName = 'tbody';

        function SparqlResultRow(headers, bindings) {
            SparqlResultRow.super.call(this, headers, bindings);
            var cells = [];
            headers.forEach(function (header) {
                var cell = $('<td>');
                var value, valueType;
                // Handle empty values in case of OPTIONAL clauses
                if (bindings.hasOwnProperty(header)) {
                    value = bindings[header].value;
                    valueType = bindings[header].type;
                } else {
                    value = null;
                    valueType = null;
                }
                // Empty cell
                if (value === null) {
                    cells.push(cell);
                }
                // Entities: format linked labels
                else if (valueType === 'uri' && /[QP]\d+$/.test(value)) {
                    ps.commons.getEntityLabel(value.split('/').pop())
                        .then(function (label) {
                            cell.append(
                                $('<a>')
                                    .attr('href', value)
                                    .text(label)
                            );
                        });
                    cells.push(cell);
                }
                // URIs: make a link
                else if (valueType === 'uri') {
                    var label;
                    // Mint readable labels based on expected namespaces
                    if (value === 'http://www.w3.org/ns/prov#wasDerivedFrom') {
                        label = 'RDF reference property';
                    } else if (value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
                        label = 'RDF type';
                    } else if (value.startsWith('http://www.wikidata.org/entity/statement/')) {
                        label = 'RDF statement node';
                    } else if (value.startsWith('http://www.wikidata.org/reference/')) {
                        label = 'RDF reference node';
                    } else {
                        label = value;
                    }
                    cell.append(
                        $('<a>')
                            .attr('href', value)
                            .text(label)
                    );
                    cells.push(cell);
                }
                // Literals: return as is
                else {
                    cell.text(value);
                    cells.push(cell);
                }
            });
            this.$element.append(
                $('<tr>').css('text-align', 'center').append(cells)
            );
        }
        OO.inheritClass(SparqlResultRow, OO.ui.Widget);
        SparqlResultRow.static.tagName = 'tbody';

        function ServiceResultRow(entityId) {
            ServiceResultRow.super.call(this, entityId);
            var cell = $('<td>');
            ps.commons.getEntityLabel(entityId)
                .then(function (label) {
                    var link = entityId.startsWith('P') ? document.location.origin + '/wiki/Property:' + entityId : entityId;
                    cell.append(
                        $('<a>')
                            .attr('href', link)
                            .text(label)
                    );
                })
                    this.$element.append(
                        $('<tr>').css('text-align', 'center').append(cell)
                    );
        }
        OO.inheritClass(ServiceResultRow, OO.ui.Widget);
        ServiceResultRow.static.tagName = 'tbody';

        function AutocompleteWidget(config) {
            OO.ui.SearchInputWidget.call(this, config);
            OO.ui.mixin.LookupElement.call(this, config);
            this.cache = config.cache;
        };
        OO.inheritClass(AutocompleteWidget, OO.ui.SearchInputWidget);
        OO.mixinClass(AutocompleteWidget, OO.ui.mixin.LookupElement);

        /**
         * @inheritdoc
         */
        AutocompleteWidget.prototype.getLookupRequest = function () {
            var widget = this;
            var userInput = widget.getValue();
            var deferred = $.Deferred();
            var getSuggestions = function (input, cache) {
                var suggestions = {};
                for (var id in cache) {
                    if (cache.hasOwnProperty(id)) {
                        if (cache[id].toLowerCase().includes(input.toLowerCase())) {
                            suggestions[id] = cache[id];
                        }
                    }
                }
                return suggestions;
            }
            if (widget.cache) {
                deferred.resolve(getSuggestions(userInput, widget.cache));
            } else {
                deferred.resolve({});
            }
            return deferred.promise({ abort: function () { } });
        };

        /**
         * @inheritdoc
         */
        AutocompleteWidget.prototype.getLookupCacheDataFromResponse = function (response) {
            return response || {};
        };

        /**
         * @inheritdoc
         */
        AutocompleteWidget.prototype.getLookupMenuOptionsFromData = function (data) {
            var items = [];
            for (var id in data) {
                if (data.hasOwnProperty(id)) {
                    var label = data[id];
                    items.push(new OO.ui.MenuOptionWidget({
                        data: id,
                        label: label
                    }))
                }
            }
            return items;
        };

        /*
         * The method implemented in OO.ui.mixin.LookupElement sets the value of the input widget to the DATA of the chosen element.
         * Set it to the LABEL instead (and properly set the data).
         * Also ensure the lookup menu is not displayed again when the value is set.
         * See https://doc.wikimedia.org/oojs-ui/master/js/#!/api/OO.ui.mixin.LookupElement
         */
        AutocompleteWidget.prototype.onLookupMenuItemChoose = function (item) {
            this.setLookupsDisabled(true);
            this
                .setValue(item.getLabel())
                .setData(item.getData());
            this.setLookupsDisabled(false);
        };

        SearchResultRow.prototype.approve = function() {
            var widget = this;
            var qs = widget.quickStatement;
            var parts = qs.split('\t');
            var length = parts.length;
            var subject = parts[0];
            var property = parts[1];
            var object = ps.commons.rdfValueToTsv(parts[2]);
            var qualifiers = [];
            var references = [];
            for (var i = 3; i < length; i += 2) {
                if (i === length - 1) {
                    ps.commons.debug.log('Malformed qualifier/source pieces');
                    break;
                }
                if (/^P\d+$/.exec(parts[i])) {
                    qualifiers.push({
                        qualifierProperty: parts[i],
                        qualifierObject: ps.commons.rdfValueToTsv(parts[i + 1])
                    });
                } else if (/^S\d+$/.exec(parts[i])) {
                    references.push({
                        sourceProperty: parts[i].replace(/^S/, 'P'),
                        sourceObject: ps.commons.rdfValueToTsv(parts[i + 1]),
                        sourceType: ps.commons.rdfValueToJson(parts[i + 1]).type
                    });
                }

            }
            widget.showProgressBar();
            ps.commons.getClaims(subject, property, function(err, claims) {
                var objectExists = false;
                for (var i = 0, lenI = claims.length; i < lenI; i++) {
                  var claim = claims[i];
                  if (
                    claim.mainsnak.snaktype === 'value' &&
                    ps.commons.jsonToTsvValue(claim.mainsnak.datavalue) === object
                  ) {
                    objectExists = true;
                    break;
                  }
                }
                // The claim is already in Wikidata: only add the reference, don't add if no reference
                if (objectExists) {
                    if (widget.statementType === 'reference') {
                        ps.commons.createReference(subject, property, object, references,
                            function(error, data) {
                                if (error) {
                                    widget.toggle(false).setDisabled(true);
                                    return ps.commons.reportError(error);
                                }
                                // The back end approves everything
                                ps.commons.setStatementState(qs, ps.globals.STATEMENT_STATES.approved, widget.dataset, widget.statementType)
                                .fail(function() {
                                    widget.toggle(false).setDisabled(true);
                                })
                                .done(function() {
                                    ps.commons.debug.log('Approved referenced claim [' + qs + ']');
                                    widget.toggle(false).setDisabled(true);
                                });
                            }
                        );
                    }
                }
                else {
                    // Add a new referenced claim
                    if (widget.statementType === 'reference') {
                        ps.commons.createClaimWithReference(subject, property, object, qualifiers, references)
                        .fail(function(error) {
                            widget.toggle(false).setDisabled(true);
                            return ps.commons.reportError(error);
                        })
                        .done(function() {
                            ps.commons.setStatementState(qs, ps.globals.STATEMENT_STATES.approved, widget.dataset, widget.statementType)
                            .fail(function() {
                                widget.toggle(false).setDisabled(true);
                            })
                            .done(function() {
                                ps.commons.debug.log('Approved referenced claim [' + qs + ']');
                                widget.toggle(false).setDisabled(true);                
                            });
                        });
                    }
                    // Add a new unreferenced claim
                    else {
                        ps.commons.createClaim(subject, property, object, qualifiers)
                        .fail(function(error) {
                            widget.toggle(false).setDisabled(true);
                            return ps.commons.reportError(error);
                        })
                        .done(function() {
                            ps.commons.setStatementState(qs, ps.globals.STATEMENT_STATES.approved, widget.dataset, widget.statementType)
                            .fail(function() {
                                widget.toggle(false).setDisabled(true);
                            })
                            .done(function() {
                                ps.commons.debug.log('Approved claim with no reference [' + qs + ']');
                                widget.toggle(false).setDisabled(true);                
                            });
                        });
                    }
                }
            });
        };

        SearchResultRow.prototype.reject = function() {
            var widget = this;
            widget.showProgressBar();
            ps.commons.setStatementState(widget.quickStatement, ps.globals.STATEMENT_STATES.rejected, widget.dataset, widget.statementType)
            .fail(function() {
                widget.toggle(false).setDisabled(true);
            })
            .done(function() {
                var message = widget.statementType === 'claim'
                ? 'Rejected claim with no reference [' + widget.quickStatement + ']'
                : 'Rejected referenced claim [' + widget.quickStatement + ']';
                ps.commons.debug.log(message);
                widget.toggle(false).setDisabled(true);                
            });
        }

        SearchResultRow.prototype.showProgressBar = function () {
            var progressBar = new OO.ui.ProgressBarWidget();
            progressBar.$element.css('max-width', '100%');
            this.$element.empty()
                .append(
                    $('<td>')
                        .attr('colspan', 7)
                        .append(progressBar.$element)
                );
        };

        SparqlResultRow.prototype.showProgressBar = function () {
            var progressBar = new OO.ui.ProgressBarWidget();
            progressBar.$element.css('max-width', '100%');
            this.$element.empty()
                .append(
                    $('<td>')
                        .attr('colspan', 5)
                        .append(progressBar.$element)
                );
        };

        /**
         * The main dialog
         *
         * @class
         * @extends OO.ui.Widget
         */
        function ListDialog(config) {
            ListDialog.super.call(this, config);
        }
        OO.inheritClass(ListDialog, OO.ui.ProcessDialog);
        ListDialog.static.name = 'ps-list';
        ListDialog.static.title = 'primary sources filter';
        ListDialog.static.size = 'full';
        ListDialog.static.actions = [
            { label: 'Close', flags: 'safe' }
        ];

        ListDialog.prototype.initialize = function () {
            ListDialog.super.prototype.initialize.apply(this, arguments);

            var widget = this;

            /**
             * Dataset menu
             * @type {OO.ui.DropdownInputWidget}
             */
            this.datasetInput = new OO.ui.DropdownInputWidget();
            ps.commons.getDatasets(function (datasets) {
                var options = [{ data: '', label: 'All sources' }];
                datasets.forEach(function (item) {
                    var uri = item.dataset;
                    options.push({ data: uri, label: ps.commons.datasetUriToLabel(uri) });
                });
                widget.datasetInput.setOptions(options)
                    .setValue(ps.globals.DATASET);
            });

            /**
             * Baked filters menu
             * @type {OO.iu.DropdownWidget}
             */
            this.bakedFilters = new OO.ui.DropdownWidget({
                label: 'Pick one',
                menu: {
                    items: [
                        new OO.ui.MenuSectionOptionWidget({
                            label: 'General'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: 'subjects',
                            label: 'All subject items'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: 'properties',
                            label: 'All properties'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: 'values',
                            label: 'All item values'
                        }),
                        new OO.ui.MenuSectionOptionWidget({
                            label: 'People'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: 'Q6581097',
                            label: 'Males'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: 'Q6581072',
                            label: 'Females'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: 'P19',
                            label: 'Places of birth'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: 'P569',
                            label: 'Dates of birth'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: '',
                            label: 'Journey destinations'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: 'P463',
                            label: 'Members of'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: 'P937',
                            label: 'Work locations'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: 'P20',
                            label: 'Places of death'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: 'P570',
                            label: 'Dates of death'
                        }),
                        new OO.ui.MenuSectionOptionWidget({
                            label: 'Occupations'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: 'Q11569986',
                            label: 'Painters'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: 'Q11569986',
                            label: 'Printmakers'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: 'Q482980',
                            label: 'Authors'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: 'Q1097498',
                            label: 'Rulers'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: 'Q82955',
                            label: 'Politicians'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: 'Q2259532',
                            label: 'Clerics'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: 'Q2516866',
                            label: 'Publishers'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: 'Q16631371',
                            label: 'Researchers'
                        }),
                        new OO.ui.MenuOptionWidget({
                            data: 'Q1281618',
                            label: 'Sculptors'
                        })
                    ]
                }
            })
            .connect(this, {
                labelChange: function() {
                    if (this.bakedFilters.getMenu().findSelectedItem()) {
                        this.itemValueInput.setDisabled(true);
                        this.propertyInput.setDisabled(true);
                        this.sparqlQuery.setDisabled(true);
                    } else {
                        this.itemValueInput.setDisabled(false);
                        this.propertyInput.setDisabled(false);
                        this.sparqlQuery.setDisabled(false);
                    }
                }
            });
            this.bakedFilters.getMenu().connect(this, {choose: 'onOptionSubmit'});

            /**
             * Entity value autocompletion
             */
            var itemValueCache = populateAutocompletionCache(ps.globals.API_ENDPOINTS.VALUES_SERVICE);
            this.itemValueInput = new AutocompleteWidget({
                placeholder: 'Type something you are interested in, like "politician"',
                cache: itemValueCache
            })
            .connect(this, {
                change: function() {
                    if (this.itemValueInput.getValue() || this.propertyInput.getValue()) {
                        this.bakedFilters.setDisabled(true);
                        this.sparqlQuery.setDisabled(true);
                    } else {
                        this.bakedFilters.setDisabled(false);
                        this.sparqlQuery.setDisabled(false);
                    }
                },
                enter: 'onOptionSubmit'
            });

            /**
             * Property autocompletion
             */
            var propertyCache = populateAutocompletionCache(ps.globals.API_ENDPOINTS.PROPERTIES_SERVICE);
            this.propertyInput = new AutocompleteWidget({
                placeholder: 'Type a property like "date of birth"',
                cache: propertyCache
            })
            .connect(this, {
                change: function() {
                    if (this.propertyInput.getValue() || this.itemValueInput.getValue()) {
                        this.bakedFilters.setDisabled(true);
                        this.sparqlQuery.setDisabled(true);
                    } else {
                        this.bakedFilters.setDisabled(false);
                        this.sparqlQuery.setDisabled(false);
                    }
                },
                enter: 'onOptionSubmit'                
            });

            /**
             * Arbitrary SPARQL query input
             * @type {OO.ui.MultilineTextInputWidget}
             */
            this.sparqlQuery = new OO.ui.MultilineTextInputWidget({
                placeholder: 'Browse suggestions with SPARQL',
                autosize: true
            })
            .connect(this, {
                change: function() {
                    if (this.sparqlQuery.getValue()) {
                        this.datasetInput.setDisabled(true);
                        this.bakedFilters.setDisabled(true);
                        this.itemValueInput.setDisabled(true);
                        this.propertyInput.setDisabled(true);
                    } else {
                        this.datasetInput.setDisabled(false);
                        this.bakedFilters.setDisabled(false);
                        this.itemValueInput.setDisabled(false);
                        this.propertyInput.setDisabled(false);
                    }
                },
                enter: 'onOptionSubmit'
            });

            this.loadButton = new OO.ui.ButtonInputWidget({
                label: 'Run',
                flags: 'progressive',
                type: 'submit'
            })
            .connect(this, { click: 'onOptionSubmit' });

            var fieldset = new OO.ui.FieldsetLayout({
                classes: ['container']
            });
            fieldset.addItems([
                new OO.ui.FieldLayout(this.datasetInput, { label: 'Dataset', align: 'right' }),
                new OO.ui.FieldLayout(this.bakedFilters, { label: 'Baked filters', align: 'right' }),
                new OO.ui.FieldLayout(this.itemValueInput, { label: 'Entity of interest', align: 'right' }),
                new OO.ui.FieldLayout(this.propertyInput, { label: 'Property of interest', align: 'right' }),
                new OO.ui.FieldLayout(this.sparqlQuery, { label: 'SPARQL query', align: 'right' }),
                new OO.ui.FieldLayout(this.loadButton, { label: ' ', align: 'right' }) // Hack to place the button under the other fields
            ])
            var formPanel = new OO.ui.PanelLayout({
                padded: true,
                framed: true
            });
            formPanel.$element.append(fieldset.$element);

            // Main panel
            this.mainPanel = new OO.ui.PanelLayout({
                padded: true,
                scrollable: true
            });

            // Final layout
            this.stackLayout = new OO.ui.StackLayout({
                continuous: true
            });
            this.stackLayout.addItems([formPanel, this.mainPanel]);
            this.$body.append(this.stackLayout.$element);
        };

        /**
         * @inheritdoc
         *
         * N.B.: Re-implemented here because the MediaWiki Vagrant instance on VPS
         * has a dummy implementation, i.e., function(){return;}
         * Modify to emit 'enter' on Ctrl/Meta+Enter, instead of plain Enter
         */
        OO.ui.MultilineTextInputWidget.prototype.onKeyPress = function ( e ) {
            if (
                ( this.getValue() && e.which === OO.ui.Keys.ENTER && ( e.ctrlKey || e.metaKey ) ) ||
                // Some platforms emit keycode 10 for ctrl+enter in a textarea
                e.which === 10
            ) {
                this.emit( 'enter', e );
            }
        };

        ListDialog.prototype.onOptionSubmit = function () {
            this.mainPanel.$element.empty();
            this.table = null;
            // The dataset field is needed for all filters but the arbitrary SPARQL query
            var filteredDataset = this.datasetInput.getValue();

            // Default search
            if (!this.bakedFilters.isDisabled()
            && !this.propertyInput.isDisabled()
            && !this.itemValueInput.isDisabled()
            && !this.sparqlQuery.isDisabled()) {
                var filledQuery = searchSparqlQuery.replace('{{PROPERTY}}', '?property');
                var bindings = '?subject ?property ?statement_node ?value ?reference_property ?reference_value';
                if (filteredDataset) {
                    filledQuery = filledQuery
                    .replace('{{DATASET}}', '<' + filteredDataset + '>')
                    .replace('{{FILTER}}', '');
                } else {
                    filledQuery = filledQuery
                    .replace('{{DATASET}}', '?dataset')
                    .replace('{{FILTER}}', datasetFilter);
                    bindings += ' ?dataset';
                }
                this.sparql = filledQuery.replace('{{BINDINGS}}', bindings);
                this.sparqlOffset = 0;
                this.sparqlLimit = 100;
                this.filteredDataset = filteredDataset;
                this.filteredProperty = null;
                this.filteredItemValue = null;
                console.log('SEARCH:', this.sparql);
                this.executeSearch();
            }
            // Baked filters
            else if (!this.bakedFilters.isDisabled()) {
                var bakedFiltersMenu = this.bakedFilters.getMenu();
                var bakedSelection = bakedFiltersMenu.findSelectedItem();
                var baked = bakedSelection.getData();
                // Reset selection and meaningful label
                bakedFiltersMenu.selectItem();
                this.bakedFilters.setLabel(new OO.ui.HtmlSnippet('Pick one (was <i>' + bakedSelection.getLabel() + '</i>)'));
                switch (baked) {
                    case 'subjects':
                        this.sparql = subjectsSparqlQuery;
                        console.log('BAKED FILTER SUBJECT ONLY:', this.sparql);
                        this.sparqlOffset = 0;
                        this.sparqlLimit = 100;
                        this.executeSparqlQuery();
                        break;
                    case 'properties':
                        this.executeServiceCall(ps.globals.API_ENDPOINTS.PROPERTIES_SERVICE);
                        break;
                    case 'values':
                        this.executeServiceCall(ps.globals.API_ENDPOINTS.VALUES_SERVICE);
                        break;
                    default:
                        var filledQuery;
                        // QIDs, just display the subjects
                        if (baked.startsWith('Q')) {
                            filledQuery = searchWithValueSparqlQuery
                            .replace('{{BINDINGS}}', 'DISTINCT (?subject AS ?' + bakedSelection.getLabel() + ')')
                            .replace('{{PROPERTY}}', '?property')
                            .replace('{{VALUE}}', baked);
                            if (filteredDataset) {
                                filledQuery = filledQuery
                                .replace('{{DATASET}}', '<' + filteredDataset + '>')
                                .replace('{{FILTER}}', '');
                            } else {
                                filledQuery = filledQuery
                                .replace('{{DATASET}}', '?dataset')
                                .replace('{{FILTER}}', datasetFilter);
                            }
                            this.sparql = filledQuery;
                            console.log('BAKED FILTER WITH VALUE:', this.sparql);
                            this.sparqlOffset = 0;
                            this.sparqlLimit = 100;
                            this.executeSparqlQuery();
                        }
                        // PIDs, perform a search query
                        else {
                            var bindings = '?subject ?statement_node ?value ?reference_property ?reference_value';
                            filledQuery = searchSparqlQuery.replace('{{PROPERTY}}', 'p:' + baked);
                            if (filteredDataset) {
                                filledQuery = filledQuery
                                .replace('{{DATASET}}', '<' + filteredDataset + '>')
                                .replace('{{FILTER}}', '');
                            } else {
                                filledQuery = filledQuery
                                .replace('{{DATASET}}', '?dataset')
                                .replace('{{FILTER}}', datasetFilter);
                                bindings += ' ?dataset';
                            }
                            this.sparql = filledQuery.replace('{{BINDINGS}}', bindings);
                            console.log('BAKED FILTER WITH PROPERTY:', this.sparql);
                            this.sparqlOffset = 0;
                            this.sparqlLimit = 300;
                            this.filteredDataset = filteredDataset;
                            this.filteredProperty = baked;
                            this.filteredItemValue = null;
                            this.executeSearch();
                            break;
                        }
                }
            }
            // Arbitrary SPARQL query
            else if (!this.sparqlQuery.isDisabled()) {
                this.sparql = this.sparqlQuery.getValue();
                this.executeSparqlQuery();
            }
            // Property / item value autocompletion
            else {
                var filteredItemValue = this.itemValueInput.getValue() ? this.itemValueInput.getData() : null;
                var filteredProperty = this.propertyInput.getValue() ? this.propertyInput.getData() : null;
                var filledQuery;
                var bindings = '?subject {{PROPERTY}} ?statement_node {{VALUE}} ?reference_property ?reference_value';
                if (filteredItemValue) {
                    filledQuery = searchWithValueSparqlQuery.replace('{{VALUE}}', filteredItemValue);
                    bindings = bindings.replace('{{VALUE}}', '');
                } else {
                    filledQuery = searchSparqlQuery;
                    bindings = bindings.replace('{{VALUE}}', '?value');
                }
                if (filteredProperty) {
                    filledQuery = filledQuery.replace('{{PROPERTY}}', 'p:' + filteredProperty);
                    bindings = bindings.replace('{{PROPERTY}}', '');
                } else {
                    filledQuery = filledQuery.replace('{{PROPERTY}}', '?property');
                    bindings = bindings.replace('{{PROPERTY}}', '?property');
                }
                if (filteredDataset) {
                    filledQuery = filledQuery
                    .replace('{{DATASET}}', '<' + filteredDataset + '>')
                    .replace('{{FILTER}}', '');
                } else {
                    filledQuery = filledQuery
                    .replace('{{DATASET}}', '?dataset')
                    .replace('{{FILTER}}', datasetFilter);
                    bindings += ' ?dataset';
                }
                this.sparql = filledQuery.replace('{{BINDINGS}}', bindings);
                console.log('AUTOCOMPLETION:', this.sparql);
                this.sparqlOffset = 0;
                this.sparqlLimit = 300;
                this.filteredDataset = filteredDataset;
                this.filteredProperty = filteredProperty;
                this.filteredItemValue = filteredItemValue;
                this.executeSearch();
            }
        };

        ListDialog.prototype.executeServiceCall = function (url) {
            var widget = this;

            var progressBar = new OO.ui.ProgressBarWidget();
            progressBar.$element.css('max-width', '100%');
            widget.mainPanel.$element.append(progressBar.$element);

            $.get(
                url,
                function (data) {
                    progressBar.$element.remove();
                    // Populate the result label cache
                    var ids = new Set();
                    for (var dataset in data) {
                        if (data.hasOwnProperty(dataset)) {
                            data[dataset].forEach(function (entity) {
                                ids.add(entity);
                            });
                        }
                    }
                    console.log('IDs FROM SERVICE CALL RESULT:', ids);
                    ps.commons.loadEntityLabels(Array.from(ids));
                    widget.displayServiceResult(data);
                }
            )
                .fail(function (xhr, textStatus) {
                    progressBar.$element.remove();
                    reportError('Failed loading statements');
                })
        };

        ListDialog.prototype.onNextButtonSubmitSearch = function () {
            this.nextStatementsButton.$element.remove();
            this.executeSearch(true);
        };

        ListDialog.prototype.onNextButtonSubmit = function () {
            this.nextStatementsButton.$element.remove();
            this.executeSparqlQuery(true);
        };

        ListDialog.prototype.getBodyHeight = function () {
            return window.innerHeight - 100;
        };

        ListDialog.prototype.executeSearch = function (more=false) {
            var widget = this;
            var progressBar = new OO.ui.ProgressBarWidget();
            progressBar.$element.css('max-width', '100%');
            widget.mainPanel.$element.append(progressBar.$element);
            $.ajax(
                ps.globals.API_ENDPOINTS.SPARQL_SERVICE,
                {
                    data: { query: widget.sparql
                            .replace('{{OFFSET}}', widget.sparqlOffset)
                            .replace('{{LIMIT}}', widget.sparqlLimit)
                    },
                    accepts: { tsv: 'text/tab-separated-values' },
                    converters: { 'text tsv': function(result){
                        var lines = result.split('\r\n');
                        lines.pop();
                        var headers = lines.shift();
                        var bindings = lines.map(function (line) {
                            var clean = line.replace(/[<>"]/g, '');
                            return clean
                                .split('\t')
                                .filter(String)
                                .map(binding => binding.split('^^')[0]);
                        });
                        return {headers: headers.replace(/\?/g, '').split('\t'), bindings: bindings};
                    }},
                    dataType: 'tsv'
                }
            )
            .done(function(data) {
                progressBar.$element.remove();
                    // Handle empty results
                    if (data.bindings.length === 0) {
                        var label = more ? 'No more statements' : 'No statements found'
                        var noticeIcon = new OO.ui.IconWidget({
                            icon: 'notice'
                        });
                        var noStatements = new OO.ui.LabelWidget({
                            label: label
                        });
                        widget.mainPanel.$element.append(noticeIcon.$element, noStatements.$element);
                    } else {
                        // Populate the result label cache
                        var ids = new Set();
                        data.bindings.forEach(function (binding) {
                            binding.forEach(function (value) {
                                var matchedId = /[QP]\d+$/.exec(value);
                                if (matchedId) {
                                    ids.add(matchedId[0]);
                                }
                            });
                        });
                        ps.commons.loadEntityLabels(Array.from(ids));

                        // Paging
                        widget.sparqlOffset += widget.sparqlLimit;
                        
                        widget.displaySearchResult(data.headers, data.bindings);
                        if (data.bindings.length > 0) {
                            widget.nextStatementsButton = new OO.ui.ButtonWidget({
                                label: 'Load more'
                            });
                            widget.nextStatementsButton.connect(
                                widget,
                                { click: 'onNextButtonSubmitSearch' }
                            );
                            widget.mainPanel.$element.append(
                                widget.nextStatementsButton.$element
                            );
                        }
                    }
            })
            .fail(handleSparqlError(xhr, progressBar, widget));
        };

        ListDialog.prototype.executeSparqlQuery = function (more=false) {
            var widget = this;
            var progressBar = new OO.ui.ProgressBarWidget();
            progressBar.$element.css('max-width', '100%');
            widget.mainPanel.$element.append(progressBar.$element);
            // Run SPARQL query
            $.get(
                ps.globals.API_ENDPOINTS.SPARQL_SERVICE,
                {
                    query: widget.sparql
                        .replace('{{OFFSET}}', widget.sparqlOffset)
                        .replace('{{LIMIT}}', widget.sparqlLimit)
                },
                function (data) {
                    progressBar.$element.remove();
                    // Handle empty results
                    if (data.results.bindings.length === 0) {
                        var label = more ? 'No more statements' : 'No statements found'
                        var noticeIcon = new OO.ui.IconWidget({
                            icon: 'notice'
                        });
                        var noStatements = new OO.ui.LabelWidget({
                            label: label
                        });
                        widget.mainPanel.$element.append(noticeIcon.$element, noStatements.$element);
                    } else {
                        // Populate the result label cache
                        var ids = new Set();
                        data.head.vars.forEach(function (header) {
                            data.results.bindings.forEach(function (binding) {
                                if (binding.hasOwnProperty(header)) {
                                    var value = binding[header].value;
                                    if (binding[header].type === 'uri') {
                                        var matchedId = /[QP]\d+$/.exec(value);
                                        if (matchedId) {
                                            ids.add(matchedId[0]);
                                        }
                                    }
                                }
                            });
                        });
                        console.log('IDs FROM SPARQL QUERY RESULT:', ids);
                        ps.commons.loadEntityLabels(Array.from(ids));

                        // Paging
                        widget.sparqlOffset += widget.sparqlLimit;
                        widget.displaySparqlResult(data.head.vars, data.results.bindings);
                        if (data.hasOwnProperty('results')) {
                            widget.nextStatementsButton = new OO.ui.ButtonWidget({
                                label: 'Load more'
                            });
                            widget.nextStatementsButton.connect(
                                widget,
                                { click: 'onNextButtonSubmit' }
                            );
                            widget.mainPanel.$element.append(
                                widget.nextStatementsButton.$element
                            );
                        }
                    }
                },
                'json'
            )
                .fail(handleSparqlError(xhr, progressBar, widget))
        };

        ListDialog.prototype.displayServiceResult = function (result) {
            var widget = this;
            if (this.table === null) {
                var datasetLabels = [];
                Object.getOwnPropertyNames(result)
                .forEach(function (uri) {
                    datasetLabels.push(ps.commons.datasetUriToLabel(uri));
                })
                this.initResultTable(datasetLabels);
            }
            for (var dataset in result) {
                if (result.hasOwnProperty(dataset)) {
                    var entities = result[dataset];
                    entities.forEach(function (entityId) {
                        var row = new ServiceResultRow(entityId);
                        widget.table.append(row.$element);
                    })
                }
            }
        };

        ListDialog.prototype.displaySearchResult = function (headers, bindings) {
            var widget = this;
            var filteredProperty = widget.filteredProperty;
            var filteredItemValue = widget.filteredItemValue;
            var filteredDataset = widget.filteredDataset;
            //console.log('FILTER ATTRIBUTES', filteredProperty, filteredItemValue, filteredDataset);
            /*
             * Subject, property, statement_node, value, reference_property, reference_value, dataset
             *   [0]      [1]          [2]              [3]                [4]               [5]          [6]
             */
            // In case of defined filters, add headers and bindings accordingly
            if (filteredProperty) {
                headers.splice(1, 0, 'property');
                bindings.forEach(function(binding) {
                    binding.splice(1, 0, filteredProperty);
                })
            }
            if (filteredItemValue) {
                headers.splice(3, 0, 'value');
                bindings.forEach(function(binding) {
                    binding.splice(3, 0, filteredItemValue);
                })
            }
            if (widget.table === null) {
                headers.splice(2, 1); // Get rid of statement_node
                widget.initSearchTable(headers);
            }
            var threshold = filteredDataset ? 4 : 5; // Handle dataset binding
            // Merge statements on common statement_node
            var triples = bindings.filter(binding => binding.length === threshold);
            var full =  bindings.filter(binding => binding.length > threshold);
            var merged = full.map(function(statement) {
                var toReturn;
                $.each(triples, function(k, triple) {
                    if (triple[2] === statement[2]) {
                        toReturn = $.extend([], triple, statement);
                        // Keep the triple statement value
                        toReturn[3] = triple[3];
                        return false;
                    }      
                });
                return toReturn;
            });
            var finalBindings = merged.filter(Boolean); // Filter undefined values
            //console.log('MERGED BINDINGS', finalBindings);
            // Build the URL blacklist check
            var isBlacklisted;
            ps.commons.getBlacklistedSourceUrls()
            .done(function(blacklist){
                isBlacklisted = ps.commons.isBlackListedBuilder(blacklist);
            })
            .fail(function(){
                ps.commons.debug.log('Could not obtain blacklisted source URLs');
            });
            finalBindings.forEach(function (binding) {
                binding.splice(2, 1); // Get rid of statement_node
                var row = new SearchResultRow(binding, filteredProperty, filteredItemValue, filteredDataset, isBlacklisted);
                // console.log('SEARCH RESULT ROW OBJECT:', row);
                if (row) {
                    widget.table.append(row.$element);
                }
            });
        };

        ListDialog.prototype.displaySparqlResult = function (headers, bindings) {
            var widget = this;
            if (this.table === null) {
                this.initResultTable(headers);
            }
            bindings.forEach(function (binding) {
                var row = new SparqlResultRow(headers, binding);
                widget.table.append(row.$element);
            });

        };

        ListDialog.prototype.initSearchTable = function (headers) {
            var htmlHeaders = [];
            headers.forEach(function (header) {
                var formatted = header
                .replace('_', ' ')
                .replace(/\w+/, word => word.charAt(0).toUpperCase() + word.substr(1));
                htmlHeaders.push($('<th>').text(formatted));
            });
            this.table = $('<table>')
            .addClass('wikitable')
            .css('width', '100%')
            .append(
                $('<thead>').append(
                    $('<tr>').append(
                        htmlHeaders,
                        $('<th>')
                        .text('Actions')
                    )
                )
            )
            this.mainPanel.$element.append(this.table);
        };

        ListDialog.prototype.initResultTable = function (headers) {
            var htmlHeaders = [];
            headers.forEach(function (header) {
                htmlHeaders.push($('<th>').text(header));
            });
            this.table = $('<table>')
                .addClass('wikitable')
                .css('width', '100%')
                .append(
                    $('<thead>').append(
                        $('<tr>').append(
                            htmlHeaders
                        )
                    )
                );
            this.mainPanel.$element.append(this.table);
        };

        // Add modal to window
        windowManager.addWindows([new ListDialog()]);

        linkToBind.click(function () {
            windowManager.openWindow('ps-list');
        });
        
    };

    // BEGIN: public functions
    ps.filter = {
        init: filterDialog
    };
    // END: public functions

    // BEGIN: private functions
    function populateAutocompletionCache(service) {
        var filteredDataset = ps.globals.DATASET;
        var cache = {};
        var addLabels = function (ids, currentCache) {
            // getEntityLabels return Window when the IDs are less than the threshold
            if (ids.length > 40) {
                ps.commons.getEntityLabels(ids)
                    .then(function (labels) {
                        currentCache = $.extend(currentCache, labels);
                    });
            }
            else {
                ps.commons.getFewEntityLabels(ids)
                    .then(function (labels) {
                        currentCache = $.extend(currentCache, labels);
                    });
            }
            return currentCache;
        };
        $.get(service, function (data) {
            if (filteredDataset) {
                cache = addLabels(data[filteredDataset], cache);
            }
            else {
                for (var dataset in data) {
                    if (data.hasOwnProperty(dataset)) {
                        var ids = data[dataset];
                        cache = addLabels(ids, cache);
                    }
                }
            }
        })
            .fail(function (xhr, textStatus) {
                ps.commons.debug.log('The call to ' + service + ' went wrong:', textStatus);
                reportError('Could not cache suggestions for autocompletion');
            });
        return cache;
    };

    function handleSparqlError(xhr, progressBar, widget) {
        // A bad request means a bad query
        if (xhr.status === 400) {
            // java.util.concurrent.ExecutionException: org.openrdf.query.MalformedQueryException: Encountered " "a" "a "" at line 1, column 1.
            var exceptionParts = xhr.responseText.split('\n')[1].split('Exception');
            var exceptionType = exceptionParts[1].split('.').pop().replace(/([A-Z])/g, ' $1').trim();
            progressBar.$element.remove();
            var alertIcon = new OO.ui.IconWidget({
                icon: 'alert'
            });
            var typeMessage = new OO.ui.LabelWidget({
                label: new OO.ui.HtmlSnippet('<b>' + exceptionType + '</b>')
            });
            var reasonMessage = new OO.ui.LabelWidget({
                label: exceptionParts[2]
            });
            widget.mainPanel.$element.append(alertIcon.$element, typeMessage.$element, reasonMessage.$element);
        }
    }
    // END: private functions

    mw.ps = ps;

    console.log("Primary sources tool - Filter loaded");
    
})(mediaWiki, jQuery);
