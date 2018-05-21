/**
 * Filter component.
 *
 * When the user clicks on the filter link, a modal window will open.
 * The user can view a table of suggested statements with eventual
 * references by building filters in several ways.
 */
( function ( mw, $ ) {
	var ps = mw.ps || {},
		searchSparqlQuery =
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
		'LIMIT {{LIMIT}}',
		searchWithValueSparqlQuery =
		'SELECT {{BINDINGS}} ' +
		'WHERE {' +
		'  GRAPH {{DATASET}} {' +
		'    ?subject a wikibase:Item ;' +
		'             {{PROPERTY}} ?statement_node .' +
		'    { SELECT ?statement_node WHERE {' +
		'      ?statement_node ?statement_property wd:{{VALUE}} .' +
		'    } }' +
		'    ?statement_node ?statement_property ?value .  ' +
		'    OPTIONAL { ?value ?reference_property ?reference_value . }' +
		'  } ' +
		'{{FILTER}}' +
		'} ' +
		'OFFSET {{OFFSET}} ' +
		'LIMIT {{LIMIT}}',
		subjectsSparqlQuery =
		'SELECT ?subject WHERE { ?subject a wikibase:Item } OFFSET {{OFFSET}} LIMIT {{LIMIT}}',
		datasetFilter = 'FILTER STRENDS(str(?dataset), "new") . ';

	/*
	 * BEGIN: private functions
	 */
	function populateAutocompletionCache( service ) {
		var cache = {},
			filteredDataset = ps.globals.DATASET,
			addLabels = function ( ids, currentCache ) {
				// getEntityLabels return Window when the IDs are less than the API threshold
				if ( ids.length > 40 ) {
					ps.commons.getEntityLabels( ids )
						.then( function ( labels ) {
							currentCache = $.extend( currentCache, labels );
						} );
				} else {
					ps.commons.getFewEntityLabels( ids )
						.then( function ( labels ) {
							currentCache = $.extend( currentCache, labels );
						} );
				}
				return currentCache;
			};

		$.get( service, function ( data ) {
			var dataset, ids;
			if ( filteredDataset ) {
				cache = addLabels( data[ filteredDataset ], cache );
			} else {
				for ( dataset in data ) {
					if ( data.hasOwnProperty( dataset ) ) {
						ids = data[ dataset ];
						cache = addLabels( ids, cache );
					}
				}
			}
		} )
			.fail( function ( xhr, textStatus ) {
				console.warn(
					'PRIMARY SOURCES TOOL: Could not cache suggestions for autocompletion. ' +
					'The call to', service,
					'went wrong:', textStatus
				);
			} );
		return cache;
	}

	function handleSparqlError( xhr, progressBar, widget ) {
		var exceptionParts, exceptionType, alertIcon, typeMessage, reasonMessage;
		// A bad request means a bad query
		if ( xhr.status === 400 ) {
			// java.util.concurrent.ExecutionException:
			// org.openrdf.query.MalformedQueryException:
			// Encountered " "a" "a "" at line 1, column 1.
			exceptionParts = xhr.responseText.split( '\n' )[ 1 ].split( 'Exception' );
			exceptionType = exceptionParts[ 1 ]
				.split( '.' )
				.pop()
				.replace( /([A-Z])/g, ' $1' )
				.trim();
			progressBar.$element.remove();
			alertIcon = new OO.ui.IconWidget( {
				icon: 'alert'
			} );
			typeMessage = new OO.ui.LabelWidget( {
				label: new OO.ui.HtmlSnippet( '<b>' + exceptionType + '</b>' )
			} );
			reasonMessage = new OO.ui.LabelWidget( {
				label: exceptionParts[ 2 ]
			} );
			widget.mainPanel.$element.append(
				alertIcon.$element,
				typeMessage.$element,
				reasonMessage.$element
			);
		}
	}
	/*
	 * END: private functions
	 */

	// The only public function is the one that creates the whole dialog window
	ps.filter = {
		initFilterDialog: function initFilterDialog( windowManager, linkToBind ) {
			/* BEGIN: Query result table rows */
			// A table row built from a search query
			// See search* variables at the beginning of this module
			function SearchResultRow(
				binding, filteredProperty, filteredItemValue, filteredDataset, isBlacklisted
			) {
				/*
				 * binding should be:
				 * Subject, property, value, reference_property, reference_value, dataset
				 *   [0]      [1]      [2]           [3]               [4]          [5]
				 */
				var referenceValue = binding[ 4 ],
					widget = this,
					cells = [],
					uriPrefix = 'http://www.wikidata.org/',
					curationButtons = new OO.ui.ButtonGroupWidget( {
						items: [
							new OO.ui.ButtonWidget( {
								label: 'Approve',
								flags: 'progressive',
								icon: 'add',
								disabled: true
							} )
								.connect( widget, { click: 'approve' } ),
							new OO.ui.ButtonWidget( {
								label: 'Reject',
								flags: 'destructive',
								icon: 'trash',
								disabled: true
							} )
								.connect( widget, { click: 'reject' } )
						]
					} ),
					// Build the QuickStatement needed for the /curate service
					subject = binding[ 0 ].substring( ( uriPrefix + 'entity/' ).length ),
					actualProperty = filteredProperty ||
					binding[ 1 ].substring( ( uriPrefix + 'prop/' ).length ),
					actualValue, referenceProperty, previewButton, previewParams;

				SearchResultRow.super.call(
					this,
					binding,
					filteredProperty,
					filteredItemValue,
					filteredDataset,
					isBlacklisted
				);

				/*
				 * Do not show blacklisted URLs.
				 * Statements will not be blacklisted in the back end.
				 * The item curation module is responsible for that.
				 */
				if ( isBlacklisted &&
					ps.commons.isUrl( referenceValue ) &&
					isBlacklisted( referenceValue )
				) {
					console.info(
						'PRIMARY SOURCES TOOL: Skipping statement with blacklisted reference URL ' +
						'<' + referenceValue + '>'
					);
					return;
				}

				// BEGIN: data cells
				binding.forEach( function ( value ) {
					var cell = $( '<td>' );
					if ( /[QP]\d+$/.test( value ) ) {
						// Entities: format linked labels
						ps.commons.getEntityLabel( value.split( '/' ).pop() )
							.then( function ( label ) {
								cell.append(
									$( '<a>' )
										.attr( 'href', value )
										.text( label )
								);
							} );
						cells.push( cell );
					} else if ( ps.commons.isUrl( value ) ) {
						// URLs: make a link
						cell.append(
							$( '<a>' )
								.attr( 'href', value )
								.text( value )
						);
						cells.push( cell );
					} else {
						// Literals: return as is
						cell.text( value );
						cells.push( cell );
					}
				} );
				// END: data cells

				// BEGIN: action buttons
				if ( filteredItemValue ) {
					actualValue = filteredItemValue;
				} else {
					actualValue = binding[ 2 ].startsWith( uriPrefix + 'entity/' ) ?
						binding[ 2 ].substring( ( uriPrefix + 'entity/' ).length ) :
						binding[ 2 ];
				}
				if ( binding[ 3 ].startsWith( uriPrefix + 'prop/reference/' ) ) {
					referenceProperty = binding[ 3 ]
						.substring( ( uriPrefix + 'prop/reference/' ).length )
						.replace( 'P', 'S' );
					referenceValue = binding[ 4 ].startsWith( uriPrefix + 'entity/' ) ?
						binding[ 4 ].substring( ( uriPrefix + 'entity/' ).length ) :
						binding[ 4 ];
					this.statementType = 'reference';
				} else {
					this.statementType = 'claim';
				}
				this.dataset = filteredDataset === '' ? binding[ 5 ] : filteredDataset;
				this.quickStatement = referenceProperty ?
					[
						subject,
						actualProperty,
						actualValue,
						referenceProperty,
						referenceValue
					].join( '\t' ) :
					[
						subject,
						actualProperty,
						actualValue
					].join( '\t' );
				// Generate the preview button only if we have a reference URL
				if ( referenceProperty === 'S854' ) {
					previewButton = new OO.ui.ButtonWidget( {
						label: 'Preview',
						flags: [ 'primary', 'progressive' ],
						icon: 'articleSearch'
					} )
						.connect( widget, { click: function () {
							curationButtons.getItems().forEach(
								function ( item ) {
									item.setDisabled( false );
								}
							);
							// Reuse the label from the cells
							previewParams = [ cells[ 0 ].text() ];
							if ( filteredProperty ) {
								previewParams.push( filteredProperty );
							} else {
								previewParams.push( cells[ 1 ].text() );
							}
							if ( filteredItemValue ) {
								previewParams.push( filteredItemValue );
							} else {
								previewParams.push( cells[ 2 ].text() );
							}
							previewParams.push( referenceValue );
							console.debug(
								'PRIMARY SOURCES TOOL: Parameters passed to the reference preview:',
								previewParams
							);
							ps.referencePreview.openNav(
								previewParams[ 0 ],
								previewParams[ 1 ],
								previewParams[ 2 ],
								previewParams[ 3 ],
								$( curationButtons.$element )
							);
						}
						} );
				} else {
					curationButtons.getItems().forEach(
						function ( item ) {
							item.setDisabled( false );
						}
					);
				}
				if ( previewButton ) {
					cells.push(
						$( '<td>' ).append(
							previewButton.$element,
							curationButtons.$element
						)
					);
				} else {
					cells.push( $( '<td>' ).append( curationButtons.$element ) );
				}
				// END: action buttons

				this.$element.append(
					$( '<tr>' ).css( 'text-align', 'center' ).append( cells )
				);
			}
			OO.inheritClass( SearchResultRow, OO.ui.Widget );
			SearchResultRow.static.tagName = 'tbody';

			SearchResultRow.prototype.approve = function () {
				var i,
					widget = this,
					qs = widget.quickStatement,
					parts = qs.split( '\t' ),
					length = parts.length,
					subject = parts[ 0 ],
					property = parts[ 1 ],
					object = ps.commons.rdfValueToTsv( parts[ 2 ] ),
					qualifiers = [],
					references = [];

				for ( i = 3; i < length; i += 2 ) {
					if ( i === length - 1 ) {
						console.warn(
							'PRIMARY SOURCES TOOL: Malformed QuickStatement, ' +
							'will skip qualifiers and references:', qs
						);
						break;
					}
					if ( /^P\d+$/.exec( parts[ i ] ) ) {
						qualifiers.push( {
							qualifierProperty: parts[ i ],
							qualifierObject: ps.commons.rdfValueToTsv( parts[ i + 1 ] )
						} );
					} else if ( /^S\d+$/.exec( parts[ i ] ) ) {
						references.push( {
							sourceProperty: parts[ i ].replace( /^S/, 'P' ),
							sourceObject: ps.commons.rdfValueToTsv( parts[ i + 1 ] ),
							sourceType: ps.commons.rdfValueToJson( parts[ i + 1 ] ).type
						} );
					}

				}
				widget.showProgressBar();
				ps.commons.getClaims( subject, property, function ( err, claims ) {
					var i, lenI, claim,
						objectExists = false;

					for ( i = 0, lenI = claims.length; i < lenI; i++ ) {
						claim = claims[ i ];
						if (
							claim.mainsnak.snaktype === 'value' &&
						ps.commons.jsonToTsvValue( claim.mainsnak.datavalue ) === object
						) {
							objectExists = true;
							break;
						}
					}
					// The claim is already in Wikidata
					// Only add the reference, don't add if no reference
					if ( objectExists ) {
						if ( widget.statementType === 'reference' ) {
							ps.commons.createReference( subject, property, object, references,
								function ( error ) {
									if ( error ) {
										widget.toggle( false ).setDisabled( true );
										return ps.commons.reportError( error );
									}
									// The back end approves everything
									ps.commons.setStatementState(
										qs,
										ps.globals.STATEMENT_STATES.approved,
										widget.dataset,
										widget.statementType
									)
										.fail( function () {
											widget.toggle( false ).setDisabled( true );
										} )
										.done( function () {
											console.info(
												'PRIMARY SOURCES TOOL: ' +
												'Approved referenced claim [' + qs + ']'
											);
											widget.toggle( false ).setDisabled( true );
										} );
								}
							);
						}
					} else {
						// Add a new referenced claim
						if ( widget.statementType === 'reference' ) {
							ps.commons.createClaimWithReference(
								subject,
								property,
								object,
								qualifiers,
								references
							)
								.fail( function ( error ) {
									widget.toggle( false ).setDisabled( true );
									return ps.commons.reportError( error );
								} )
								.done( function () {
									ps.commons.setStatementState(
										qs,
										ps.globals.STATEMENT_STATES.approved,
										widget.dataset,
										widget.statementType
									)
										.fail( function () {
											widget.toggle( false ).setDisabled( true );
										} )
										.done( function () {
											console.info(
												'PRIMARY SOURCES TOOL: ' +
												'Approved referenced claim [' + qs + ']'
											);
											widget.toggle( false ).setDisabled( true );
										} );
								} );
						} else {
							// Add a new unreferenced claim
							ps.commons.createClaim( subject, property, object, qualifiers )
								.fail( function ( error ) {
									widget.toggle( false ).setDisabled( true );
									return ps.commons.reportError( error );
								} )
								.done( function () {
									ps.commons.setStatementState(
										qs,
										ps.globals.STATEMENT_STATES.approved,
										widget.dataset,
										widget.statementType
									)
										.fail( function () {
											widget.toggle( false ).setDisabled( true );
										} )
										.done( function () {
											console.info(
												'PRIMARY SOURCES TOOL: ' +
												'Approved claim with no reference [' + qs + ']'
											);
											widget.toggle( false ).setDisabled( true );
										} );
								} );
						}
					}
				} );
			};

			SearchResultRow.prototype.reject = function () {
				var widget = this;

				widget.showProgressBar();
				ps.commons.setStatementState(
					widget.quickStatement,
					ps.globals.STATEMENT_STATES.rejected,
					widget.dataset,
					widget.statementType
				)
					.fail( function () {
						widget.toggle( false ).setDisabled( true );
					} )
					.done( function () {
						var message = widget.statementType === 'claim' ?
							'Rejected claim with no reference [' + widget.quickStatement + ']' :
							'Rejected referenced claim [' + widget.quickStatement + ']';
						console.info( message );
						widget.toggle( false ).setDisabled( true );
					} );
			};

			SearchResultRow.prototype.showProgressBar = function () {
				var progressBar = new OO.ui.ProgressBarWidget();

				progressBar.$element.css( 'max-width', '100%' );
				this.$element.empty()
					.append(
						$( '<td>' )
							.attr( 'colspan', 7 )
							.append( progressBar.$element )
					);
			};

			// A table row built from a SPARQL query
			function SparqlResultRow( headers, bindings ) {
				var cells = [];

				SparqlResultRow.super.call( this, headers, bindings );
				headers.forEach( function ( header ) {
					var cell = $( '<td>' ),
						value, valueType, label;
					// Handle empty values in case of OPTIONAL clauses
					if ( bindings.hasOwnProperty( header ) ) {
						value = bindings[ header ].value;
						valueType = bindings[ header ].type;
					} else {
						value = null;
						valueType = null;
					}
					// Empty cell
					if ( value === null ) {
						cells.push( cell );
					} else if ( valueType === 'uri' && /[QP]\d+$/.test( value ) ) {
						// Entities: format linked labels
						ps.commons.getEntityLabel( value.split( '/' ).pop() )
							.then( function ( label ) {
								cell.append(
									$( '<a>' )
										.attr( 'href', value )
										.text( label )
								);
							} );
						cells.push( cell );
					} else if ( valueType === 'uri' ) {
						// URIs: make a link
						// Mint readable labels based on expected namespaces
						if (
							value === 'http://www.w3.org/ns/prov#wasDerivedFrom'
						) {
							label = 'RDF reference property';
						} else if (
							value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
						) {
							label = 'RDF type';
						} else if (
							value.startsWith( 'http://www.wikidata.org/entity/statement/' )
						) {
							label = 'RDF statement node';
						} else if (
							value.startsWith( 'http://www.wikidata.org/reference/' )
						) {
							label = 'RDF reference node';
						} else {
							label = value;
						}
						cell.append(
							$( '<a>' )
								.attr( 'href', value )
								.text( label )
						);
						cells.push( cell );
					} else {
						// Literals: return as is
						cell.text( value );
						cells.push( cell );
					}
				} );
				this.$element.append(
					$( '<tr>' ).css( 'text-align', 'center' ).append( cells )
				);
			}
			OO.inheritClass( SparqlResultRow, OO.ui.Widget );
			SparqlResultRow.static.tagName = 'tbody';

			SparqlResultRow.prototype.showProgressBar = function () {
				var progressBar = new OO.ui.ProgressBarWidget();

				progressBar.$element.css( 'max-width', '100%' );
				this.$element.empty()
					.append(
						$( '<td>' )
							.attr( 'colspan', 5 )
							.append( progressBar.$element )
					);
			};

			// A table row built from the response of the primary sources tool API
			function ServiceResultRow( entityId ) {
				var cell = $( '<td>' );
				ServiceResultRow.super.call( this, entityId );
				ps.commons.getEntityLabel( entityId )
					.then( function ( label ) {
						var link = entityId.startsWith( 'P' ) ?
							document.location.origin + '/wiki/Property:' + entityId :
							entityId;
						cell.append(
							$( '<a>' )
								.attr( 'href', link )
								.text( label )
						);
					} );
				this.$element.append(
					$( '<tr>' ).css( 'text-align', 'center' ).append( cell )
				);
			}
			OO.inheritClass( ServiceResultRow, OO.ui.Widget );
			ServiceResultRow.static.tagName = 'tbody';
			/* END: Query result table rows */

			/* BEGIN: item value and property filters with autocompletion */
			function AutocompleteWidget( config ) {
				OO.ui.SearchInputWidget.call( this, config );
				OO.ui.mixin.LookupElement.call( this, config );
				this.cache = config.cache;
			}
			OO.inheritClass( AutocompleteWidget, OO.ui.SearchInputWidget );
			OO.mixinClass( AutocompleteWidget, OO.ui.mixin.LookupElement );

			/**
			 * @inheritdoc
			 */
			AutocompleteWidget.prototype.getLookupRequest = function () {
				var widget = this,
					userInput = widget.getValue(),
					deferred = $.Deferred(),
					getSuggestions = function ( input, cache ) {
						var id,
							suggestions = {};
						for ( id in cache ) {
							if ( cache.hasOwnProperty( id ) ) {
								if ( cache[ id ].toLowerCase().includes( input.toLowerCase() ) ) {
									suggestions[ id ] = cache[ id ];
								}
							}
						}
						return suggestions;
					};
				if ( widget.cache ) {
					deferred.resolve( getSuggestions( userInput, widget.cache ) );
				} else {
					deferred.resolve( {} );
				}
				return deferred.promise( { abort: function () { } } );
			};

			/**
			 * @inheritdoc
			 */
			AutocompleteWidget.prototype.getLookupCacheDataFromResponse = function ( response ) {
				return response || {};
			};

			/**
			 * @inheritdoc
			 */
			AutocompleteWidget.prototype.getLookupMenuOptionsFromData = function ( data ) {
				var id, label,
					items = [];
				for ( id in data ) {
					if ( data.hasOwnProperty( id ) ) {
						label = data[ id ];
						items.push( new OO.ui.MenuOptionWidget( {
							data: id,
							label: label
						} ) );
					}
				}
				return items;
			};

			/*
			 * The method implemented in OO.ui.mixin.LookupElement
			 * sets the value of the input widget to the DATA of the chosen element.
			 * Set it to the LABEL instead (and properly set the data).
			 * Also ensure the lookup menu is not displayed again when the value is set.
			 * See https://doc.wikimedia.org/oojs-ui/master/js/#!/api/OO.ui.mixin.LookupElement
			 */
			AutocompleteWidget.prototype.onLookupMenuItemChoose = function ( item ) {
				this.setLookupsDisabled( true );
				this
					.setValue( item.getLabel() )
					.setData( item.getData() );
				this.setLookupsDisabled( false );
			};
			/* END: item value and property filters with autocompletion */

			/* BEGIN: filter dialog construction */
			function FilterDialog( config ) {
				FilterDialog.super.call( this, config );
			}
			OO.inheritClass( FilterDialog, OO.ui.ProcessDialog );
			FilterDialog.static.name = 'ps-filter';
			FilterDialog.static.title = 'primary sources filter';
			FilterDialog.static.size = 'full';
			FilterDialog.static.actions = [
				{
					label: 'Close',
					flags: [ 'safe', 'destructive' ],
					icon: 'close'
				}
			];

			/**
			 * @inheritdoc
			 *
			 * N.B.: Re-implemented here because the MediaWiki Vagrant instance on VPS
			 * has a dummy implementation, i.e., function(){return;}
			 * Modify to emit 'enter' on Ctrl/Meta+Enter, instead of plain Enter
			 */
			OO.ui.MultilineTextInputWidget.prototype.onKeyPress = function ( e ) {
				if (
					(
						this.getValue() &&
						e.which === OO.ui.Keys.ENTER &&
						( e.ctrlKey || e.metaKey )
					) ||
					// Some platforms emit keycode 10 for ctrl+enter in a textarea
					e.which === 10
				) {
					this.emit( 'enter', e );
				}
			};

			FilterDialog.prototype.initialize = function () {
				var widget = this,
					// Entity value autocompletion
					itemValueCache = populateAutocompletionCache(
						ps.globals.API_ENDPOINTS.VALUES_SERVICE
					),
					// Property autocompletion
					propertyCache = populateAutocompletionCache(
						ps.globals.API_ENDPOINTS.PROPERTIES_SERVICE
					),
					fieldSet = new OO.ui.FieldsetLayout( {
						classes: [ 'container' ]
					} ),
					formPanel = new OO.ui.PanelLayout( {
						padded: true,
						framed: true
					} );

				FilterDialog.super.prototype.initialize.apply( this, arguments );

				// Instructions
				this.instructions = new OO.ui.PopupButtonWidget( {
					label: 'How to use',
					icon: 'help',
					flags: 'progressive',
					popup: {
						padded: true,
						align: 'center',
						position: 'after',
						width: 500,
						$content: $(
							'<ol>' +
								'<li>' +
									'Select a <b>Dataset</b> or <code>All sources</code>;' +
								'</li>' +
								'<li>' +
									'Just hit <i>Run</i> for a generic search ' +
									'or choose a filter:</li>' +
								'<ul>' +
									'<li>' +
										'<b>Baked filters</b> ' +
										'return links to entities that need curation. ' +
										'They <i>run immediately</i> after you pick one;' +
									'</li>' +
									'<li>' +
										'<b>Entity</b> and <b>Property of interest</b> ' +
										'return statements you can curate on the fly. ' +
										'Pick a value and hit <i>enter</i> or <i>Run</i>;' +
									'</li>' +
									'<li>' +
										'Type an arbitrary <b>SPARQL query</b> and ' +
										'hit <i>ctrl/cmd + enter</i> or <i>Run</i>.' +
									'</li>' +
								'</ul>' +
							'</ol>'
						)
					}
				} );

				// 'Dataset' drop-down menu
				this.datasetInput = new OO.ui.DropdownInputWidget();
				ps.commons.getDatasets( function ( datasets ) {
					var options = [ { data: '', label: 'All sources' } ];
					datasets.forEach( function ( item ) {
						var uri = item.dataset;
						options.push( { data: uri, label: ps.commons.datasetUriToLabel( uri ) } );
					} );
					widget.datasetInput.setOptions( options )
						.setValue( ps.globals.DATASET );
				} );

				// 'Baked filters' drop-down menu
				this.bakedFilters = new OO.ui.DropdownWidget( {
					label: 'Pick one',
					menu: {
						items: [
							new OO.ui.MenuSectionOptionWidget( {
								label: 'General'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: 'subjects',
								label: 'All subject items'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: 'properties',
								label: 'All properties'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: 'values',
								label: 'All item values'
							} ),
							new OO.ui.MenuSectionOptionWidget( {
								label: 'People'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: 'Q6581097',
								label: 'Males'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: 'Q6581072',
								label: 'Females'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: 'P19',
								label: 'Places of birth'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: 'P569',
								label: 'Dates of birth'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: '',
								label: 'Journey destinations'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: 'P463',
								label: 'Members of'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: 'P937',
								label: 'Work locations'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: 'P20',
								label: 'Places of death'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: 'P570',
								label: 'Dates of death'
							} ),
							new OO.ui.MenuSectionOptionWidget( {
								label: 'Occupations'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: 'Q11569986',
								label: 'Painters'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: 'Q11569986',
								label: 'Printmakers'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: 'Q482980',
								label: 'Authors'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: 'Q1097498',
								label: 'Rulers'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: 'Q82955',
								label: 'Politicians'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: 'Q2259532',
								label: 'Clerics'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: 'Q2516866',
								label: 'Publishers'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: 'Q16631371',
								label: 'Researchers'
							} ),
							new OO.ui.MenuOptionWidget( {
								data: 'Q1281618',
								label: 'Sculptors'
							} )
						]
					}
				} )
					.connect( this, {
						labelChange: function () {
							if ( this.bakedFilters.getMenu().findSelectedItem() ) {
								this.itemValueInput.setDisabled( true );
								this.propertyInput.setDisabled( true );
								this.sparqlQuery.setDisabled( true );
							} else {
								this.itemValueInput.setDisabled( false );
								this.propertyInput.setDisabled( false );
								this.sparqlQuery.setDisabled( false );
							}
						}
					} );
				this.bakedFilters.getMenu().connect( this, { choose: 'onOptionSubmit' } );

				// 'Entity of interest' autocompletion
				this.itemValueInput = new AutocompleteWidget( {
					placeholder: 'Type something you are interested in, like "politician"',
					cache: itemValueCache
				} )
					.connect( this, {
						change: function () {
							if ( this.itemValueInput.getValue() || this.propertyInput.getValue() ) {
								this.bakedFilters.setDisabled( true );
								this.sparqlQuery.setDisabled( true );
							} else {
								this.bakedFilters.setDisabled( false );
								this.sparqlQuery.setDisabled( false );
							}
						},
						enter: 'onOptionSubmit'
					} );

				// 'Property of interest' autocompletion
				this.propertyInput = new AutocompleteWidget( {
					placeholder: 'Type a property like "date of birth"',
					cache: propertyCache
				} )
					.connect( this, {
						change: function () {
							if ( this.propertyInput.getValue() || this.itemValueInput.getValue() ) {
								this.bakedFilters.setDisabled( true );
								this.sparqlQuery.setDisabled( true );
							} else {
								this.bakedFilters.setDisabled( false );
								this.sparqlQuery.setDisabled( false );
							}
						},
						enter: 'onOptionSubmit'
					} );

				// 'SPARQL query' text area
				this.sparqlQuery = new OO.ui.MultilineTextInputWidget( {
					placeholder: 'Browse suggestions with SPARQL (limited to 100 results).',
					autosize: true
				} )
					.connect( this, {
						change: function () {
							if ( this.sparqlQuery.getValue() ) {
								this.datasetInput.setDisabled( true );
								this.bakedFilters.setDisabled( true );
								this.itemValueInput.setDisabled( true );
								this.propertyInput.setDisabled( true );
							} else {
								this.datasetInput.setDisabled( false );
								this.bakedFilters.setDisabled( false );
								this.itemValueInput.setDisabled( false );
								this.propertyInput.setDisabled( false );
							}
						},
						enter: 'onOptionSubmit'
					} );

				// 'Run' button
				this.loadButton = new OO.ui.ButtonInputWidget( {
					label: 'Run',
					flags: [ 'primary', 'progressive' ],
					icon: 'next',
					type: 'submit'
				} )
					.connect( this, { click: 'onOptionSubmit' } );

				fieldSet.addItems( [
					new OO.ui.FieldLayout(
						this.instructions,
						{
							label: ' ',
							align: 'right'
						}
					),
					new OO.ui.FieldLayout(
						this.datasetInput,
						{
							label: 'Dataset',
							align: 'right'
						}
					),
					new OO.ui.FieldLayout(
						this.bakedFilters,
						{
							label: 'Baked filters',
							align: 'right'
						}
					),
					new OO.ui.FieldLayout(
						this.itemValueInput,
						{
							label: 'Entity of interest',
							align: 'right',
							help: 'It may take a while for some values to load'
						}
					),
					new OO.ui.FieldLayout(
						this.propertyInput,
						{
							label: 'Property of interest',
							align: 'right'
						}
					),
					new OO.ui.FieldLayout(
						this.sparqlQuery,
						{
							label: 'SPARQL query',
							align: 'right'
						}
					),
					new OO.ui.FieldLayout(
						this.loadButton,
						{
							// Hack to place the button under the other fields
							label: ' ',
							align: 'right'
						}
					)
				] );
				formPanel.$element.append( fieldSet.$element );

				// Filter results panel
				this.mainPanel = new OO.ui.PanelLayout( {
					padded: true,
					scrollable: true
				} );

				// Final layout
				this.stackLayout = new OO.ui.StackLayout( {
					continuous: true
				} );
				this.stackLayout.addItems( [ formPanel, this.mainPanel ] );
				this.$body.append( this.stackLayout.$element );
			};

			FilterDialog.prototype.getBodyHeight = function () {
				return window.innerHeight - 100;
			};
			/* END: filter dialog construction */

			/* BEGIN: Handlers for 'Run' and 'Load more' buttons */
			// On 'Run' button press
			FilterDialog.prototype.onOptionSubmit = function () {
				var filledQuery,
					bindings,
					bakedFiltersMenu,
					bakedSelection,
					baked,
					query,
					filteredItemValue,
					filteredProperty,
					// The dataset field is needed for all filters but the arbitrary SPARQL query
					filteredDataset = this.datasetInput.getValue();

				this.mainPanel.$element.empty();
				this.table = null;

				if ( !this.bakedFilters.isDisabled() &&
				!this.propertyInput.isDisabled() &&
				!this.itemValueInput.isDisabled() &&
				!this.sparqlQuery.isDisabled() ) {
					// Default search
					filledQuery = searchSparqlQuery.replace( '{{PROPERTY}}', '?property' );
					bindings = '?subject ?property ?statement_node ' +
					'?value ?reference_property ?reference_value';
					if ( filteredDataset ) {
						filledQuery = filledQuery
							.replace( '{{DATASET}}', '<' + filteredDataset + '>' )
							.replace( '{{FILTER}}', '' );
					} else {
						filledQuery = filledQuery
							.replace( '{{DATASET}}', '?dataset' )
							.replace( '{{FILTER}}', datasetFilter );
						bindings += ' ?dataset';
					}
					this.sparql = filledQuery.replace( '{{BINDINGS}}', bindings );
					this.sparqlOffset = 0;
					/*
					 * Minimal limit value to avoid empty result tables,
					 * due to SPARQL results merged on the statement_node binding.
					 * See ListDialog.prototype.displaySearchResult
					 * 0/50 runs were empty
					 */
					this.sparqlLimit = 175;
					this.filteredDataset = filteredDataset;
					this.filteredProperty = null;
					this.filteredItemValue = null;
					console.debug(
						'PRIMARY SOURCES TOOL: DEFAULT SEARCH triggered. Query:',
						this.sparql
					);
					this.executeSearch();
				} else if ( !this.bakedFilters.isDisabled() ) {
					// Baked filters
					bakedFiltersMenu = this.bakedFilters.getMenu();
					bakedSelection = bakedFiltersMenu.findSelectedItem();
					baked = bakedSelection.getData();
					// Reset selection and meaningful label
					bakedFiltersMenu.selectItem();
					this.bakedFilters.setLabel(
						new OO.ui.HtmlSnippet(
							'Pick one (was <i>' + bakedSelection.getLabel() + '</i>)'
						)
					);
					switch ( baked ) {
						case 'subjects':
							this.sparql = subjectsSparqlQuery;
							this.sparqlOffset = 0;
							this.sparqlLimit = 100;
							console.debug(
								'PRIMARY SOURCES TOOL: BAKED FILTER triggered. ' +
								'Subjects-only query:',
								this.sparql
							);
							this.executeSparqlQuery();
							break;
						case 'properties':
							console.debug(
								'PRIMARY SOURCES TOOL: BAKED FILTER triggered. ' +
								'All properties service call'
							);
							this.executeServiceCall(
								ps.globals.API_ENDPOINTS.PROPERTIES_SERVICE
							);
							break;
						case 'values':
							console.debug(
								'PRIMARY SOURCES TOOL: BAKED FILTER triggered. ' +
								'All values service call'
							);
							this.executeServiceCall(
								ps.globals.API_ENDPOINTS.VALUES_SERVICE
							);
							break;
						default:
							// QIDs, just display the subjects
							if ( baked.startsWith( 'Q' ) ) {
								filledQuery = searchWithValueSparqlQuery
									.replace(
										'{{BINDINGS}}',
										'DISTINCT (?subject AS ?' + bakedSelection.getLabel() + ')'
									)
									.replace( '{{PROPERTY}}', '?property' )
									.replace( '{{VALUE}}', baked );
								if ( filteredDataset ) {
									filledQuery = filledQuery
										.replace( '{{DATASET}}', '<' + filteredDataset + '>' )
										.replace( '{{FILTER}}', '' );
								} else {
									filledQuery = filledQuery
										.replace( '{{DATASET}}', '?dataset' )
										.replace( '{{FILTER}}', datasetFilter );
								}
								this.sparql = filledQuery;
								this.sparqlOffset = 0;
								this.sparqlLimit = 100;
								console.debug(
									'PRIMARY SOURCES TOOL: BAKED FILTER triggered. ' +
									'Value query:',
									this.sparql
								);
								this.executeSparqlQuery();
							} else {
								// PIDs, perform a search query
								bindings = '?subject ?statement_node ?value ' +
								'?reference_property ?reference_value';
								filledQuery = searchSparqlQuery
									.replace( '{{PROPERTY}}', 'p:' + baked );
								if ( filteredDataset ) {
									filledQuery = filledQuery
										.replace( '{{DATASET}}', '<' + filteredDataset + '>' )
										.replace( '{{FILTER}}', '' );
								} else {
									filledQuery = filledQuery
										.replace( '{{DATASET}}', '?dataset' )
										.replace( '{{FILTER}}', datasetFilter );
									bindings += ' ?dataset';
								}
								this.sparql = filledQuery.replace( '{{BINDINGS}}', bindings );
								console.debug(
									'PRIMARY SOURCES TOOL: BAKED FILTER triggered. ' +
									'Property query:',
									this.sparql
								);
								this.sparqlOffset = 0;
								/*
								 * The limit value is quite high to avoid empty result tables,
								 * due to SPARQL results merged on the statement_node binding.
								 * See ListDialog.prototype.displaySearchResult
								 */
								this.sparqlLimit = 300;
								this.filteredDataset = filteredDataset;
								this.filteredProperty = baked;
								this.filteredItemValue = null;
								this.executeSearch();
								break;
							}
					}
				} else if ( !this.sparqlQuery.isDisabled() ) {
					// Arbitrary SPARQL query
					query = this.sparqlQuery.getValue();
					// Force limit to 100 results to avoid heavy queries
					this.sparql = query.toLowerCase().includes( 'limit' ) ?
						query.replace( /}\s*limit\s*\d+/i, '} LIMIT 100' ) :
						query += ' LIMIT 100';
					this.executeSparqlQuery();
				} else {
					// Property / item value autocompletion
					filteredItemValue = this.itemValueInput.getValue() ?
						this.itemValueInput.getData() :
						null;
					filteredProperty = this.propertyInput.getValue() ?
						this.propertyInput.getData() :
						null;
					bindings = '?subject {{PROPERTY}} ?statement_node ' +
					'{{VALUE}} ?reference_property ?reference_value';
					if ( filteredItemValue ) {
						filledQuery = searchWithValueSparqlQuery
							.replace( '{{VALUE}}', filteredItemValue );
						bindings = bindings.replace( '{{VALUE}}', '' );
					} else {
						filledQuery = searchSparqlQuery;
						bindings = bindings.replace( '{{VALUE}}', '?value' );
					}
					if ( filteredProperty ) {
						filledQuery = filledQuery
							.replace( '{{PROPERTY}}', 'p:' + filteredProperty );
						bindings = bindings.replace( '{{PROPERTY}}', '' );
					} else {
						filledQuery = filledQuery.replace( '{{PROPERTY}}', '?property' );
						bindings = bindings.replace( '{{PROPERTY}}', '?property' );
					}
					if ( filteredDataset ) {
						filledQuery = filledQuery
							.replace( '{{DATASET}}', '<' + filteredDataset + '>' )
							.replace( '{{FILTER}}', '' );
					} else {
						filledQuery = filledQuery
							.replace( '{{DATASET}}', '?dataset' )
							.replace( '{{FILTER}}', datasetFilter );
						bindings += ' ?dataset';
					}
					this.sparql = filledQuery.replace( '{{BINDINGS}}', bindings );
					this.sparqlOffset = 0;
					this.sparqlLimit = 300;
					this.filteredDataset = filteredDataset;
					this.filteredProperty = filteredProperty;
					this.filteredItemValue = filteredItemValue;
					console.debug(
						'PRIMARY SOURCES TOOL: AUTOCOMPLETION triggered. ' +
						'Query:',
						this.sparql
					);
					this.executeSearch();
				}
			};

			// On 'Load more' button press, when executing queries other than a search
			FilterDialog.prototype.onNextButtonSubmit = function () {
				this.nextStatementsButton.$element.remove();
				this.executeSparqlQuery( true );
			};

			// On 'Load more' button press, when executing a search
			FilterDialog.prototype.onNextButtonSubmitSearch = function () {
				this.nextStatementsButton.$element.remove();
				this.executeSearch( true );
			};
			/* END: Handlers for 'Run' and 'Load more' buttons */

			/* BEGIN: query execution */
			// Call the primary sources tool API endpoints /properties or /values
			FilterDialog.prototype.executeServiceCall = function ( url ) {
				var widget = this,
					progressBar = new OO.ui.ProgressBarWidget();

				progressBar.$element.css( 'max-width', '100%' );
				widget.mainPanel.$element.append( progressBar.$element );

				$.get(
					url,
					function ( data ) {
						var dataset,
							ids = new Set();
						progressBar.$element.remove();
						// Populate the result label cache
						for ( dataset in data ) {
							if ( data.hasOwnProperty( dataset ) ) {
								data[ dataset ].forEach( function ( entity ) {
									ids.add( entity );
								} );
							}
						}
						console.debug(
							'PRIMARY SOURCES TOOL: List of IDs from service call:',
							ids
						);
						ps.commons.loadEntityLabels( Array.from( ids ) );
						widget.displayServiceResult( data );
					}
				)
					.fail( function () {
						progressBar.$element.remove();
						ps.commons.reportError( 'Failed loading statements' );
					} );
			};

			// Call the primary sources tool SPARQL endpoint for a search
			FilterDialog.prototype.executeSearch = function ( more = false ) {
				var widget = this,
					progressBar = new OO.ui.ProgressBarWidget();

				progressBar.$element.css( 'max-width', '100%' );
				widget.mainPanel.$element.append( progressBar.$element );

				$.ajax(
					ps.globals.API_ENDPOINTS.SPARQL_SERVICE,
					{
						data: { query: widget.sparql
							.replace( '{{OFFSET}}', widget.sparqlOffset )
							.replace( '{{LIMIT}}', widget.sparqlLimit )
						},
						accepts: { tsv: 'text/tab-separated-values' },
						converters: { 'text tsv': function ( result ) {
							var lines = result.split( '\r\n' ),
								headers = lines.shift(),
								bindings = lines.map( function ( line ) {
									var clean = line.replace( /[<>"]/g, '' );
									return clean
										.split( '\t' )
										.filter( String )
										.map( binding => binding.split( '^^' )[ 0 ] );
								} );
							lines.pop();
							return {
								headers: headers
									.replace( /\?/g, '' )
									.split( '\t' ),
								bindings: bindings
							};
						} },
						dataType: 'tsv'
					}
				)
					.done( function ( data ) {
						var label, noticeIcon, noStatements, ids;
						progressBar.$element.remove();
						// Handle empty results
						if ( data.bindings.length === 0 ) {
							label = more ? 'No more statements' : 'No statements found';
							noticeIcon = new OO.ui.IconWidget( {
								icon: 'notice'
							} );
							noStatements = new OO.ui.LabelWidget( {
								label: label
							} );
							widget.mainPanel.$element.append(
								noticeIcon.$element,
								noStatements.$element
							);
						} else {
							// Populate the result label cache
							ids = new Set();
							data.bindings.forEach( function ( binding ) {
								binding.forEach( function ( value ) {
									var matchedId = /[QP]\d+$/.exec( value );
									if ( matchedId ) {
										ids.add( matchedId[ 0 ] );
									}
								} );
							} );
							ps.commons.loadEntityLabels( Array.from( ids ) );

							// Paging
							widget.sparqlOffset += widget.sparqlLimit;

							widget.displaySearchResult( data.headers, data.bindings );
							if ( data.bindings.length > 0 ) {
								widget.nextStatementsButton = new OO.ui.ButtonWidget( {
									label: 'Load more'
								} );
								widget.nextStatementsButton.connect(
									widget,
									{ click: 'onNextButtonSubmitSearch' }
								);
								widget.mainPanel.$element.append(
									widget.nextStatementsButton.$element
								);
							}
						}
					} )
					.fail( function ( xhr ) {
						handleSparqlError( xhr, progressBar, widget );
					} );
			};

			// Call the primary sources tool SPARQL endpoint
			FilterDialog.prototype.executeSparqlQuery = function ( more = false ) {
				var label, noticeIcon, noStatements, ids,
					widget = this,
					progressBar = new OO.ui.ProgressBarWidget();

				progressBar.$element.css( 'max-width', '100%' );
				widget.mainPanel.$element.append( progressBar.$element );
				// Run SPARQL query
				$.get(
					ps.globals.API_ENDPOINTS.SPARQL_SERVICE,
					{
						query: widget.sparql
							.replace( '{{OFFSET}}', widget.sparqlOffset )
							.replace( '{{LIMIT}}', widget.sparqlLimit )
					},
					function ( data ) {
						progressBar.$element.remove();
						// Handle empty results
						if ( data.results.bindings.length === 0 ) {
							label = more ? 'No more statements' : 'No statements found';
							noticeIcon = new OO.ui.IconWidget( {
								icon: 'notice'
							} );
							noStatements = new OO.ui.LabelWidget( {
								label: label
							} );
							widget.mainPanel.$element.append(
								noticeIcon.$element,
								noStatements.$element
							);
						} else {
							// Populate the result label cache
							ids = new Set();
							data.head.vars.forEach( function ( header ) {
								data.results.bindings.forEach( function ( binding ) {
									var value, matchedId;
									if ( binding.hasOwnProperty( header ) ) {
										value = binding[ header ].value;
										if ( binding[ header ].type === 'uri' ) {
											matchedId = /[QP]\d+$/.exec( value );
											if ( matchedId ) {
												ids.add( matchedId[ 0 ] );
											}
										}
									}
								} );
							} );
							console.debug(
								'PRIMARY SOURCES TOOL: List of IDs from SPARQL query:',
								ids
							);
							ps.commons.loadEntityLabels( Array.from( ids ) );

							// Paging
							widget.sparqlOffset += widget.sparqlLimit;
							widget.displaySparqlResult( data.head.vars, data.results.bindings );
							if ( data.hasOwnProperty( 'results' ) ) {
								widget.nextStatementsButton = new OO.ui.ButtonWidget( {
									label: 'Load more'
								} );
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
					.fail( function ( xhr ) {
						handleSparqlError( xhr, progressBar, widget );
					} );
			};
			/* END: query execution */

			/* BEGIN: query result table display */
			FilterDialog.prototype.displayServiceResult = function ( result ) {
				var dataset, entities,
					widget = this,
					datasetLabels = [];

				if ( this.table === null ) {
					Object.getOwnPropertyNames( result )
						.forEach( function ( uri ) {
							datasetLabels.push( ps.commons.datasetUriToLabel( uri ) );
						} );
					this.initResultTable( datasetLabels );
				}
				for ( dataset in result ) {
					if ( result.hasOwnProperty( dataset ) ) {
						entities = result[ dataset ];
						entities.forEach( function ( entityId ) {
							var row = new ServiceResultRow( entityId );
							widget.table.append( row.$element );
						} );
					}
				}
			};

			FilterDialog.prototype.displaySearchResult = function ( headers, bindings ) {
				var threshold, triples, full, merged, finalBindings, isBlacklisted,
					widget = this,
					filteredProperty = widget.filteredProperty,
					filteredItemValue = widget.filteredItemValue,
					filteredDataset = widget.filteredDataset;

				console.debug(
					'PRIMARY SOURCES TOOL: Filter attributes. ' +
					'Dataset:', filteredDataset,
					'Entity of interest:', filteredItemValue,
					'Property of interest:', filteredProperty
				);

				/*
				 * Bindings order:
				 *
				 * Subject, property, statement_node
				 *   [0]      [1]          [2]
				 * value, reference_property, reference_value, dataset
				 *  [3]           [4]               [5]          [6]
				 */
				// In case of defined filters, add headers and bindings accordingly
				if ( filteredProperty ) {
					headers.splice( 1, 0, 'property' );
					bindings.forEach( function ( binding ) {
						binding.splice( 1, 0, filteredProperty );
					} );
				}
				if ( filteredItemValue ) {
					headers.splice( 3, 0, 'value' );
					bindings.forEach( function ( binding ) {
						binding.splice( 3, 0, filteredItemValue );
					} );
				}
				if ( widget.table === null ) {
					// Get rid of statement_node
					headers.splice( 2, 1 );
					widget.initSearchTable( headers );
				}

				// Handle dataset binding
				threshold = filteredDataset ? 4 : 5;
				triples = bindings.filter( binding => binding.length === threshold );
				full = bindings.filter( binding => binding.length > threshold );
				// Merge statements on common statement_node
				merged = full.map( function ( statement ) {
					var toReturn;
					$.each( triples, function ( k, triple ) {
						if ( triple[ 2 ] === statement[ 2 ] ) {
							toReturn = $.extend( [], triple, statement );
							// Keep the triple statement value
							toReturn[ 3 ] = triple[ 3 ];
							return false;
						}
					} );
					return toReturn;
				} );
				// Filter undefined values
				finalBindings = merged.filter( Boolean );
				console.debug(
					'PRIMARY SOURCES TOOL: RAW SPARQL results:',
					bindings
				);
				console.debug(
					'PRIMARY SOURCES TOOL: MERGED SPARQL results (on statement node):',
					finalBindings
				);

				// Build the URL blacklist check
				ps.commons.getBlacklistedSourceUrls()
					.done( function ( blacklist ) {
						isBlacklisted = ps.commons.isBlackListedBuilder( blacklist );
					} )
					.fail( function () {
						console.warn(
							'PRIMARY SOURCES TOOL: Could not obtain blacklisted source URLs'
						);
					} );
				finalBindings.forEach( function ( binding ) {
					var row;
					// Get rid of statement_node
					binding.splice( 2, 1 );
					row = new SearchResultRow(
						binding,
						filteredProperty,
						filteredItemValue,
						filteredDataset,
						isBlacklisted
					);
					if ( row ) {
						widget.table.append( row.$element );
					}
				} );
			};

			FilterDialog.prototype.displaySparqlResult = function ( headers, bindings ) {
				var widget = this;
				if ( this.table === null ) {
					this.initResultTable( headers );
				}
				bindings.forEach( function ( binding ) {
					var row = new SparqlResultRow( headers, binding );
					widget.table.append( row.$element );
				} );

			};

			FilterDialog.prototype.initSearchTable = function ( headers ) {
				var htmlHeaders = [];
				headers.forEach( function ( header ) {
					var formatted = header
						.replace( '_', ' ' )
						.replace(
							/\w+/,
							word =>
								word.charAt( 0 ).toUpperCase() +
								word.substr( 1 )
						);
					htmlHeaders.push( $( '<th>' ).text( formatted ) );
				} );
				this.table = $( '<table>' )
					.addClass( 'wikitable' )
					.css( 'width', '100%' )
					.append(
						$( '<thead>' ).append(
							$( '<tr>' ).append(
								htmlHeaders,
								$( '<th>' )
									.text( 'Actions' )
							)
						)
					);
				// Firefox won't properly display the grid,
				// due to wikitable CSS "border-collapse: collapse"
				if ( navigator.userAgent.indexOf( 'Firefox' ) !== -1 ) {
					this.table.css( {
						'border-collapse': 'separate',
						'border-spacing': 0
					} );
				}
				this.mainPanel.$element.append( this.table );
			};

			FilterDialog.prototype.initResultTable = function ( headers ) {
				var htmlHeaders = [];
				headers.forEach( function ( header ) {
					htmlHeaders.push( $( '<th>' ).text( header ) );
				} );
				this.table = $( '<table>' )
					.addClass( 'wikitable' )
					.css( 'width', '100%' )
					.append(
						$( '<thead>' ).append(
							$( '<tr>' ).append(
								htmlHeaders
							)
						)
					);
				// Firefox won't properly display the grid,
				// due to wikitable CSS "border-collapse: collapse"
				if ( navigator.userAgent.indexOf( 'Firefox' ) !== -1 ) {
					this.table.css( {
						'border-collapse': 'separate',
						'border-spacing': 0
					} );
				}
				this.mainPanel.$element.append( this.table );
			};
			/* END: query result display */

			windowManager.addWindows( [ new FilterDialog() ] );
			linkToBind.click( function () {
				windowManager.openWindow( 'ps-filter' );
			} );
		}
	};

	mw.ps = ps;

	console.info( 'PRIMARY SOURCES TOOL: Filter loaded' );

}( mediaWiki, jQuery ) );
