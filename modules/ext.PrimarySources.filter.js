/**
 *
 * PrimarySources Filter component.
 *
 * When the user clicks on the Primary Sources filter link (currently Primary Sources list),
 * a modal window will open; the user can view a table of suggested statements with eventual
 * references by building filters in several ways.
 *
 */
(function (mw, $) {

    console.log("Primary sources tool - filter");

    var ps = mw.ps || {};

    /* BEGIN: baked SPARQL queries */
    var searchSparqlQuery = '   SELECT *   ' +
        '   WHERE {  ' +
        '     GRAPH {{DATASET}} {  ' +
        '       ?subject a wikibase:Item ;  ' +
        '                  {{PROPERTY}} ?statement_node .  ' +
        '       ?statement_node ?statement_property ?statement_value .  ' +
        '       OPTIONAL {  ' +
        '         ?statement_value ?reference_property ?reference_value .  ' +
        '       }  ' +
        '     }  ' +
        '   }  ' +
        '   OFFSET {{OFFSET}}  ' +
        '  LIMIT {{LIMIT}}  ';

    var searchWithValueSparqlQuery = '   SELECT *  ' +
        '   WHERE {  ' +
        '     GRAPH {{DATASET}} {  ' +
        '       ?subject a wikibase:Item ;  ' +
        '                  {{PROPERTY}} ?statement_node .  ' +
        '       { SELECT ?statement_node WHERE { ?statement_node ?statement_property wd:{{VALUE}} . } }   ' +
        '       ?statement_node ?statement_property ?statement_value .  ' +
        '       OPTIONAL {  ' +
        '         ?statement_value ?reference_property ?reference_value .}  ' +
        '     }  ' +
        '   }  ' +
        '   OFFSET {{OFFSET}}  ' +
        '  LIMIT {{LIMIT}}  ';
    var subjectsSparqlQuery = "SELECT ?subject WHERE { ?subject a wikibase:Item } OFFSET {{offset}} LIMIT {{limit}}";
    /* END: baked SPARQL queries */

    function _listDialog(windowManager, button) {
        /**
         * A row displaying a statement
         *
         * @class
         * @extends OO.ui.Widget
         * @cfg {Object} [statement] the statement to display
         */
        function StatementRow(config) {
            StatementRow.super.call(this, config);

            this.statement = config.statement;
            var widget = this;

            var numberOfSource = 0;
            var numberOfQualifier = 0;

            numberOfSource = this.statement.source.length;
            numberOfQualifier = this.statement.qualifiers.length;

            console.log("ST ROW");
            console.log(this.statement);

            // TODO verificare StatementRow
            var htmlCallbacks = [
                ps.commons.getValueHtml(this.statement.subject), //0
                ps.commons.getValueHtml(this.statement.predicate), //1
                ps.commons.getValueHtml(this.statement.object, this.statement.predicate) //2
            ];

            this.statement.qualifiers.forEach(function (qualifier) {
                htmlCallbacks.push(ps.commons.getValueHtml(qualifier.qualifierProperty));
                htmlCallbacks.push(
                    ps.commons.getValueHtml(qualifier.qualifierObject, qualifier.qualifierProperty)
                );
            });

            // Add reference to table
            this.statement.source.forEach(function (source) {
                htmlCallbacks.push(ps.commons.getValueHtml(source.sourceProperty));
                htmlCallbacks.push(
                    ps.commons.getValueHtml(source.sourceObject, source.sourceProperty)
                );
            });

            $.when.apply(this, htmlCallbacks).then(function () {
                var numberOfArguments = arguments.length;

                // obj to array
                var args = Object.values(arguments);

                var subjectHtml = args[0];
                var propertyHtml = args[1];
                var objectHtml = args[2];

                var sourcePropertyHtml = null;
                var sourceValueHtml = null;

                var qualifiersHtml = [];
                var q = [];

                // Check presence of qualifiers and sources
                if (numberOfQualifier > 0 && numberOfSource > 0) {
                    // Qualif YES, Source YES
                    q = args.slice(3, numberOfArguments - 2);
                    for (var c = 0; c < q.length; c += 2) {
                        qualifiersHtml.push([q[c], q[c + 1]]);
                    }

                    sourcePropertyHtml = args[numberOfArguments - 2];
                    sourceValueHtml = args[numberOfArguments - 1];

                } else if (numberOfQualifier > 0 && numberOfSource === 0) {
                    // Qualif YES, Source NO
                    q = args.slice(3, numberOfArguments);
                    for (var k = 0; k < q.length; k += 2) {
                        qualifiersHtml.push([q[k], q[k + 1]]);
                    }

                } else if (numberOfQualifier === 0 && numberOfSource > 0) {
                    // Qualif NO, Source YES
                    sourcePropertyHtml = args[numberOfArguments - 2];
                    sourceValueHtml = args[numberOfArguments - 1];

                } else if (numberOfQualifier === 0 && numberOfSource === 0) {
                    // // Qualif NO, Source NO
                }


                //  Qualif table
                var $tableQualifiers = $('<table>');
                $tableQualifiers.addClass('qualifTable')
                    .append(
                        $('<tr>').append(
                            $('<td>')
                                .attr('colspan', 2)
                                .html(objectHtml)
                        )
                    );

                qualifiersHtml.forEach(function (row) {
                    $tableQualifiers.append(
                        $('<tr>').append(
                            $('<td>').html(row[0]),
                            $('<td>').html(row[1])
                        )
                    );
                });

                // Source table
                var $tableSource = $('<table>');
                $tableSource.append(
                    $('<tr>').append(
                        $('<td>')
                            .html(sourcePropertyHtml),
                        $('<td>')
                            .html(sourceValueHtml)
                    )
                );


                var approveButton = new OO.ui.ButtonWidget({
                    label: 'Approve',
                    flags: 'constructive'
                });
                approveButton.connect(widget, { click: 'approve' });

                var rejectButton = new OO.ui.ButtonWidget({
                    label: 'Reject',
                    flags: 'destructive'
                });
                rejectButton.connect(widget, { click: 'reject' });

                var buttonGroup = new OO.ui.ButtonGroupWidget({
                    items: [approveButton, rejectButton]
                });

                var previewButton = $('<button>').addClass('preview-button').text("Preview");
                previewButton.click(function () {
                    mw.ps.referencePreview.openNav(
                        $(subjectHtml).text(),
                        $(propertyHtml).text(),
                        $(objectHtml).text(),
                        $(sourceValueHtml).text(),
                        $(buttonGroup.$element)
                    )
                });

                //  no preview button if no source
                var previewHtml = "";
                if (numberOfSource > 0) {
                    previewHtml = previewButton;
                }

                // Main row
                widget.$element
                    .attr('data-id', widget.statement.id)
                    .append(
                        $('<tr>').append(
                            $('<td>')
                                .html(subjectHtml),
                            $('<td>')
                                .html(propertyHtml),
                            $('<td>')
                                .html($tableQualifiers),
                            $('<td>')
                                .append($tableSource),
                            $('<td>')
                                .append(previewHtml),
                            $('<td>')
                                .append(buttonGroup.$element)
                        )
                    );

                // Check that the statement don't already exist
                ps.commons.getClaims(widget.statement.subject, widget.statement.predicate,
                    function (err, statements) {
                        for (var i in statements) {
                            ps.commons.buildValueKeysFromWikidataStatement(statements[i]);
                            if ($.inArray(
                                widget.statement.key,
                                ps.commons.buildValueKeysFromWikidataStatement(statements[i])
                            ) !== -1) {
                                widget.toggle(false).setDisabled(true);
                                if (widget.statement.source.length === 0) {
                                    ps.commons.setStatementState(widget.statement.id,
                                        ps.globals.STATEMENT_STATES.duplicate).done(function () {
                                            ps.commons.debug.log(widget.statement.id + ' tagged as duplicate');
                                        });
                                }
                            }
                        }
                    });
            });
        }
        OO.inheritClass(StatementRow, OO.ui.Widget);
        StatementRow.static.tagName = 'tbody';

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
                $('<tr>').append(cells)
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
                        $('<tr>').append(cell)
                    );
        }
        OO.inheritClass(ServiceResultRow, OO.ui.Widget);
        ServiceResultRow.static.tagName = 'tbody';

        function AutocompleteWidget(config) {
            OO.ui.SearchInputWidget.call(this, config);
            OO.ui.mixin.LookupElement.call(this, config);
            // The Web service returning autocompletion suggestions
            this.service = config.service;
        };
        OO.inheritClass(AutocompleteWidget, OO.ui.SearchInputWidget);
        OO.mixinClass(AutocompleteWidget, OO.ui.mixin.LookupElement);

        /**
         * @inheritdoc
         */
        AutocompleteWidget.prototype.getLookupRequest = function () {
            var value = this.getValue();
            var deferred = $.Deferred();
            var suggestions = {};

            $.get(
                this.service,
                function (data) {
                    for (var ds in data) {
                        if (data.hasOwnProperty(ds)) {
                            var entities = data[ds];
                            entities.forEach(function (id) {
                                ps.commons.getEntityLabel(id)
                                    .then(function (label) {
                                        if (label.includes(value)) {
                                            suggestions[id] = label;
                                        }
                                    });
                            });
                        }
                    }
                    deferred.resolve(suggestions);
                }
            )
                .fail(function (xhr, textStatus) {
                    reportError('Could not retrieve suggestions for autocompletion');
                    deferred.reject(textStatus);
                })
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

        /**
         * On button click "Approve"
         */
        StatementRow.prototype.approve = function () {
            var widget = this;

            // TODO createclaim with reference

            // Check if is a duplicate (equal predicate and object)
            console.log("S P O: ");
            console.log(widget.statement.subject + " - " + widget.statement.predicate + " - " + widget.statement.object);

            // Get claims for item with ID 'widget.statement.subject' and property with ID 'widget.statement.predicate'
            // https://www.wikidata.org/w/api.php?action=help&modules=wbgetclaims
            console.log("API CALL");
            $.ajax({
                url: 'https://www.wikidata.org/w/api.php',
                data: {
                    action: 'wbgetclaims',
                    entity: widget.statement.subject,
                    property: widget.statement.predicate,
                    format: 'json',
                    origin: '*'
                },
                xhrFields: {
                    withCredentials: false
                },
                dataType: 'json'
            }).done(function (data) {

                var existingClaims = data['claims'];
                if (Object.keys(existingClaims).length > 0) {

                    // there are already some claim with this property
                    console.log("Existing claims");
                    console.log(existingClaims);

                    // array of values by widget.statement.predicate
                    var existingValues = existingClaims[widget.statement.predicate];

                    console.log(" --- ");
                    for (var c = 0; c < existingValues.length; c++) {
                        var existingObj = ps.commons.jsonToTsvValue(existingValues[c].mainsnak.datavalue);

                        if (existingObj === widget.statement.object) {
                            console.log("Duplicato ma guarda i qualif e le ref");
                            console.log(widget.statement.object + " -> Nuovo: " + existingObj);

                            // se ha qualificatori aggiungilo come nuovo
                            console.log(widget.statement.qualifiers);
                            console.log(existingValues[c].qualifiers);

                            for (var z = 0; z < widget.statement.qualifiers.length; z++) {
                                // puo essere undefined se non esiste un qulif con quella prop
                                // oppure un array

                                var qualifP = widget.statement.qualifiers[z].qualifierProperty;
                                existingValues[c].qualifiers[qualifP];

                                console.log("valore del qualif");
                                console.log(ps.commons.jsonToTsvValue(existingValues[c].qualifiers[qualifP][0].datavalue));
                            }


                        } else {
                            // create new claim (same prop)
                            console.log(widget.statement.object + " -> Nuovo: " + existingObj);
                        }
                    }
                    console.log(" --- ");

                } else {
                    // in this item there are not claim with this property
                    // create a new claim (new prop)
                    //
                }
            });

            /*
             - create claim (this is a new claim)
             - create claim with reference (this is a new claim)
             - create reference (thi is a claim already exists)
             */

            this.showProgressBar();
            // ps.commons.createClaim(
            //     this.statement.subject,
            //     this.statement.predicate,
            //     this.statement.object,
            //     this.statement.qualifiers
            // ).fail(function(error) {
            //     return ps.commons.reportError(error);
            // }).done(function() {
            //     // if (this.statement.source.length > 0) {
            //     //     return; // TODO add support of source review
            //     // }
            //     ps.commons.setStatementState(widget.statement.id, ps.globals.STATEMENT_STATES.approved)
            //         .done(function() {
            //             widget.toggle(false).setDisabled(true);
            //         });
            // });
        };

        /**
         * On button click "Reject"
         */
        StatementRow.prototype.reject = function () {
            var widget = this;

            this.showProgressBar();

            // setStatementState(quickStatement, state, dataset, type)

            var type = ((widget.statement.source.length > 0) ? 'reference' : 'claim');

            ps.commons.setStatementState(
                widget.statement.id,
                ps.globals.STATEMENT_STATES.rejected,
                widget.statement.dataset,
                type
            ).done(function () {
                widget.toggle(false).setDisabled(true);
            });
        };

        StatementRow.prototype.showProgressBar = function () {
            var progressBar = new OO.ui.ProgressBarWidget();
            progressBar.$element.css('max-width', '100%');
            this.$element.empty()
                .append(
                    $('<td>')
                        .attr('colspan', 4)
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
                        })
                    ]
                }
            })
            .connect(this, {
                labelChange: function() {
                    this.itemValueInput.setDisabled(true);
                    this.propertyInput.setDisabled(true);
                    this.sparqlQuery.setDisabled(true);
                }
            });

            /**
             * Entity value autocompletion
             */
            this.itemValueInput = new AutocompleteWidget({
                service: ps.globals.API_ENDPOINTS.VALUES_SERVICE,
                placeholder: 'Type something you are interested in, like "politician"',
            })
            .connect(this, {
                change: function() {
                    this.bakedFilters.setDisabled(true);
                    this.sparqlQuery.setDisabled(true);
                }
            });

            /**
             * Property autocompletion
             */
            this.propertyInput = new AutocompleteWidget({
                service: ps.globals.API_ENDPOINTS.PROPERTIES_SERVICE,
                placeholder: 'Type a property like "date of birth"',
            })
            .connect(this, {
                change: function() {
                    this.bakedFilters.setDisabled(true);
                    this.sparqlQuery.setDisabled(true);
                }
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
                    this.bakedFilters.setDisabled(true);
                    this.itemValueInput.setDisabled(true);
                    this.propertyInput.setDisabled(true);
                }
            });

            var loadButton = new OO.ui.ButtonInputWidget({
                label: 'Load',
                flags: 'progressive',
                type: 'submit'
            });
            loadButton.connect(this, { click: 'onOptionSubmit' });

            var fieldset = new OO.ui.FieldsetLayout({
                label: 'Filters',
                classes: ['container']
            });
            fieldset.addItems([
                new OO.ui.FieldLayout(this.datasetInput, { label: 'Dataset' }),
                new OO.ui.FieldLayout(this.bakedFilters, { label: 'Baked filters' }),
                new OO.ui.FieldLayout(this.itemValueInput, { label: 'Entity of interest' }),
                new OO.ui.FieldLayout(this.propertyInput, { label: 'Property of interest' }),
                new OO.ui.FieldLayout(this.sparqlQuery, { label: 'SPARQL query' }),
                new OO.ui.FieldLayout(loadButton)
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
         * OnOptionSubmit
         */
        /*
         * Dataset se c'è rimpiazza con <valore_variable> altrimenti ?dataset
         * property se c'è rimpiazza con p:valore_var altrimenti con ?property
         * se c'è il valore usare un'altra query
         * */
        ListDialog.prototype.onOptionSubmit = function () {
            this.mainPanel.$element.empty();
            this.table = null;
            var bakedFiltersMenu = this.bakedFilters.getMenu();
            var bakedSelection = bakedFiltersMenu.findSelectedItem();
            var sparql = this.sparqlQuery.getValue();

            if (bakedSelection !== null) {
                var bakedQuery = bakedSelection.getData();
                bakedFiltersMenu.selectItem();
                this.itemValueInput.setDisabled(false);
                this.propertyInput.setDisabled(false);
                this.sparqlQuery.setDisabled(false);
                switch (bakedQuery) {
                    case 'subjects':
                        this.sparql = subjectsSparqlQuery;
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
                        ps.commons.debug('Unexpected baked filter: "' + bakedQuery + '". Nothing will happen')
                        break;
                }
            }
            else if (sparql !== '') {
                // Use SPARQL endpoint
                this.bakedFilters.setDisabled(false);
                this.itemValueInput.setDisabled(false);
                this.propertyInput.setDisabled(false);
                this.sparql = sparql;
                this.executeSparqlQuery();
            } else {
                this.bakedFilters.setDisabled(false);
                this.sparqlQuery.setDisabled(false);
                
                var correct_query = searchSparqlQuery;
                if (this.itemValueInput.getValue().length > 0) {
                    correct_query = searchWithValueSparqlQuery;
                    correct_query = correct_query.replace(/\{\{VALUE\}\}/g, + this.itemValueInput.getValue());
                }

                if (this.propertyInput.getValue().length > 0) {
                    correct_query = correct_query.replace(/\{\{PROPERTY\}\}/g, 'p:' + this.propertyInput.getValue());
                } else {
                    correct_query = correct_query.replace(/\{\{PROPERTY\}\}/g, '?property');
                }

                if (this.datasetInput.getValue().length > 0) {
                    correct_query = correct_query.replace(/\{\{DATASET\}\}/g, '<' + this.propertyInput.getValue() + '>');
                } else {
                    correct_query = correct_query.replace(/\{\{DATASET\}\}/g, '?dataset');
                }

                correct_query = correct_query
                    .replace(/\{\{OFFSET\}\}/g, '0')
                    .replace(/\{\{LIMIT\}\}/g, '100');

                this.sparql = correct_query;
                this.executeSparqlQuery();

                // // Use /search service
                // this.parameters = {
                //     dataset: this.datasetInput.getValue(),
                //     property: this.propertyInput.getValue(),
                //     value: this.valueInput.getValue(),
                //     offset: 0,
                //     limit: 100 // number of loaded statements
                // };
                // this.alreadyDisplayedStatementKeys = {};
                // this.executeQuery();
            }
        };

        /**
         * On submit
         */
        ListDialog.prototype.executeServiceCall = function (url) {
            var widget = this;

            var progressBar = new OO.ui.ProgressBarWidget();
            progressBar.$element.css('max-width', '100%');
            widget.mainPanel.$element.append(progressBar.$element);

            $.get(
                url,
                function (data) {
                    progressBar.$element.remove();
                    // TODO slice chunks of 100
                    widget.displayServiceResult(data);
                    // if (statements.length > 0) {
                    //     widget.nextStatementsButton = new OO.ui.ButtonWidget({
                    //         label: 'Load more statements'
                    //     });
                    //     widget.nextStatementsButton.connect(
                    //         widget,
                    //         { click: 'onNextButtonSubmit' }
                    //     );
                    //     widget.mainPanel.$element.append(
                    //         widget.nextStatementsButton.$element
                    //     );
                    // }
                }
            )
                .fail(function (xhr, textStatus) {
                    progressBar.$element.remove();
                    reportError('Failed loading statements');
                })
        };

        ListDialog.prototype.initTable = function () {
            this.table = $('<table>')
                .addClass('wikitable')
                .css('width', '100%')
                .append(
                    $('<thead>').append(
                        $('<tr>').append(
                            $('<th>').text('Subject'),
                            $('<th>').text('Property'),
                            $('<th>').text('Object'),
                            $('<th>').text('Reference'),
                            $('<th>').text('Preview'),
                            $('<th>').text('Action')
                        )
                    )
                );
            this.mainPanel.$element.append(this.table);
        };

        /**
         * On submit
         */
        ListDialog.prototype.executeQuery = function () {
            var widget = this;

            var progressBar = new OO.ui.ProgressBarWidget();
            progressBar.$element.css('max-width', '100%');
            widget.mainPanel.$element.append(progressBar.$element);
            // do research
            searchStatements(this.parameters)
                .fail(function () {
                    progressBar.$element.remove();
                    var description = new OO.ui.LabelWidget({
                        label: 'No statements found.'
                    });
                    widget.mainPanel.$element.append(description.$element);
                })
                .done(function (statements) {
                    progressBar.$element.remove();

                    widget.parameters.offset += widget.parameters.limit;
                    widget.displayStatements(statements);

                    // We may assume that more statements remains
                    if (statements.length > 0) {
                        widget.nextStatementsButton = new OO.ui.ButtonWidget({
                            label: 'Load more statements'
                        });
                        widget.nextStatementsButton.connect(
                            widget,
                            { click: 'onNextButtonSubmit' }
                        );
                        widget.mainPanel.$element.append(
                            widget.nextStatementsButton.$element
                        );
                    }
                });
        };

        ListDialog.prototype.onNextButtonSubmit = function () {
            this.nextStatementsButton.$element.remove();
            this.executeSparqlQuery();
        };

        /**
         * Display result
         * @param statements
         */
        ListDialog.prototype.displayStatements = function (statements) {
            var widget = this;

            if (this.table === null) { // Initialize the table
                this.initTable();
            }

            console.log("Statements nella tabella");
            console.log(statements);

            // Create row for the table
            statements.map(function (statement) {
                statement.key = statement.subject + '\t' +
                    statement.predicate + '\t' +
                    statement.object;
                statement.qualifiers.forEach(function (qualifier) {
                    statement.key += '\t' + qualifier.qualifierProperty + '\t' +
                        qualifier.qualifierObject;
                });
                if (statement.key in widget.alreadyDisplayedStatementKeys) {
                    return; // Don't display twice the same statement
                }
                widget.alreadyDisplayedStatementKeys[statement.key] = true;
            });


            for (var i = 0; i < statements.length; i++) {
                if (statements[i].subject.length > 0) {
                    console.log("Ok");
                    console.log(statements[i]);
                    //     var row = new StatementRow({
                    //         statement: statement
                    //     });
                    //     widget.table.append(row.$element);
                } else {
                    console.log("Broken claim!");
                    console.log(statements[i]);
                }
            }

            //testDuplicate(statements[1]); //Q1000070
        };

        ListDialog.prototype.initTable = function () {
            this.table = $('<table>')
                .addClass('wikitable')
                .css('width', '100%')
                .append(
                    $('<thead>').append(
                        $('<tr>').append(
                            $('<th>').text('Subject'),
                            $('<th>').text('Property'),
                            $('<th>').text('Object'),
                            $('<th>').text('Reference'),
                            $('<th>').text('Preview'),
                            $('<th>').text('Action')
                        )
                    )
                );
            this.mainPanel.$element.append(this.table);
        };

        ListDialog.prototype.getBodyHeight = function () {
            return window.innerHeight - 100;
        };

        /**
         * SPARQL
         */
        ListDialog.prototype.executeSparqlQuery = function () {
            var widget = this;
            var progressBar = new OO.ui.ProgressBarWidget();
            progressBar.$element.css('max-width', '100%');
            widget.mainPanel.$element.append(progressBar.$element);
            // run SPARQL query
            $.get(
                ps.globals.API_ENDPOINTS.SPARQL_SERVICE,
                {
                    query: widget.sparql
                        .replace('{{offset}}', widget.sparqlOffset)
                        .replace('{{limit}}', widget.sparqlLimit)
                },
                function (data) {
                    progressBar.$element.remove();
                    // paging
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
                },
                'json'
            )
                .fail(function (xhr) {
                    // A bad request means a bad query
                    if (xhr.status === 400) {
                        // TODO can also yield other exceptions, so handle this better
                        // java.util.concurrent.ExecutionException: org.openrdf.query.MalformedQueryException: Encountered " "a" "a "" at line 1, column 1.
                        var exception = xhr.responseText.split('\n')[1].split('MalformedQueryException:')[1];
                        progressBar.$element.remove();
                        var alertIcon = new OO.ui.IconWidget({
                            icon: 'alert'
                        });
                        var malformedMessage = new OO.ui.LabelWidget({
                            label: new OO.ui.HtmlSnippet('<b>Malformed query. </b>')
                        });
                        var reasonMessage = new OO.ui.LabelWidget({
                            label: exception
                        });
                        widget.mainPanel.$element.append(alertIcon.$element, malformedMessage.$element, reasonMessage.$element);
                    }
                })
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

        button.click(function () {
            windowManager.openWindow('ps-list');
        });
    };

    // accessible object
    ps.filter = {
        // BEGIN: filter modal window
        init: _listDialog
        // END: filter modal window
    };

    /**
     * (Used only by ListDialog)
     * @param parameters
     * @returns {*}
     */
    function searchStatements(parameters) {
        // TODO API SPARQL
        // TODO DOMAIN OF INTEREST
        // TODO convert to flexbox as https://codepen.io/afnecors/pen/wPRZRj

        return $.when(
            $.ajax({
                url: ps.globals.API_ENDPOINTS.SEARCH_SERVICE,
                data: parameters
            }).then(function (data) {
                return data;
            }),
            ps.commons.getBlacklistedSourceUrls()
        ).then(
            function (data, blacklistedSourceUrls) {
                var isBlacklisted = ps.commons.isBlackListedBuilder(blacklistedSourceUrls);
                var statements = data.map(function (statement) {
                    return ps.commons.parsePrimarySourcesStatement(statement, isBlacklisted);
                });
                ps.commons.preloadEntityLabels(statements);
                return statements;
            }
        );
    }

    function test() {
        // 1 oggetto
        // https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=Q153832&property=P18&format=json
        var ogg = {
            "claims": {
                "P18": [{
                    "mainsnak": {
                        "snaktype": "value",
                        "property": "P18",
                        "hash": "e1e165b33690b67a57d6c11a7c573aa17a027044",
                        "datavalue": { "value": "Alcide de Gasperi 2.jpg", "type": "string" },
                        "datatype": "commonsMedia"
                    }, "type": "statement", "id": "Q153832$B43D86B2-97F0-493F-8AD9-F2748A79E910", "rank": "normal"
                }]
            }
        };

        // 2 oggetto + qualif (1 o +)
        // https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=Q153832&property=P39&format=json
        var oggQualif = {
            "claims": {
                "P39": [{
                    "mainsnak": {
                        "snaktype": "value",
                        "property": "P39",
                        "hash": "cb8b4fa5efbf4a072b6f196eb8634c8023139de0",
                        "datavalue": {
                            "value": { "entity-type": "item", "numeric-id": 3657214, "id": "Q3657214" },
                            "type": "wikibase-entityid"
                        },
                        "datatype": "wikibase-item"
                    },
                    "type": "statement",
                    "qualifiers": {
                        "P580": [{
                            "snaktype": "value",
                            "property": "P580",
                            "hash": "01f6b8ecf3c5fd8702e7f2b25f408d524ef5653f",
                            "datavalue": {
                                "value": {
                                    "time": "+1946-06-13T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }],
                        "P1365": [{
                            "snaktype": "novalue",
                            "property": "P1365",
                            "hash": "ad7abaafe03de32f2939aa4b7e9c3a9f447c3393",
                            "datatype": "wikibase-item"
                        }],
                        "P1366": [{
                            "snaktype": "value",
                            "property": "P1366",
                            "hash": "65ddc86b27d18b09ed20f929befb0e96d0290266",
                            "datavalue": {
                                "value": { "entity-type": "item", "numeric-id": 1245, "id": "Q1245" },
                                "type": "wikibase-entityid"
                            },
                            "datatype": "wikibase-item"
                        }],
                        "P582": [{
                            "snaktype": "value",
                            "property": "P582",
                            "hash": "82f6c5d96b8b707c5788f64fea5bfafce3238f3f",
                            "datavalue": {
                                "value": {
                                    "time": "+1946-07-01T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }]
                    },
                    "qualifiers-order": ["P580", "P1365", "P1366", "P582"],
                    "id": "q153832$c81fe997-416b-9d78-66f7-cfe76ff31798",
                    "rank": "normal",
                    "references": [{
                        "hash": "d5847b9b6032aa8b13dae3c2dfd9ed5d114d21b3",
                        "snaks": {
                            "P143": [{
                                "snaktype": "value",
                                "property": "P143",
                                "hash": "5a343e7e758a4282a01316d3e959b6e653b767fc",
                                "datavalue": {
                                    "value": { "entity-type": "item", "numeric-id": 11920, "id": "Q11920" },
                                    "type": "wikibase-entityid"
                                },
                                "datatype": "wikibase-item"
                            }]
                        },
                        "snaks-order": ["P143"]
                    }]
                }, {
                    "mainsnak": {
                        "snaktype": "value",
                        "property": "P39",
                        "hash": "2c6ed8aff886577d6268388e6fda2440b06b9a11",
                        "datavalue": {
                            "value": { "entity-type": "item", "numeric-id": 25160174, "id": "Q25160174" },
                            "type": "wikibase-entityid"
                        },
                        "datatype": "wikibase-item"
                    },
                    "type": "statement",
                    "qualifiers": {
                        "P580": [{
                            "snaktype": "value",
                            "property": "P580",
                            "hash": "dffee32620c263adf3b9511742a2c1c963042e22",
                            "datavalue": {
                                "value": {
                                    "time": "+1945-12-10T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }],
                        "P582": [{
                            "snaktype": "value",
                            "property": "P582",
                            "hash": "2a656e97f589203bb6641ba94b556eb2d979d552",
                            "datavalue": {
                                "value": {
                                    "time": "+1946-06-13T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }],
                        "P1365": [{
                            "snaktype": "value",
                            "property": "P1365",
                            "hash": "2b3b65ac58f438a23600845599d4ec6ca5cbae5c",
                            "datavalue": {
                                "value": { "entity-type": "item", "numeric-id": 471315, "id": "Q471315" },
                                "type": "wikibase-entityid"
                            },
                            "datatype": "wikibase-item"
                        }],
                        "P1366": [{
                            "snaktype": "novalue",
                            "property": "P1366",
                            "hash": "432e7e30a610ab41c08ee1ca47a9da9ce0742493",
                            "datatype": "wikibase-item"
                        }]
                    },
                    "qualifiers-order": ["P580", "P582", "P1365", "P1366"],
                    "id": "Q153832$29c2fd98-4579-a13e-49db-3f79e9dc26df",
                    "rank": "normal"
                }, {
                    "mainsnak": {
                        "snaktype": "value",
                        "property": "P39",
                        "hash": "9d21b6bca7c3df3837c7c8478f6eb98644b9d1cd",
                        "datavalue": {
                            "value": { "entity-type": "item", "numeric-id": 27169, "id": "Q27169" },
                            "type": "wikibase-entityid"
                        },
                        "datatype": "wikibase-item"
                    }, "type": "statement", "id": "Q153832$825A4235-1F81-4232-9C7F-7A8B0019BA48", "rank": "normal"
                }, {
                    "mainsnak": {
                        "snaktype": "value",
                        "property": "P39",
                        "hash": "c10ff765d41a8b2039c38b303751b408023fe8ff",
                        "datavalue": {
                            "value": { "entity-type": "item", "numeric-id": 18558478, "id": "Q18558478" },
                            "type": "wikibase-entityid"
                        },
                        "datatype": "wikibase-item"
                    }, "type": "statement", "id": "Q153832$225F34CC-844E-4993-B02D-EAD24CDF1F47", "rank": "normal"
                }, {
                    "mainsnak": {
                        "snaktype": "value",
                        "property": "P39",
                        "hash": "c03cff8df051428ba1ef308ff9c857a78f963f70",
                        "datavalue": {
                            "value": { "entity-type": "item", "numeric-id": 26248695, "id": "Q26248695" },
                            "type": "wikibase-entityid"
                        },
                        "datatype": "wikibase-item"
                    },
                    "type": "statement",
                    "qualifiers": {
                        "P580": [{
                            "snaktype": "value",
                            "property": "P580",
                            "hash": "7d17f5cb7fdb30c3d53f5430e2517a1bfb1fc611",
                            "datavalue": {
                                "value": {
                                    "time": "+1944-12-11T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }],
                        "P582": [{
                            "snaktype": "value",
                            "property": "P582",
                            "hash": "c18aaf7031888db0f903a6e976657b8753ad4044",
                            "datavalue": {
                                "value": {
                                    "time": "+1945-06-21T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }],
                        "P1365": [{
                            "snaktype": "value",
                            "property": "P1365",
                            "hash": "30febb71c22edcca9eec21fe3b1b64c55a175ff3",
                            "datavalue": {
                                "value": { "entity-type": "item", "numeric-id": 313717, "id": "Q313717" },
                                "type": "wikibase-entityid"
                            },
                            "datatype": "wikibase-item"
                        }],
                        "P1366": [{
                            "snaktype": "value",
                            "property": "P1366",
                            "hash": "7f3f6b347137639298a6e147197e2ca9c537ce76",
                            "datavalue": {
                                "value": { "entity-type": "item", "numeric-id": 3734426, "id": "Q3734426" },
                                "type": "wikibase-entityid"
                            },
                            "datatype": "wikibase-item"
                        }]
                    },
                    "qualifiers-order": ["P580", "P582", "P1365", "P1366"],
                    "id": "Q153832$536B8EF1-A7DD-44EE-AB42-4D5C49C0415D",
                    "rank": "normal"
                }, {
                    "mainsnak": {
                        "snaktype": "value",
                        "property": "P39",
                        "hash": "c03cff8df051428ba1ef308ff9c857a78f963f70",
                        "datavalue": {
                            "value": { "entity-type": "item", "numeric-id": 26248695, "id": "Q26248695" },
                            "type": "wikibase-entityid"
                        },
                        "datatype": "wikibase-item"
                    },
                    "type": "statement",
                    "qualifiers": {
                        "P580": [{
                            "snaktype": "value",
                            "property": "P580",
                            "hash": "1959438135565d3ed95957006f4ecef20f92f75e",
                            "datavalue": {
                                "value": {
                                    "time": "+1945-08-10T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }],
                        "P582": [{
                            "snaktype": "value",
                            "property": "P582",
                            "hash": "2a656e97f589203bb6641ba94b556eb2d979d552",
                            "datavalue": {
                                "value": {
                                    "time": "+1946-06-13T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }],
                        "P1365": [{
                            "snaktype": "value",
                            "property": "P1365",
                            "hash": "8dd0db73f272506f37a80e19af53da21e55cac5f",
                            "datavalue": {
                                "value": { "entity-type": "item", "numeric-id": 3734426, "id": "Q3734426" },
                                "type": "wikibase-entityid"
                            },
                            "datatype": "wikibase-item"
                        }],
                        "P1366": [{
                            "snaktype": "novalue",
                            "property": "P1366",
                            "hash": "432e7e30a610ab41c08ee1ca47a9da9ce0742493",
                            "datatype": "wikibase-item"
                        }]
                    },
                    "qualifiers-order": ["P580", "P582", "P1365", "P1366"],
                    "id": "Q153832$81c42caa-4161-3c8d-1ceb-e201c7176cbb",
                    "rank": "normal"
                }, {
                    "mainsnak": {
                        "snaktype": "value",
                        "property": "P39",
                        "hash": "5a587c684e612115991808f0cca3c770351f7175",
                        "datavalue": {
                            "value": { "entity-type": "item", "numeric-id": 740126, "id": "Q740126" },
                            "type": "wikibase-entityid"
                        },
                        "datatype": "wikibase-item"
                    },
                    "type": "statement",
                    "qualifiers": {
                        "P580": [{
                            "snaktype": "value",
                            "property": "P580",
                            "hash": "0fdb258a0ccab730c4ba5f07af1d58a4191266ff",
                            "datavalue": {
                                "value": {
                                    "time": "+1954-01-01T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }],
                        "P582": [{
                            "snaktype": "value",
                            "property": "P582",
                            "hash": "88e2b7f8ad26ef1185b920af8f994aae6977f6eb",
                            "datavalue": {
                                "value": {
                                    "time": "+1954-08-19T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }],
                        "P1365": [{
                            "snaktype": "value",
                            "property": "P1365",
                            "hash": "a08ea209c201dd3a8690ab97b0e738bd117fb688",
                            "datavalue": {
                                "value": { "entity-type": "item", "numeric-id": 155691, "id": "Q155691" },
                                "type": "wikibase-entityid"
                            },
                            "datatype": "wikibase-item"
                        }],
                        "P1366": [{
                            "snaktype": "value",
                            "property": "P1366",
                            "hash": "0a4fd9c97c82a6f79d359ec1358314245b7a6b66",
                            "datavalue": {
                                "value": { "entity-type": "item", "numeric-id": 320963, "id": "Q320963" },
                                "type": "wikibase-entityid"
                            },
                            "datatype": "wikibase-item"
                        }]
                    },
                    "qualifiers-order": ["P580", "P582", "P1365", "P1366"],
                    "id": "Q153832$1F9B0407-883E-4FFC-941C-9FEB78EC8329",
                    "rank": "normal",
                    "references": [{
                        "hash": "fa278ebfc458360e5aed63d5058cca83c46134f1",
                        "snaks": {
                            "P143": [{
                                "snaktype": "value",
                                "property": "P143",
                                "hash": "e4f6d9441d0600513c4533c672b5ab472dc73694",
                                "datavalue": {
                                    "value": { "entity-type": "item", "numeric-id": 328, "id": "Q328" },
                                    "type": "wikibase-entityid"
                                },
                                "datatype": "wikibase-item"
                            }]
                        },
                        "snaks-order": ["P143"]
                    }]
                }, {
                    "mainsnak": {
                        "snaktype": "value",
                        "property": "P39",
                        "hash": "2ed26add50b076ac513ee5fe7b8646328ebc91cc",
                        "datavalue": {
                            "value": { "entity-type": "item", "numeric-id": 27991492, "id": "Q27991492" },
                            "type": "wikibase-entityid"
                        },
                        "datatype": "wikibase-item"
                    },
                    "type": "statement",
                    "qualifiers": {
                        "P580": [{
                            "snaktype": "value",
                            "property": "P580",
                            "hash": "e2af880c98a43902453bb1f60c41e602ece4ed9d",
                            "datavalue": {
                                "value": {
                                    "time": "+1951-07-26T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }],
                        "P582": [{
                            "snaktype": "value",
                            "property": "P582",
                            "hash": "d15a680d05c6d505ec8930518572e95310ffc4ec",
                            "datavalue": {
                                "value": {
                                    "time": "+1953-08-17T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }],
                        "P1365": [{
                            "snaktype": "value",
                            "property": "P1365",
                            "hash": "9a86e3ff6a604e7d9ebf3a7a4debe8f6f887cd02",
                            "datavalue": {
                                "value": { "entity-type": "item", "numeric-id": 463243, "id": "Q463243" },
                                "type": "wikibase-entityid"
                            },
                            "datatype": "wikibase-item"
                        }],
                        "P1366": [{
                            "snaktype": "value",
                            "property": "P1366",
                            "hash": "0a4fd9c97c82a6f79d359ec1358314245b7a6b66",
                            "datavalue": {
                                "value": { "entity-type": "item", "numeric-id": 320963, "id": "Q320963" },
                                "type": "wikibase-entityid"
                            },
                            "datatype": "wikibase-item"
                        }]
                    },
                    "qualifiers-order": ["P580", "P582", "P1365", "P1366"],
                    "id": "Q153832$0F893D92-264C-4172-AEC7-A92AAE7C476A",
                    "rank": "normal",
                    "references": [{
                        "hash": "fa278ebfc458360e5aed63d5058cca83c46134f1",
                        "snaks": {
                            "P143": [{
                                "snaktype": "value",
                                "property": "P143",
                                "hash": "e4f6d9441d0600513c4533c672b5ab472dc73694",
                                "datavalue": {
                                    "value": { "entity-type": "item", "numeric-id": 328, "id": "Q328" },
                                    "type": "wikibase-entityid"
                                },
                                "datatype": "wikibase-item"
                            }]
                        },
                        "snaks-order": ["P143"]
                    }]
                }, {
                    "mainsnak": {
                        "snaktype": "value",
                        "property": "P39",
                        "hash": "feb2f4d896d52226a6944399a165c9b5a4d78ee5",
                        "datavalue": {
                            "value": { "entity-type": "item", "numeric-id": 1541071, "id": "Q1541071" },
                            "type": "wikibase-entityid"
                        },
                        "datatype": "wikibase-item"
                    },
                    "type": "statement",
                    "qualifiers": {
                        "P580": [{
                            "snaktype": "value",
                            "property": "P580",
                            "hash": "ee3d1e56922d62841c4b95b3e3560bee82a1ac55",
                            "datavalue": {
                                "value": {
                                    "time": "+1946-07-14T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }],
                        "P582": [{
                            "snaktype": "value",
                            "property": "P582",
                            "hash": "70eedb9549cf043e1fcabb6970cacddacce6d1ac",
                            "datavalue": {
                                "value": {
                                    "time": "+1947-02-02T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }],
                        "P1365": [{
                            "snaktype": "value",
                            "property": "P1365",
                            "hash": "0abe513071704206cc04c5be4097627fc5fc9bfe",
                            "datavalue": {
                                "value": { "entity-type": "item", "numeric-id": 3771345, "id": "Q3771345" },
                                "type": "wikibase-entityid"
                            },
                            "datatype": "wikibase-item"
                        }],
                        "P1366": [{
                            "snaktype": "value",
                            "property": "P1366",
                            "hash": "7342a84e476c44c3289be9a110b360e7fa4261d1",
                            "datavalue": {
                                "value": { "entity-type": "item", "numeric-id": 367342, "id": "Q367342" },
                                "type": "wikibase-entityid"
                            },
                            "datatype": "wikibase-item"
                        }]
                    },
                    "qualifiers-order": ["P580", "P582", "P1365", "P1366"],
                    "id": "Q153832$64159E91-86C3-4DD8-8188-C7A281463B42",
                    "rank": "normal",
                    "references": [{
                        "hash": "fa278ebfc458360e5aed63d5058cca83c46134f1",
                        "snaks": {
                            "P143": [{
                                "snaktype": "value",
                                "property": "P143",
                                "hash": "e4f6d9441d0600513c4533c672b5ab472dc73694",
                                "datavalue": {
                                    "value": { "entity-type": "item", "numeric-id": 328, "id": "Q328" },
                                    "type": "wikibase-entityid"
                                },
                                "datatype": "wikibase-item"
                            }]
                        },
                        "snaks-order": ["P143"]
                    }]
                }, {
                    "mainsnak": {
                        "snaktype": "value",
                        "property": "P39",
                        "hash": "b9065b1bcfc19a4d4632b0592e88e7088d6c8f03",
                        "datavalue": {
                            "value": { "entity-type": "item", "numeric-id": 28798091, "id": "Q28798091" },
                            "type": "wikibase-entityid"
                        },
                        "datatype": "wikibase-item"
                    },
                    "type": "statement",
                    "qualifiers": {
                        "P580": [{
                            "snaktype": "value",
                            "property": "P580",
                            "hash": "dffee32620c263adf3b9511742a2c1c963042e22",
                            "datavalue": {
                                "value": {
                                    "time": "+1945-12-10T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }],
                        "P582": [{
                            "snaktype": "value",
                            "property": "P582",
                            "hash": "2a656e97f589203bb6641ba94b556eb2d979d552",
                            "datavalue": {
                                "value": {
                                    "time": "+1946-06-13T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }],
                        "P1365": [{
                            "snaktype": "value",
                            "property": "P1365",
                            "hash": "2b3b65ac58f438a23600845599d4ec6ca5cbae5c",
                            "datavalue": {
                                "value": { "entity-type": "item", "numeric-id": 471315, "id": "Q471315" },
                                "type": "wikibase-entityid"
                            },
                            "datatype": "wikibase-item"
                        }],
                        "P1366": [{
                            "snaktype": "novalue",
                            "property": "P1366",
                            "hash": "432e7e30a610ab41c08ee1ca47a9da9ce0742493",
                            "datatype": "wikibase-item"
                        }],
                        "P2868": [{
                            "snaktype": "value",
                            "property": "P2868",
                            "hash": "3a554fb09c91f05831eb4c88bfad19007d27b3aa",
                            "datavalue": {
                                "value": { "entity-type": "item", "numeric-id": 4676846, "id": "Q4676846" },
                                "type": "wikibase-entityid"
                            },
                            "datatype": "wikibase-item"
                        }]
                    },
                    "qualifiers-order": ["P580", "P582", "P1365", "P1366", "P2868"],
                    "id": "Q153832$995AA38B-4664-47AA-B437-E5CCE72816E4",
                    "rank": "normal"
                }, {
                    "mainsnak": {
                        "snaktype": "value",
                        "property": "P39",
                        "hash": "a9b283ac7d852d7113160325159892ee5218ede8",
                        "datavalue": {
                            "value": { "entity-type": "item", "numeric-id": 28798093, "id": "Q28798093" },
                            "type": "wikibase-entityid"
                        },
                        "datatype": "wikibase-item"
                    },
                    "type": "statement",
                    "qualifiers": {
                        "P580": [{
                            "snaktype": "value",
                            "property": "P580",
                            "hash": "01f6b8ecf3c5fd8702e7f2b25f408d524ef5653f",
                            "datavalue": {
                                "value": {
                                    "time": "+1946-06-13T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }],
                        "P582": [{
                            "snaktype": "value",
                            "property": "P582",
                            "hash": "fe788b8adbf188ecdc117fd702a0340d9acbd2c8",
                            "datavalue": {
                                "value": {
                                    "time": "+1953-04-29T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }],
                        "P1365": [{
                            "snaktype": "novalue",
                            "property": "P1365",
                            "hash": "ad7abaafe03de32f2939aa4b7e9c3a9f447c3393",
                            "datatype": "wikibase-item"
                        }],
                        "P1366": [{
                            "snaktype": "novalue",
                            "property": "P1366",
                            "hash": "432e7e30a610ab41c08ee1ca47a9da9ce0742493",
                            "datatype": "wikibase-item"
                        }],
                        "P2868": [{
                            "snaktype": "value",
                            "property": "P2868",
                            "hash": "3a554fb09c91f05831eb4c88bfad19007d27b3aa",
                            "datavalue": {
                                "value": { "entity-type": "item", "numeric-id": 4676846, "id": "Q4676846" },
                                "type": "wikibase-entityid"
                            },
                            "datatype": "wikibase-item"
                        }]
                    },
                    "qualifiers-order": ["P580", "P582", "P1365", "P1366", "P2868"],
                    "id": "Q153832$39D1D5B6-08F6-4697-B664-46C95BB39D6F",
                    "rank": "normal"
                }, {
                    "mainsnak": {
                        "snaktype": "value",
                        "property": "P39",
                        "hash": "3c93757411706187aba78e24a01ec25a4f30bad0",
                        "datavalue": {
                            "value": { "entity-type": "item", "numeric-id": 33159467, "id": "Q33159467" },
                            "type": "wikibase-entityid"
                        },
                        "datatype": "wikibase-item"
                    },
                    "type": "statement",
                    "qualifiers": {
                        "P580": [{
                            "snaktype": "value",
                            "property": "P580",
                            "hash": "3bd5b8223a08a6bb4bfbe1236a828a8a6d2f0a3c",
                            "datavalue": {
                                "value": {
                                    "time": "+1944-06-18T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }],
                        "P582": [{
                            "snaktype": "value",
                            "property": "P582",
                            "hash": "0489fb65c959745625875e9168a0bb84bd6d7583",
                            "datavalue": {
                                "value": {
                                    "time": "+1944-12-12T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }]
                    },
                    "qualifiers-order": ["P580", "P582"],
                    "id": "Q153832$AF59B444-8155-4F1B-8401-BB596D4C7342",
                    "rank": "normal"
                }, {
                    "mainsnak": {
                        "snaktype": "value",
                        "property": "P39",
                        "hash": "913f8266eb5dadbe25a3140a6420340ea0d7c19d",
                        "datavalue": {
                            "value": { "entity-type": "item", "numeric-id": 796897, "id": "Q796897" },
                            "type": "wikibase-entityid"
                        },
                        "datatype": "wikibase-item"
                    },
                    "type": "statement",
                    "qualifiers": {
                        "P580": [{
                            "snaktype": "value",
                            "property": "P580",
                            "hash": "01f6b8ecf3c5fd8702e7f2b25f408d524ef5653f",
                            "datavalue": {
                                "value": {
                                    "time": "+1946-06-13T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }],
                        "P582": [{
                            "snaktype": "value",
                            "property": "P582",
                            "hash": "d15a680d05c6d505ec8930518572e95310ffc4ec",
                            "datavalue": {
                                "value": {
                                    "time": "+1953-08-17T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }],
                        "P1365": [{
                            "snaktype": "novalue",
                            "property": "P1365",
                            "hash": "ad7abaafe03de32f2939aa4b7e9c3a9f447c3393",
                            "datatype": "wikibase-item"
                        }],
                        "P1366": [{
                            "snaktype": "value",
                            "property": "P1366",
                            "hash": "0a4fd9c97c82a6f79d359ec1358314245b7a6b66",
                            "datavalue": {
                                "value": { "entity-type": "item", "numeric-id": 320963, "id": "Q320963" },
                                "type": "wikibase-entityid"
                            },
                            "datatype": "wikibase-item"
                        }]
                    },
                    "qualifiers-order": ["P580", "P582", "P1365", "P1366"],
                    "id": "Q153832$c253e15f-4687-f86b-3206-c4d61e603212",
                    "rank": "normal"
                }, {
                    "mainsnak": {
                        "snaktype": "value",
                        "property": "P39",
                        "hash": "250f56aeb4a77ee6ccf36afad4f457355bdf61b9",
                        "datavalue": {
                            "value": { "entity-type": "item", "numeric-id": 42744067, "id": "Q42744067" },
                            "type": "wikibase-entityid"
                        },
                        "datatype": "wikibase-item"
                    }, "type": "statement", "id": "Q153832$48FF03B8-D9C0-40AD-92B9-433E4C902521", "rank": "normal"
                }]
            }
        }

        // 3 oggetto + qualif (1 o +) + ref
        // https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=Q153832&property=P166&format=json
        var oggQualifRef = {
            "claims": {
                "P166": [{
                    "mainsnak": {
                        "snaktype": "value",
                        "property": "P166",
                        "hash": "1556703575edeb908a70a56ae98a6e937e4cc251",
                        "datavalue": {
                            "value": { "entity-type": "item", "numeric-id": 152337, "id": "Q152337" },
                            "type": "wikibase-entityid"
                        },
                        "datatype": "wikibase-item"
                    },
                    "type": "statement",
                    "qualifiers": {
                        "P585": [{
                            "snaktype": "value",
                            "property": "P585",
                            "hash": "08add2ca2a6fcef8a65475b6ef5ad39ae2d0484b",
                            "datavalue": {
                                "value": {
                                    "time": "+1952-09-24T00:00:00Z",
                                    "timezone": 0,
                                    "before": 0,
                                    "after": 0,
                                    "precision": 11,
                                    "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                }, "type": "time"
                            },
                            "datatype": "time"
                        }]
                    },
                    "qualifiers-order": ["P585"],
                    "id": "Q153832$4b3b03a3-4226-f2d0-42b7-7d965b7f28c9",
                    "rank": "normal",
                    "references": [{
                        "hash": "9a24f7c0208b05d6be97077d855671d1dfdbc0dd",
                        "snaks": {
                            "P143": [{
                                "snaktype": "value",
                                "property": "P143",
                                "hash": "d38375ffe6fe142663ff55cd783aa4df4301d83d",
                                "datavalue": {
                                    "value": { "entity-type": "item", "numeric-id": 48183, "id": "Q48183" },
                                    "type": "wikibase-entityid"
                                },
                                "datatype": "wikibase-item"
                            }]
                        },
                        "snaks-order": ["P143"]
                    }, {
                        "hash": "9c7b0ef00831cfa2c65067cf72bc690e6b588ea8",
                        "snaks": {
                            "P1476": [{
                                "snaktype": "value",
                                "property": "P1476",
                                "hash": "9fc801b51b273eaebe3db6648e66abc6a6595775",
                                "datavalue": {
                                    "value": {
                                        "text": "Der Karlspreistr\u00e4ger 1952 Alcide de Gasperi",
                                        "language": "de"
                                    }, "type": "monolingualtext"
                                },
                                "datatype": "monolingualtext"
                            }],
                            "P407": [{
                                "snaktype": "value",
                                "property": "P407",
                                "hash": "46bfd327b830f66f7061ea92d1be430c135fa91f",
                                "datavalue": {
                                    "value": { "entity-type": "item", "numeric-id": 188, "id": "Q188" },
                                    "type": "wikibase-entityid"
                                },
                                "datatype": "wikibase-item"
                            }],
                            "P854": [{
                                "snaktype": "value",
                                "property": "P854",
                                "hash": "ea8cacdd316944625c466513970567f7972500ed",
                                "datavalue": {
                                    "value": "http://www.karlspreis.de/de/preistraeger/alcide-de-gasperi-1952/vita",
                                    "type": "string"
                                },
                                "datatype": "url"
                            }],
                            "P813": [{
                                "snaktype": "value",
                                "property": "P813",
                                "hash": "ab1abb875e315f47e9db9d94d55ecbf8e7616b5b",
                                "datavalue": {
                                    "value": {
                                        "time": "+2014-12-14T00:00:00Z",
                                        "timezone": 0,
                                        "before": 0,
                                        "after": 0,
                                        "precision": 11,
                                        "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                    }, "type": "time"
                                },
                                "datatype": "time"
                            }],
                            "P1065": [{
                                "snaktype": "value",
                                "property": "P1065",
                                "hash": "2810a1ecf338b0c89b7c290e8955e11957f86b7d",
                                "datavalue": {
                                    "value": "http://web.archive.org/web/20141214103945/http://www.karlspreis.de/de/preistraeger/alcide-de-gasperi-1952/vita",
                                    "type": "string"
                                },
                                "datatype": "url"
                            }],
                            "P485": [{
                                "snaktype": "value",
                                "property": "P485",
                                "hash": "c7cf37a1c07e4f3e1e0a1a702c05b0c4a0e852d6",
                                "datavalue": {
                                    "value": { "entity-type": "item", "numeric-id": 648266, "id": "Q648266" },
                                    "type": "wikibase-entityid"
                                },
                                "datatype": "wikibase-item"
                            }]
                        },
                        "snaks-order": ["P1476", "P407", "P854", "P813", "P1065", "P485"]
                    }]
                }]
            }
        };

        // 4 oggetto + ref (1 o +)
        var oggRef = {
            "claims": {
                "P140": [{
                    "mainsnak": {
                        "snaktype": "value",
                        "property": "P140",
                        "hash": "1d37cef459ae3310e8856a343b4f5d0ceaee71e2",
                        "datavalue": {
                            "value": { "entity-type": "item", "numeric-id": 1841, "id": "Q1841" },
                            "type": "wikibase-entityid"
                        },
                        "datatype": "wikibase-item"
                    },
                    "type": "statement",
                    "id": "Q153832$17ACC140-1D17-49A6-9946-917095A67B5C",
                    "rank": "normal",
                    "references": [{
                        "hash": "c456dc5cd2117249948c288206ff3f8b1bf574f0",
                        "snaks": {
                            "P143": [{
                                "snaktype": "value",
                                "property": "P143",
                                "hash": "e17507043402fe54ae6c4d65cc51f46cec987de9",
                                "datavalue": {
                                    "value": { "entity-type": "item", "numeric-id": 8449, "id": "Q8449" },
                                    "type": "wikibase-entityid"
                                },
                                "datatype": "wikibase-item"
                            }]
                        },
                        "snaks-order": ["P143"]
                    }]
                }]
            }
        };

        var oggData = {
            "claims": {
                "P570": [{
                    "mainsnak": {
                        "snaktype": "value",
                        "property": "P570",
                        "hash": "f551cfd516d2d88d5ba6bbe5c20acd71600cef1d",
                        "datavalue": {
                            "value": {
                                "time": "+1954-08-19T00:00:00Z",
                                "timezone": 0,
                                "before": 0,
                                "after": 0,
                                "precision": 11,
                                "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                            }, "type": "time"
                        },
                        "datatype": "time"
                    },
                    "type": "statement",
                    "id": "q153832$A8DE4185-50D2-4B26-9AB5-967FD2B61FA6",
                    "rank": "normal",
                    "references": [{
                        "hash": "fa278ebfc458360e5aed63d5058cca83c46134f1",
                        "snaks": {
                            "P143": [{
                                "snaktype": "value",
                                "property": "P143",
                                "hash": "e4f6d9441d0600513c4533c672b5ab472dc73694",
                                "datavalue": {
                                    "value": { "entity-type": "item", "numeric-id": 328, "id": "Q328" },
                                    "type": "wikibase-entityid"
                                },
                                "datatype": "wikibase-item"
                            }]
                        },
                        "snaks-order": ["P143"]
                    }, {
                        "hash": "274565d7568c32a4ecb6b04d940e94ee9bcb90b8",
                        "snaks": {
                            "P248": [{
                                "snaktype": "value",
                                "property": "P248",
                                "hash": "019a50b7de741e0068bde41c9d9955b22a5de47b",
                                "datavalue": {
                                    "value": { "entity-type": "item", "numeric-id": 36578, "id": "Q36578" },
                                    "type": "wikibase-entityid"
                                },
                                "datatype": "wikibase-item"
                            }],
                            "P813": [{
                                "snaktype": "value",
                                "property": "P813",
                                "hash": "ef249f1bd8d424eb840b8aaa6e27406259589b0b",
                                "datavalue": {
                                    "value": {
                                        "time": "+2014-04-26T00:00:00Z",
                                        "timezone": 0,
                                        "before": 0,
                                        "after": 0,
                                        "precision": 11,
                                        "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                    }, "type": "time"
                                },
                                "datatype": "time"
                            }]
                        },
                        "snaks-order": ["P248", "P813"]
                    }, {
                        "hash": "9f2855c387dc6e1456f6641538ac76e890809cb5",
                        "snaks": {
                            "P248": [{
                                "snaktype": "value",
                                "property": "P248",
                                "hash": "6ff2cf2f32fe6bf566da4c3c6e2d0ae639ecef93",
                                "datavalue": {
                                    "value": { "entity-type": "item", "numeric-id": 17378135, "id": "Q17378135" },
                                    "type": "wikibase-entityid"
                                },
                                "datatype": "wikibase-item"
                            }],
                            "P958": [{
                                "snaktype": "value",
                                "property": "P958",
                                "hash": "192398617913407fdb2506827ea022309a58a5bf",
                                "datavalue": {
                                    "value": "\u0414\u0435 \u0413\u0430\u0441\u043f\u0435\u0440\u0438 \u0410\u043b\u044c\u0447\u0438\u0434\u0435",
                                    "type": "string"
                                },
                                "datatype": "string"
                            }],
                            "P813": [{
                                "snaktype": "value",
                                "property": "P813",
                                "hash": "46e6fc8d9c15300387ed9ea88d160ce586845634",
                                "datavalue": {
                                    "value": {
                                        "time": "+2015-09-27T00:00:00Z",
                                        "timezone": 0,
                                        "before": 0,
                                        "after": 0,
                                        "precision": 11,
                                        "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                    }, "type": "time"
                                },
                                "datatype": "time"
                            }]
                        },
                        "snaks-order": ["P248", "P958", "P813"]
                    }, {
                        "hash": "31899ea94be1d8bf3c0d53cf09c9be44e6196907",
                        "snaks": {
                            "P248": [{
                                "snaktype": "value",
                                "property": "P248",
                                "hash": "da30562523b94bc9c043e8ecdf983c520d76fa31",
                                "datavalue": {
                                    "value": { "entity-type": "item", "numeric-id": 20666306, "id": "Q20666306" },
                                    "type": "wikibase-entityid"
                                },
                                "datatype": "wikibase-item"
                            }],
                            "P813": [{
                                "snaktype": "value",
                                "property": "P813",
                                "hash": "d6162a1716489623c6e595e448b17f8dca4fb2e8",
                                "datavalue": {
                                    "value": {
                                        "time": "+2015-10-10T00:00:00Z",
                                        "timezone": 0,
                                        "before": 0,
                                        "after": 0,
                                        "precision": 11,
                                        "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                    }, "type": "time"
                                },
                                "datatype": "time"
                            }],
                            "P854": [{
                                "snaktype": "value",
                                "property": "P854",
                                "hash": "e68720bb3d694bdb13fa0811979aba7da657825f",
                                "datavalue": { "value": "http://data.bnf.fr/ark:/12148/cb120304841", "type": "string" },
                                "datatype": "url"
                            }]
                        },
                        "snaks-order": ["P248", "P813", "P854"]
                    }, {
                        "hash": "9b6026e1b3af40e520af87490e1611d689b9f123",
                        "snaks": {
                            "P248": [{
                                "snaktype": "value",
                                "property": "P248",
                                "hash": "f98ec89708e8eab9511c049702ef59df0721d652",
                                "datavalue": {
                                    "value": { "entity-type": "item", "numeric-id": 29861311, "id": "Q29861311" },
                                    "type": "wikibase-entityid"
                                },
                                "datatype": "wikibase-item"
                            }],
                            "P3430": [{
                                "snaktype": "value",
                                "property": "P3430",
                                "hash": "5e77f27a47cf619392506cb0e9232e17ae1871c0",
                                "datavalue": { "value": "w6sv5d7k", "type": "string" },
                                "datatype": "external-id"
                            }],
                            "P1810": [{
                                "snaktype": "value",
                                "property": "P1810",
                                "hash": "c8b2de96463ca13926d93afec2bcc692771c6867",
                                "datavalue": { "value": "Alcide De Gasperi", "type": "string" },
                                "datatype": "string"
                            }],
                            "P813": [{
                                "snaktype": "value",
                                "property": "P813",
                                "hash": "e5f60ab0b03700bb883efce38f8022d023bc49fb",
                                "datavalue": {
                                    "value": {
                                        "time": "+2017-10-09T00:00:00Z",
                                        "timezone": 0,
                                        "before": 0,
                                        "after": 0,
                                        "precision": 11,
                                        "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                    }, "type": "time"
                                },
                                "datatype": "time"
                            }]
                        },
                        "snaks-order": ["P248", "P3430", "P1810", "P813"]
                    }, {
                        "hash": "9374b9e545c01185c9f5887d3846fea2f9e6d890",
                        "snaks": {
                            "P248": [{
                                "snaktype": "value",
                                "property": "P248",
                                "hash": "b62f3fa8bab7eb5e1bfe16d03cda082d25315c85",
                                "datavalue": {
                                    "value": { "entity-type": "item", "numeric-id": 63056, "id": "Q63056" },
                                    "type": "wikibase-entityid"
                                },
                                "datatype": "wikibase-item"
                            }],
                            "P535": [{
                                "snaktype": "value",
                                "property": "P535",
                                "hash": "35bcc4d0316ec7c3e7abaca0ebd2ef3c731dcb43",
                                "datavalue": { "value": "14071697", "type": "string" },
                                "datatype": "external-id"
                            }],
                            "P1810": [{
                                "snaktype": "value",
                                "property": "P1810",
                                "hash": "c8b2de96463ca13926d93afec2bcc692771c6867",
                                "datavalue": { "value": "Alcide De Gasperi", "type": "string" },
                                "datatype": "string"
                            }],
                            "P813": [{
                                "snaktype": "value",
                                "property": "P813",
                                "hash": "e5f60ab0b03700bb883efce38f8022d023bc49fb",
                                "datavalue": {
                                    "value": {
                                        "time": "+2017-10-09T00:00:00Z",
                                        "timezone": 0,
                                        "before": 0,
                                        "after": 0,
                                        "precision": 11,
                                        "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                                    }, "type": "time"
                                },
                                "datatype": "time"
                            }]
                        },
                        "snaks-order": ["P248", "P535", "P1810", "P813"]
                    }]
                }]
            }
        };

        console.log("TEST");
        console.log(ps.commons.jsonToTsvValue(ogg.claims["P18"][0].mainsnak.datavalue));
        console.log(ps.commons.jsonToTsvValue(oggQualif.claims["P39"][1].mainsnak.datavalue));
        console.log(ps.commons.jsonToTsvValue(oggQualifRef.claims["P166"][0].mainsnak.datavalue));
        console.log(ps.commons.jsonToTsvValue(oggRef.claims["P140"][0].mainsnak.datavalue));
        console.log("quinto");
        console.log(ps.commons.jsonToTsvValue(oggData.claims["P570"][0].mainsnak.datavalue));
    }

    function testDuplicate(newStatement) {

        // statement di prova con data
        newStatement = {
            "id": "Q1000154\tP570\t+00000001992-01-13T00:00:00Z/11\tS854\t\"http://ead.dartmouth.edu/html/ml85.html\"",
            "dataset": "freebase",
            "subject": "Q1000154",
            "predicate": "P570",
            "object": "+00000001992-01-13T00:00:00Z/11",
            "qualifiers": [],
            "source": [{
                "sourceProperty": "P854",
                "sourceObject": "\"http://ead.dartmouth.edu/html/ml85.html\"",
                "sourceType": "url",
                "sourceId": "Q1000154\tP570\t+00000001992-01-13T00:00:00Z/11\tS854\t\"http://ead.dartmouth.edu/html/ml85.html\"",
                "key": "S854\t\"http://ead.dartmouth.edu/html/ml85.html\""
            }],
            "key": "Q1000154\tP570\t+00000001992-01-13T00:00:00Z/11"
        };

        console.log("Test duplicate");

        // api.get({
        //     action: 'wbgetclaims',
        //     entity: 'Q1000070',
        //      property: 'P27'
        // }).then(function(itemResult){
        // https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=Q1000070&property=P27&format=json
        var apiResultJSON = {
            "claims": {
                "P570": [{
                    "mainsnak": {
                        "snaktype": "value",
                        "property": "P570",
                        "hash": "fbc2fc44af284869c248e4358f37051ca983cf5a",
                        "datavalue": {
                            "value": {
                                "time": "+1992-01-13T00:00:00Z",
                                "timezone": 0,
                                "before": 0,
                                "after": 0,
                                "precision": 11,
                                "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
                            }, "type": "time"
                        },
                        "datatype": "time"
                    },
                    "type": "statement",
                    "id": "Q1000154$93F23E72-DB9E-454D-8AE0-4847B4B62663",
                    "rank": "normal",
                    "references": [{
                        "hash": "fa278ebfc458360e5aed63d5058cca83c46134f1",
                        "snaks": {
                            "P143": [{
                                "snaktype": "value",
                                "property": "P143",
                                "hash": "e4f6d9441d0600513c4533c672b5ab472dc73694",
                                "datavalue": {
                                    "value": { "entity-type": "item", "numeric-id": 328, "id": "Q328" },
                                    "type": "wikibase-entityid"
                                },
                                "datatype": "wikibase-item"
                            }]
                        },
                        "snaks-order": ["P143"]
                    }]
                }]
            }
        };


        //test();


        var property = newStatement.predicate;
        console.log(property);

        var currentStatement = apiResultJSON.claims[property][0];
        // primo elemento con questa proprietà N.B. può avere piu valori con quella P
        // quindi ciclare con un for

        var a = ps.commons.jsonToTsvValue(currentStatement.mainsnak.datavalue);

        console.log("currentStatement to TSV");
        console.log(a);

        console.log("newStatement");
        console.log(newStatement);
        console.log("itemResult");
        console.log(itemResult);
        //
        // console.log("JSON to CSV ???");
        // //ps.commons.jsonToTsvValue("test");
        // console.log(claim);
        // console.log("FINE");

        // if (claim != null) {
        //     // prop exist
        //     console.log("prop esiste");
        //
        //     // check each value of this prop
        //     for (var k=0; k<claim.length; k++){
        //         // console.log(claim[k].mainsnak.datavalue);
        //         // console.log(ps.commons.tsvValueToJson(newStatement.object));
        //
        //
        //         if (ps.commons.jsonToTsvValue(claim[k].mainsnak.datavalue) === newStatement.object &&
        //             claim[k].mainsnak.snaktype === 'value'
        //         ) {
        //             console.log("Valore uguale!")
        //             // TODO CHECK QUALIF AND SOURCE
        //
        //         } else {
        //             // valore diverso
        //             // TODO create new claim
        //         }
        //
        //         console.log("Cancellare sotto");
        //         console.log(claim[k].mainsnak.datavalue);
        //         console.log(ps.commons.tsvValueToJson(newStatement.object));
        //     }
        //
        // } else {
        //     // prop does not exist
        //     console.log("prop non esiste" + statement.predicate);
        // }

    }

    mw.ps = ps;

})(mediaWiki, jQuery);
