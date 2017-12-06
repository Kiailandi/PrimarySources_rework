/**
 *
 * PrimarySources Filter component.
 *
 * When the user clicks on the Primary Sources filter link (currently Primary Sources list),
 * a modal window will open; the user can view a table of suggested statements with eventual
 * references by building filters in several ways.
 *
 */


( function ( mw, ps ) {

    console.log("Primary sources tool - filter");

    var windowManager;
    
    // load libraries and add button to sidebar menu
    mw.loader.using(
        ['jquery.tipsy', 'oojs-ui', 'wikibase.dataTypeStore']).done( function() {
        windowManager = new OO.ui.WindowManager();
        $('body').append(windowManager.$element);

        var listButton = $(mw.util.addPortletLink(
            'p-tb',
            '#',
            'Primary Sources filter',
            'n-ps-list',
            'List statements from Primary Sources'
        ));
        listDialog(listButton);
    });

    // parsePrimarySourcesStatement moved to commons

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
                url: ps.globals.API_ENDPOINTS.FREEBASE_STATEMENT_SEARCH_URL,
                data: parameters
            }).then(function(data) { return data; }),
            ps.commons.getBlacklistedSourceUrls()
        ).then(
            function (data, blacklistedSourceUrls) {
                var isBlacklisted = ps.commons.isBlackListedBuilder(blacklistedSourceUrls);
                var statements = data.map(function(statement) {
                    return ps.commons.parsePrimarySourcesStatement(statement, isBlacklisted);
                });
                ps.commons.preloadEntityLabels(statements);
                return statements;
            }
        );
    }

    /* LIST DIALOG START */
    function listDialog(button) {
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

            var htmlCallbacks = [
                ps.commons.getValueHtml(this.statement.subject), //0
                ps.commons.getValueHtml(this.statement.predicate), //1
                ps.commons.getValueHtml(this.statement.object, this.statement.predicate) //2
            ];

            this.statement.qualifiers.forEach(function(qualifier) {
                htmlCallbacks.push(ps.commons.getValueHtml(qualifier.qualifierProperty));
                htmlCallbacks.push(
                    ps.commons.getValueHtml(qualifier.qualifierObject, qualifier.qualifierProperty)
                );
            });

            // Add reference to table
            this.statement.source.forEach(function(source){
                htmlCallbacks.push(ps.commons.getValueHtml(source.sourceProperty));
                htmlCallbacks.push(
                    ps.commons.getValueHtml(source.sourceObject, source.sourceProperty)
                );
            });

            $.when.apply(this, htmlCallbacks).then(function() {
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

                qualifiersHtml.forEach(function (row){
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
                approveButton.connect(widget, {click: 'approve'});

                var rejectButton = new OO.ui.ButtonWidget({
                    label: 'Reject',
                    flags: 'destructive'
                });
                rejectButton.connect(widget, {click: 'reject'});

                var buttonGroup = new OO.ui.ButtonGroupWidget({
                    items: [approveButton, rejectButton]
                });


                var previewButton = $('<button>').addClass('preview-button').text("Preview");

                    previewButton.click( function() {
                        mw.ps.referencePreview.openNav(
                            $(subjectHtml).text(),
                            $(propertyHtml).text(),
                            $(objectHtml).text(),
                            $(sourceValueHtml).text(),
                            $([approveButton, rejectButton])
                        )
                    });

                //  no preview button if no source
                var previewHtml = "";
                if (numberOfSource > 0) {
                    previewHtml= previewButton;
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
                    function(err, statements) {
                        for (var i in statements) {
                            ps.commons.buildValueKeysFromWikidataStatement(statements[i]);
                            if ($.inArray(
                                    widget.statement.key,
                                    ps.commons.buildValueKeysFromWikidataStatement(statements[i])
                                ) !== -1) {
                                widget.toggle(false).setDisabled(true);
                                if (widget.statement.source.length === 0) {
                                    ps.commons.setStatementState(widget.statement.id,
                                        ps.globals.STATEMENT_STATES.duplicate).done(function() {
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

        /**
         * On button click "Approve"
         */
        StatementRow.prototype.approve = function() {
            var widget = this;

            // TODO createclaim with reference


            /*
            - create claim (this is a new claim)
            - create claim with reference (this is a new claim)
            - create reference (thi is a claim already exists)
             */

            this.showProgressBar();
            ps.commons.createClaim(
                this.statement.subject,
                this.statement.predicate,
                this.statement.object,
                this.statement.qualifiers
            ).fail(function(error) {
                return ps.commons.reportError(error);
            }).done(function() {
                // if (this.statement.source.length > 0) {
                //     return; // TODO add support of source review
                // }
                ps.commons.setStatementState(widget.statement.id, ps.globals.STATEMENT_STATES.approved)
                    .done(function() {
                        widget.toggle(false).setDisabled(true);
                    });
            });
        };

        /**
         * On button click "Reject"
         */
        StatementRow.prototype.reject = function() {
            var widget = this;

            this.showProgressBar();
            ps.commons.setStatementState(widget.statement.id, ps.globals.STATEMENT_STATES.wrong)
                .done(function() {
                    widget.toggle(false).setDisabled(true);
                });
        };

        StatementRow.prototype.showProgressBar = function() {
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
        ListDialog.static.title = 'Primary Sources statement filter (in development)';
        ListDialog.static.size = 'larger';
        ListDialog.static.actions = [
            {label: 'Close', flags: 'safe'}
        ];

        ListDialog.prototype.initialize = function() {
            ListDialog.super.prototype.initialize.apply(this, arguments);

            var widget = this;

            /**
             * Dataset dropdown
             * @type {OO.ui.DropdownInputWidget}
             */
            this.datasetInput = new OO.ui.DropdownInputWidget();
            ps.commons.getPossibleDatasets(function(datasets) {
                var options = [{data: '', label: 'All sources'}];
                for (var datasetId in datasets) {
                    options.push({data: datasetId, label: datasetId});
                }
                widget.datasetInput.setOptions(options)
                    .setValue(ps.commons.dataset);
            });

            /**
             * Property field
             * @type {OO.ui.TextInputWidget}
             */
            this.propertyInput = new OO.ui.TextInputWidget({
                placeholder: 'PXX',
                validate: /^[pP]\d+$/
            });

            /**
             * Value field
             * @type {OO.ui.TextInputWidget}
             */
            this.valueInput = new OO.ui.TextInputWidget({
                placeholder: 'Filter by value like item id',
                id: 'test'
            });

            /**
             * Domain of interest field
             * @type {OO.ui.TextInputWidget}
             */
            this.domainOfInterest = new OO.ui.TextInputWidget({
                placeholder: 'Filter by domain of interest'
            });

            /**
             * Sparql query field
             * @type {OO.ui.TextInputWidget}
             */
            this.sparqlQuery = new OO.ui.TextInputWidget( {
                placeholder: 'Write your SPARQL query',
                multiline: true
            } );

            var loadButton = new OO.ui.ButtonInputWidget({
                label: 'Load',
                flags: 'progressive',
                type: 'submit'
            });
            loadButton.connect(this, {click: 'onOptionSubmit'});

            var fieldset = new OO.ui.FieldsetLayout({
                label: 'Query options',
                classes: ['container']
            });
            fieldset.addItems([
                new OO.ui.FieldLayout(this.datasetInput, {label: 'Dataset'}),
                new OO.ui.FieldLayout(this.propertyInput, {label: 'Property'}),
                new OO.ui.FieldLayout(this.valueInput, {label: 'Value'}),
                new OO.ui.FieldLayout(this.domainOfInterest, {label: 'Domain of interest'}),
                new OO.ui.FieldLayout(this.sparqlQuery, {label: 'SPARQL Query'}),
                new OO.ui.FieldLayout(loadButton)
            ]);
            var formPanel = new OO.ui.PanelLayout({
                padded: true,
                framed: true
            });
            formPanel.$element.append(fieldset.$element);

            // Main panel
            var alertIcon = new OO.ui.IconWidget({
                icon: 'alert'
            });
            var description = new OO.ui.LabelWidget({
                label: 'This feature is currently in active development. ' +
                'It allows to list statements contained in Primary Sources ' +
                'and do action on them. Statements with qualifiers or sources ' +
                'are hidden.'
            });
            this.mainPanel = new OO.ui.PanelLayout({
                padded: true,
                scrollable: true
            });
            this.mainPanel.$element.append(alertIcon.$element, description.$element);

            // Final layout
            this.stackLayout = new OO.ui.StackLayout({
                continuous: true
            });
            this.stackLayout.addItems([formPanel, this.mainPanel]);
            this.$body.append(this.stackLayout.$element);
        };

        ListDialog.prototype.onOptionSubmit = function() {
            this.mainPanel.$element.empty();
            this.table = null;
            this.parameters = {
                dataset: this.datasetInput.getValue(),
                property: this.propertyInput.getValue(),
                value: this.valueInput.getValue(),
                offset: 0,
                limit: 10 // number of loaded statements
            };
            this.alreadyDisplayedStatementKeys = {};

            this.executeQuery();
        };

        /**
         * On submit
         */
        ListDialog.prototype.executeQuery = function() {
            var widget = this;

            var progressBar = new OO.ui.ProgressBarWidget();
            progressBar.$element.css('max-width', '100%');
            widget.mainPanel.$element.append(progressBar.$element);
            // do research
            searchStatements(this.parameters)
                .fail(function() {
                    progressBar.$element.remove();
                    var description = new OO.ui.LabelWidget({
                        label: 'No statements found.'
                    });
                    widget.mainPanel.$element.append(description.$element);
                })
                .done(function(statements) {
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
                            {click: 'onNextButtonSubmit'}
                        );
                        widget.mainPanel.$element.append(
                            widget.nextStatementsButton.$element
                        );
                    }
                });
        };

        ListDialog.prototype.onNextButtonSubmit = function() {
            this.nextStatementsButton.$element.remove();
            this.executeQuery();
        };

        /**
         * Display result
         * @param statements
         */
        ListDialog.prototype.displayStatements = function(statements) {
            var widget = this;

            if (this.table === null) { // Initialize the table
                this.initTable();
            }

            console.log("Statements");
            console.log(statements);

            // Create row for the table
            statements.map(function(statement) {
                statement.key = statement.subject + '\t' +
                    statement.predicate + '\t' +
                    statement.object;
                statement.qualifiers.forEach(function(qualifier) {
                    statement.key += '\t' + qualifier.qualifierProperty + '\t' +
                        qualifier.qualifierObject;
                });
                if (statement.key in widget.alreadyDisplayedStatementKeys) {
                    return; // Don't display twice the same statement
                }
                widget.alreadyDisplayedStatementKeys[statement.key] = true;

                var row = new StatementRow({
                    statement: statement
                });
                widget.table.append(row.$element);
            });
        };

        ListDialog.prototype.initTable = function() {
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

        ListDialog.prototype.getBodyHeight = function() {
            return window.innerHeight - 100;
        };

        windowManager.addWindows([new ListDialog()]);

        button.click(function() {
            windowManager.openWindow('ps-list');
        });
    }
  /* LIST DIALOG END */


    // $( '#test' ).autocomplete( {
    //     source: function( request, response ) {
    //         // Create a new Api object (see [[RL/DM#mediawiki.api]]
    //         var api = new mw.Api();
    //         // Start a "GET" request
    //         api.get( {
    //             action: 'opensearch',
    //             search: request.term, // This is the current value of the user's input
    //             suggest: ''
    //         } ).done( function ( data ) {
    //             response( data[1] ); // set the results as the autocomplete options
    //         } );
    //     }
    // } );

}( mediaWiki, primarySources ) );