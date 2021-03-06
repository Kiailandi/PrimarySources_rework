/**
 * Item curation.
 * This module implements the item-based workflow:
 * 1. process suggestions (back-end service /suggest);
 * 2. fill HTML templates (AKA blue boxes) with suggestions data;
 * 3. match existing Wikidata statements and display blue boxes accordingly;
 * 4. handle curation actions (AKA approve/reject buttons);
 *   4.1. add approved suggestions to Wikidata;
 *   4.2. update the suggestions state (/curate back-end service).
 */
( function ( mw, $ ) {
	var ps = mw.ps || {},
		// The current subject entity
		QID = null;

	// BEGIN: 1. pre-process suggestions from primary sources back end
	function getEntitySuggestions( qid, callback ) {
		$.ajax( {
			url: ps.globals.FAKE_OR_RANDOM_DATA ?
				ps.globals.API_ENDPOINTS.RANDOM_SERVICE :
				ps.globals.API_ENDPOINTS.SUGGEST_SERVICE
					.replace( /\{\{qid\}\}/, qid ) +
					'&dataset=' + ps.globals.DATASET
		} ).done( function ( data ) {
			return callback( null, data );
		} );
	}

	function parseEntitySuggestions( suggestions, blacklistedSourceUrls ) {
		var isBlacklisted = ps.commons.isBlackListedBuilder( blacklistedSourceUrls ),
			parsed = {},
			// Unify statements, as some statements may appear more than once
			statementUnique = function ( haystack, needle ) {
				var i, lenI;
				for ( i = 0, lenI = haystack.length; i < lenI; i++ ) {
					if ( haystack[ i ].statement === needle ) {
						return i;
					}
				}
				return -1;
			},
			statements = suggestions.filter( function ( entity, index, self ) {
				return statementUnique( self, entity.statement ) === index;
			} )
				.filter( function ( entity ) {
					return entity.format === ps.globals.STATEMENT_FORMAT &&
					entity.state === ps.globals.STATEMENT_STATES.new;
				} )
				.map( function ( entity ) {
					return ps.commons.parsePrimarySourcesStatement( entity, isBlacklisted );
				} );

		if ( ps.globals.DEBUG ) {
			if ( QID === 'Q4115189' ) {
				// The sandbox item can be written to
				document.getElementById( 'content' ).style.backgroundColor = 'lime';
			}
		}
		if ( ps.globals.FAKE_OR_RANDOM_DATA ) {
			suggestions.push( {
				statement:
				QID +
				'\tP31\tQ1\tP580\t+1840-01-01T00:00:00Z/9\tS143\tQ48183',
				state: ps.globals.STATEMENT_STATES.new,
				id: 0,
				format: ps.globals.STATEMENT_FORMAT
			} );
			suggestions.push( {
				statement:
				QID +
				'\tP108\tQ95\tS854\t"http://research.google.com/pubs/vrandecic.html"',
				state: ps.globals.STATEMENT_STATES.new,
				id: 0,
				format: ps.globals.STATEMENT_FORMAT
			} );
			suggestions.push( {
				statement:
				QID +
				'\tP108\tQ8288\tP582\t+2013-09-30T00:00:00Z/10\t' +
				'S854\t"http://simia.net/wiki/Denny"\tS813\t+2015-02-14T00:00:00Z/11',
				state: ps.globals.STATEMENT_STATES.new,
				id: 0,
				format: ps.globals.STATEMENT_FORMAT
			} );
			suggestions.push( {
				statement:
				QID +
				'\tP1451\ten:"foo bar"\tP582\t+2013-09-30T00:00:00Z/10\t' +
				'S854\t"http://www.ebay.com/"',
				state: ps.globals.STATEMENT_STATES.new,
				id: 0,
				format: ps.globals.STATEMENT_FORMAT
			} );
			suggestions.push( {
				statement:
				QID +
				'\tP108\tQ8288\tP582\t+2013-09-30T00:00:00Z/10\t' +
				'S854\t"https://lists.wikimedia.org/pipermail/wikidata-l/2013-July/002518.html"',
				state: ps.globals.STATEMENT_STATES.new,
				id: 0,
				format: ps.globals.STATEMENT_FORMAT
			} );
			suggestions.push( {
				statement: QID + '\tP1082\t-1234',
				state: ps.globals.STATEMENT_STATES.new,
				id: 0,
				format: ps.globals.STATEMENT_FORMAT
			} );
			suggestions.push( {
				statement: QID + '\tP625\t@-12.12334556/23.1234',
				state: ps.globals.STATEMENT_STATES.new,
				id: 0,
				format: ps.globals.STATEMENT_FORMAT
			} );
			suggestions.push( {
				statement: QID + '\tP646\t"/m/05zhl_"',
				state: ps.globals.STATEMENT_STATES.new,
				id: 0,
				format: ps.globals.STATEMENT_FORMAT
			} );
			suggestions.push( {
				statement:
				QID +
				'\tP569\t+1840-01-01T00:00:00Z/11\t' +
				'S854\t"https://lists.wikimedia.org/pipermail/wikidata-l/2013-July/002518.html"',
				state: ps.globals.STATEMENT_STATES.new,
				id: 0,
				format: ps.globals.STATEMENT_FORMAT
			} );
		}

		ps.commons.preloadEntityLabels( statements );

		statements.forEach( function ( statement ) {
			var predicate = statement.predicate,
				key = statement.key;

			parsed[ predicate ] = parsed[ predicate ] || {};
			if ( !parsed[ predicate ][ key ] ) {
				parsed[ predicate ][ key ] = {
					id: statement.id,
					dataset: statement.dataset,
					object: statement.object,
					qualifiers: statement.qualifiers,
					sources: []
				};
			}

			if ( statement.source.length > 0 ) {
				parsed[ predicate ][ key ].sources.push( statement.source );
			}
		} );
		return parsed;
	}
	// END: 1. pre-process suggestions from primary sources back end

	// BEGIN: 2. fill HTML templates
	function escapeHtml( html ) {
		return html
			.replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' )
			.replace( /"/g, '&quot;' );
	}

	function getQualifiersHtml( qualifiers ) {
		var qualifierPromises = qualifiers.map( function ( qualifier ) {
			return $.when(
				ps.commons.getValueHtml( qualifier.qualifierProperty ),
				ps.commons.getValueHtml( qualifier.qualifierObject, qualifier.qualifierProperty )
			).then( function ( formattedProperty, formattedValue ) {
				return ps.templates.qualifierHtml
					.replace( /\{\{qualifier-property-html\}\}/g, formattedProperty )
					.replace( /\{\{qualifier-object\}\}/g, formattedValue );
			} );
		} );

		return $.when.apply( $, qualifierPromises ).then( function () {
			return Array.prototype.slice.call( arguments ).join( '' );
		} );
	}

	function getSourcesHtml( sources, property, object ) {
		var sourcePromises = sources.map( function ( source ) {
			var sourceItemsPromises = source.map( function ( snak ) {
				return $.when(
					ps.commons.getValueHtml( snak.sourceProperty ),
					ps.commons.getValueHtml( snak.sourceObject, snak.sourceProperty )
				).then( function ( formattedProperty, formattedValue ) {
					return ps.templates.sourceItemHtml
						.replace( /\{\{source-property-html\}\}/g, formattedProperty )
						.replace( /\{\{source-object\}\}/g, formattedValue );
				} );
			} );

			return $.when.apply( $, sourceItemsPromises ).then( function () {
				return ps.templates.sourceHtml
					.replace( /\{\{data-source\}\}/g, escapeHtml( JSON.stringify( source ) ) )
					.replace( /\{\{data-property\}\}/g, property )
					.replace( /\{\{data-object\}\}/g, escapeHtml( object.object ) )
					.replace( /\{\{data-dataset\}\}/g, object.dataset )
					.replace( /\{\{statement-id\}\}/g, source[ 0 ].sourceId )
					.replace( /\{\{source-html\}\}/g,
						Array.prototype.slice.call( arguments ).join( '' ) )
					.replace( /\{\{data-qualifiers\}\}/g, escapeHtml( JSON.stringify(
						object.qualifiers ) ) );
			} );
		} );

		return $.when.apply( $, sourcePromises ).then( function () {
			return Array.prototype.slice.call( arguments ).join( '' );
		} );
	}

	function getStatementHtml( property, object ) {
		return $.when(
			getQualifiersHtml( object.qualifiers ),
			getSourcesHtml( object.sources, property, object ),
			ps.commons.getValueHtml( object.object, property )
		).then( function ( qualifiersHtml, sourcesHtml, formattedValue ) {
			return ps.templates.statementViewHtml
				.replace( /\{\{object\}\}/g, formattedValue )
				.replace( /\{\{data-object\}\}/g, escapeHtml( object.object ) )
				.replace( /\{\{data-property\}\}/g, property )
				.replace( /\{\{references\}\}/g,
					object.sources.length === 1 ?
						object.sources.length + ' reference' :
						object.sources.length + ' references' )
				.replace( /\{\{sources\}\}/g, sourcesHtml )
				.replace( /\{\{qualifiers\}\}/g, qualifiersHtml )
				.replace( /\{\{statement-id\}\}/g, object.id )
				.replace( /\{\{data-dataset\}\}/g, object.dataset )
				.replace( /\{\{data-qualifiers\}\}/g, escapeHtml( JSON.stringify(
					object.qualifiers ) ) )
				.replace( /\{\{data-sources\}\}/g, escapeHtml( JSON.stringify(
					object.sources ) ) );
		} );
	}
	// END: 2. fill HTML templates

	// BEGIN: 3. match existing Wikidata statements
	function getQid() {
		var qidRegEx = /^Q\d+$/,
			title = mw.config.get( 'wgTitle' );

		return qidRegEx.test( title ) ? title : false;
	}

	function getWikidataEntityData( qid, callback ) {
		var revisionId = mw.config.get( 'wgRevisionId' );

		$.ajax( {
			url: ps.globals.WIKIDATA_ENTITY_DATA_URL
				.replace( /\{\{qid\}\}/, qid ) +
				'?revision=' + revisionId
		} ).done( function ( data ) {
			return callback( null, data.entities[ qid ] );
		} ).fail( function () {
			return callback( 'Invalid revision ID ' + revisionId );
		} );
	}

	function createNewSources( sources, property, object, statementId ) {
		getSourcesHtml( sources, property, object ).then( function ( html ) {
			var sourcesListView,
				fragment = document.createDocumentFragment(),
				child = document.createElement( 'div' ),
				// Need to find the correct reference
				container = document.getElementsByClassName(
					'wikibase-statement-' + statementId
				)[ 0 ],
				// Open the references toggle
				toggler = container.querySelector( 'a.ui-toggler' ),
				label = toggler.querySelector( '.ui-toggler-label' ),
				oldSourcesCount = parseInt( label.textContent.replace( /.*?(\d+).*?/, '$1' ), 10 ),
				// Update the label
				actualSourcesCount = oldSourcesCount += sources.length;

			child.innerHTML = html;
			fragment.appendChild( child );
			if ( toggler.classList.contains( 'ui-toggler-toggle-collapsed' ) ) {
				toggler.click();
			}

			actualSourcesCount = actualSourcesCount === 1 ?
				'1 reference' :
				actualSourcesCount + ' references';
			label.textContent = actualSourcesCount;
			// Append the references
			container = container.querySelector( '.wikibase-statementview-references' );
			// Create wikibase-listview if not found
			if ( !container.querySelector( '.wikibase-listview' ) ) {
				sourcesListView = document.createElement( 'div' );
				sourcesListView.className = 'wikibase-listview';
				container.insertBefore( sourcesListView, container.firstChild );
			}
			container = container.querySelector( '.wikibase-listview' );
			container.appendChild( fragment );
			ps.sidebar.appendToNav( document.getElementById( property ) );
			ps.referencePreview.appendPreviewButton( $( container ).children().last() );
		} );
	}

	function prepareNewSources( property, object, wikidataStatement ) {
		var i, j, prop, snakBag, snak,
			existingSources = {},
			wikidataSources = ( 'references' in wikidataStatement ) ?
				wikidataStatement.references :
				[];

		for ( i in wikidataSources ) {
			snakBag = wikidataSources[ i ].snaks;
			for ( prop in snakBag ) {
				if ( !( prop in existingSources ) ) {
					existingSources[ prop ] = {};
				}
				for ( j in snakBag[ prop ] ) {
					snak = snakBag[ prop ][ j ];
					if ( snak.snaktype === 'value' ) {
						existingSources[ prop ][
							ps.commons.jsonToTsvValue(
								snak.datavalue,
								snak.datatype
							)
						] = true;
					}
				}
			}
		}
		// Filter existing sources
		object.sources = object.sources.filter( function ( source ) {
			return source.filter( function ( snak ) {
				return !existingSources[ snak.sourceProperty ] ||
				!existingSources[ snak.sourceProperty ][ snak.sourceObject ];
			} ).length > 0;
		} );

		return createNewSources(
			object.sources,
			property,
			object,
			wikidataStatement.id
		);
	}

	function createNewStatement( property, object ) {
		getStatementHtml( property, object ).then( function ( html ) {
			var fragment = document.createDocumentFragment(),
				child = document.createElement( 'div' ),
				container = document
					.getElementById( property )
					.querySelector( '.wikibase-statementlistview-listview' );

			child.innerHTML = html;
			fragment.appendChild( child.firstChild );
			container.appendChild( fragment );
			ps.sidebar.appendToNav( document.getElementById( property ) );
			ps.referencePreview.appendPreviewButton( $( container ).children().last() );
		} );
	}

	function createNewClaimList( newClaim ) {
		var container = document
				.querySelector( '.wikibase-statementgrouplistview' )
				.querySelector( '.wikibase-listview' ),
			statementPromises = newClaim.objects.map( function ( object ) {
				return getStatementHtml( newClaim.property, object );
			} );

		ps.commons.getValueHtml( newClaim.property ).done( function ( propertyHtml ) {
			$.when.apply( $, statementPromises ).then( function () {
				var statementViewsHtml = Array.prototype.slice.call( arguments ).join( '' ),
					mainHtml = ps.templates.mainHtml
						.replace( /\{\{statement-views\}\}/g, statementViewsHtml )
						.replace( /\{\{property\}\}/g, newClaim.property )
						.replace( /\{\{data-property\}\}/g, newClaim.property )
						.replace( /\{\{data-dataset\}\}/g, newClaim.dataset )
						.replace( /\{\{property-html\}\}/g, propertyHtml ),
					fragment = document.createDocumentFragment(),
					child = document.createElement( 'div' );

				child.innerHTML = mainHtml;
				fragment.appendChild( child.firstChild );
				container.appendChild( fragment );
				ps.sidebar.appendToNav( container.lastChild );
				ps.referencePreview.appendPreviewButton( $( container ).children().last() );
			} );
		} );
	}

	function createNewClaim( property, claims ) {
		var key, object, id, claimDataset, sources, qualifiers,
			i = 0,
			newClaim = {
				property: property,
				objects: []
			},
			objectsLength = Object.keys( claims ).length;

		for ( key in claims ) {
			object = claims[ key ].object;
			id = claims[ key ].id;
			claimDataset = claims[ key ].dataset;
			sources = claims[ key ].sources;
			qualifiers = claims[ key ].qualifiers;
			newClaim.objects.push( {
				object: object,
				id: id,
				dataset: claimDataset,
				qualifiers: qualifiers,
				sources: sources,
				key: key
			} );
			( function ( currentNewClaim, currentKey ) {
				currentNewClaim.objects.forEach( function ( object ) {
					if ( object.key !== currentKey ) {
						return;
					}
					i++;
					if ( i === objectsLength ) {
						return createNewClaimList( currentNewClaim );
					}
				} );
			}( newClaim, key ) );
		}
	}

	function matchClaims( wikidataClaims, primarySourcesClaims ) {
		var property, propertyLinks,
			primarySourcesKey, primarySourcesObject, existingWikidataObjects,
			lenI, i, wikidataObject, isDuplicate, j, claims,
			existingClaims = {},
			newClaims = {};

		for ( property in primarySourcesClaims ) {
			if ( wikidataClaims[ property ] ) {
				existingClaims[ property ] = primarySourcesClaims[ property ];
				propertyLinks = document.querySelectorAll( 'a[title="Property:' + property + '"]' );
				[].forEach.call( propertyLinks, function ( propertyLink ) {
					propertyLink.parentNode.parentNode.classList
						.add( 'existing-property' );
				} );
				for ( primarySourcesKey in primarySourcesClaims[ property ] ) {
					primarySourcesObject = primarySourcesClaims[ property ][ primarySourcesKey ];
					existingWikidataObjects = {};
					lenI = wikidataClaims[ property ].length;
					for ( i = 0; i < lenI; i++ ) {
						wikidataObject = wikidataClaims[ property ][ i ];
						ps.commons.buildValueKeysFromWikidataStatement( wikidataObject )
							.forEach( function ( key ) {
								existingWikidataObjects[ key ] = wikidataObject;
							} );
					}
					if ( existingWikidataObjects[ primarySourcesKey ] ) {
						// Existing object
						if ( primarySourcesObject.sources.length === 0 ) {
							// No source, duplicate statement
							ps.commons.setStatementState(
								primarySourcesObject.id,
								ps.globals.STATEMENT_STATES.duplicate,
								primarySourcesObject.dataset,
								'claim'
							)
								.done( function () {
									console.info(
										'PRIMARY SOURCES TOOL: ' +
										'Marked as duplicate existing claim with no reference ' +
										'[' + primarySourcesObject.id + ']'
									);
								} );
						} else {
							// Maybe new sources
							prepareNewSources(
								property,
								primarySourcesObject,
								existingWikidataObjects[ primarySourcesKey ]
							);
						}
					} else {
						// New object
						isDuplicate = false;
						for ( j = 0; j < wikidataClaims[ property ].length; j++ ) {
							wikidataObject = wikidataClaims[ property ][ j ];
							if ( wikidataObject.mainsnak.snaktype === 'value' &&
								ps.commons.jsonToTsvValue(
									wikidataObject.mainsnak.datavalue
								) === primarySourcesObject.object
							) {
								isDuplicate = true;
								console.info(
									'PRIMARY SOURCES TOOL: Found existing claim ' +
									'[' + primarySourcesObject.id + ']'
								);
								// Add new sources to existing statement
								prepareNewSources(
									property,
									primarySourcesObject,
									wikidataObject
								);
							}
						}
						if ( !isDuplicate ) {
							createNewStatement( property, primarySourcesObject );
						}
					}
				}
			} else {
				newClaims[ property ] = primarySourcesClaims[ property ];
			}
		}

		for ( property in newClaims ) {
			claims = newClaims[ property ];
			console.info( 'PRIMARY SOURCES TOOL: New claim with property [' + property + ']' );
			createNewClaim( property, claims );
		}
	}
	// END 3. match existing Wikidata statements

	/*
	 * 4. Handle curation actions: approval and rejection.
	 * In other words, handle clicks on the following buttons:
	 * -approve;
	 * -reject.
	 */
	function addClickHandlers() {
		var contentDiv = document.getElementById( 'content' );

		contentDiv.addEventListener( 'click', function ( event ) {
			var dataset,
				predicate,
				object,
				source,
				qualifiers,
				quickStatement,
				sourceQuickStatement,
				anchor,
				onClick,
				classList = event.target.classList,
				statement = event.target.dataset;

			if ( !classList.contains( 'pst-button' ) ) {
				return;
			}

			event.preventDefault();
			event.target.innerHTML = '<img src="https://upload.wikimedia.org/' +
			'wikipedia/commons/f/f8/Ajax-loader%282%29.gif" class="ajax"/>';

			/* BEGIN: reference curation */
			if ( classList.contains( 'pst-source' ) ) {
				/*
				 * The reference key is the property/value pair
				 * See ps.commons.parsePrimarySourcesStatment.
				 * Use it to build the QuickStatement needed to change the state in the back end.
				 * See CurateServlet#parseQuickStatement:
				 * https://github.com/marfox/pst-backend
				 */
				dataset = statement.dataset;
				predicate = statement.property;
				object = statement.object;
				source = JSON.parse( statement.source );
				qualifiers = JSON.parse( statement.qualifiers );
				quickStatement = QID + '\t' + predicate + '\t' + object;
				sourceQuickStatement = quickStatement + '\t' + source[ 0 ].key;
				// Reference approval
				if ( classList.contains( 'pst-approve' ) ) {
					ps.commons.getClaims( QID, predicate, function ( err, claims ) {
						var i, lenI, claim,
							objectExists = false;
						for ( i = 0, lenI = claims.length; i < lenI; i++ ) {
							claim = claims[ i ];
							if ( claim.mainsnak.snaktype === 'value' &&
							ps.commons.jsonToTsvValue( claim.mainsnak.datavalue ) === object ) {
								objectExists = true;
								break;
							}
						}
						if ( objectExists ) {
							// The claim is already in Wikidata: only create the reference
							ps.commons.createReference( QID, predicate, object, source,
								function ( error, data ) {
									if ( error ) {
										return ps.commons.reportError( error );
									}
									// The back end approves everything
									ps.commons.setStatementState(
										sourceQuickStatement,
										ps.globals.STATEMENT_STATES.approved,
										dataset,
										'reference'
									)
										.done( function () {
											console.info(
												'PRIMARY SOURCES TOOL: ' +
												'Approved referenced claim ' +
												'[' + sourceQuickStatement + ']'
											);
											if ( data.pageinfo && data.pageinfo.lastrevid ) {
												document.location.hash =
												'revision=' + data.pageinfo.lastrevid;
											}
											return document.location.reload();
										} );
								} );
						} else {
							// New referenced claim: entirely create it
							ps.commons.createClaimWithReference(
								QID,
								predicate,
								object,
								qualifiers,
								source
							)
								.fail( function ( error ) {
									return ps.commons.reportError( error );
								} )
								.done( function ( data ) {
									// The back end approves everything
									ps.commons.setStatementState(
										sourceQuickStatement,
										ps.globals.STATEMENT_STATES.approved,
										dataset,
										'reference'
									)
										.done( function () {
											console.info(
												'PRIMARY SOURCES TOOL: ' +
												'Approved referenced claim ' +
												'[' + sourceQuickStatement + ']'
											);
											if ( data.pageinfo && data.pageinfo.lastrevid ) {
												document.location.hash =
												'revision=' + data.pageinfo.lastrevid;
											}
											return document.location.reload();
										} );
								} );
						}
					} );
				} else if ( classList.contains( 'pst-reject' ) ) {
					// Reference rejection
					ps.commons.setStatementState(
						sourceQuickStatement,
						ps.globals.STATEMENT_STATES.rejected,
						dataset,
						'reference'
					).done( function () {
						console.info(
							'PRIMARY SOURCES TOOL: Rejected referenced claim ' +
							'[' + sourceQuickStatement + ']'
						);
						return document.location.reload();
					} );
				} else if ( classList.contains( 'pst-edit' ) ) {
					// Reference edit
					anchor = document.getElementById( 'pst-' + sourceQuickStatement );
					onClick = function ( e ) {
						if ( ps.commons.isUrl( e.target.textContent ) ) {
							anchor.style.textDecoration = 'none';
							anchor.href = e.target.textContent;
						} else {
							anchor.style.textDecoration = 'line-through';
						}
					};
					anchor.addEventListener( 'input', onClick );
					anchor.addEventListener( 'blur', function () {
						var buttons = event.target.parentNode.parentNode.querySelectorAll( 'a' );

						anchor.removeEventListener( onClick );
						anchor.onClick = function () {
							return true;
						};
						anchor.contentEditable = false;
						event.target.textContent = 'edit';
						[].forEach.call( buttons, function ( button ) {
							button.dataset.sourceObject = anchor.href;
						} );
					} );

					anchor.contentEditable = true;
				}
			}
			/* END: reference curation */
		} );
	}

	// Run this module with the following async library: https://caolan.github.io/async/
	$.getScript( ps.globals.ASYNC_SCRIPT ).done(
		function init() {
			addClickHandlers();

			if ( ( mw.config.get( 'wgPageContentModel' ) !== 'wikibase-item' ) ||
			( mw.config.get( 'wgIsRedirect' ) ) ||
			// Do not run on diff pages
			( document.location.search.indexOf( '&diff=' ) !== -1 ) ||
			// Do not run on history pages
			( document.location.search.indexOf( '&action=history' ) !== -1 ) ) {
				return 0;
			}

			QID = getQid();
			if ( !QID ) {
				return console.warn(
					'PRIMARY SOURCES TOOL: ' +
					'Could not retrieve the QID of the current page'
				);
			}

			async.parallel( {
				blacklistedSourceUrls: ps.commons.getBlacklistedSourceUrlsWithCallback,
				whitelistedSourceUrls: ps.commons.getWhitelistedSourceUrlsWithCallback,
				wikidata: getWikidataEntityData.bind( null, QID ),
				primarySources: getEntitySuggestions.bind( null, QID )
			}, function ( err, results ) {
				// See https://www.mediawiki.org/wiki/Wikibase/Notes/JSON
				var wikidataClaims = results.wikidata.claims || {},
					primarySourcesClaims = parseEntitySuggestions(
						results.primarySources,
						results.blacklistedSourceUrls
					);

				if ( err ) {
					ps.commons.reportError( err );
				}
				matchClaims( wikidataClaims, primarySourcesClaims );
			} );
		} );

	mw.ps = ps;

	console.info( 'PRIMARY SOURCES TOOL: Item curation loaded' );

}( mediaWiki, jQuery ) );
