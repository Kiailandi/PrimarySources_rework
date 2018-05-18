/**
 * Commons module.
 * Contains functions used by both the main components:
 * item-based curation and filter.
 */
( function ( mw, $ ) {
	var ps = mw.ps || {},
		ENTITY_LABEL_CACHE = {},
		VALUE_HTML_CACHE = {},
		URL_FORMATTER_CACHE = {},
		// Earth
		DEFAULT_GLOBE = 'http://www.wikidata.org/entity/Q2',
		// Gregorian
		DEFAULT_CALENDAR_MODEL = 'http://www.wikidata.org/entity/Q1985727',
		/*
		 * Terminology:
		 * https://www.wikidata.org/wiki/Special:ListDatatypes
		 * QuickStatement:
		 * https://www.wikidata.org/wiki/Help:QuickStatements#Command_sequence_syntax
		 * RDF:
		 * https://www.mediawiki.org/wiki/Wikibase/Indexing/RDF_Dump_Format#Value_representation
		 */
		MATCHERS = {
			// Q666
			ITEM: /^Q\d+$/,
			// P999
			PROPERTY: /^P\d+$/,
			// +/-1234.4567
			QUANTITY: /^[+-]\d+(\.\d+)?$/,
			// @43.3111/-16.6655
			QUICKSTATEMENT_GLOBE_COORDINATE: /^@([+-]?\d+(?:.\d+)?)\/([+-]?\d+(?:.\d+))?$/,
			// fr:"Les Misérables"
			QUICKSTATEMENT_MONOLINGUAL_TEXT: /^(\w+):("[^"\\]*(?:\\.[^"\\]*)*")$/,
			// +2013-01-01T00:00:00Z/10
			QUICKSTATEMENT_TIME: /^[+-]\d+-\d\d-\d\dT\d\d:\d\d:\d\dZ\/\d+$/,
			// Point(28.050277777778 -26.145)
			// Longitude, latitude
			RDF_GLOBE_COORDINATE: /^Point\(([^\s]+)\s([^\s]+)\)$/,
			// "Douglas Adams"@en
			RDF_MONOLINGUAL_TEXT: /^("[^"\\]*(?:\\.[^"\\]*)*")@(\w+)$/,
			// 2018-02-07T00:00:00Z
			RDF_TIME: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
		};

	/*
	 * BEGIN: private functions
	 */
	function numberOfDecimalDigits( number ) {
		var parts = number.split( '.' );
		if ( parts.length < 2 ) {
			return 0;
		}
		return parts[ 1 ].length;
	}

	function computeCoordinatesPrecision( latitude, longitude ) {
		return Math.min(
			Math.pow( 10, -numberOfDecimalDigits( latitude ) ),
			Math.pow( 10, -numberOfDecimalDigits( longitude ) )
		);
	}

	function extractEntityIdsFromStatement( statement ) {
		var entityIds = [ statement.subject, statement.predicate ];

		function isEntityId( str ) {
			return /^[PQ]\d+$/.test( str );
		}

		if ( isEntityId( statement.object ) ) {
			entityIds.push( statement.object );
		}

		statement.qualifiers.forEach( function ( qualifier ) {
			entityIds.push( qualifier.qualifierProperty );
			if ( isEntityId( qualifier.qualifierObject ) ) {
				entityIds.push( qualifier.qualifierObject );
			}
		} );

		statement.source.forEach( function ( snak ) {
			entityIds.push( snak.sourceProperty );
			if ( isEntityId( snak.sourceObject ) ) {
				entityIds.push( snak.sourceObject );
			}
		} );

		return entityIds;
	}

	function getUrlFormatter( property ) {
		var api = new mw.Api();

		if ( property in URL_FORMATTER_CACHE ) {
			return URL_FORMATTER_CACHE[ property ];
		}

		URL_FORMATTER_CACHE[ property ] = api.get( {
			action: 'wbgetentities',
			ids: property,
			props: 'claims'
		} ).then( function ( result ) {
			var urlFormatter = '';
			$.each( result.entities, function ( _, entity ) {
				if ( entity.claims && 'P1630' in entity.claims ) {
					urlFormatter = entity.claims.P1630[ 0 ].mainsnak.datavalue.value;
				}
			} );
			return urlFormatter;
		} );
		return URL_FORMATTER_CACHE[ property ];
	}

	function getValueTypeFromDataValueType( dataValueType ) {
		return wikibase.dataTypeStore.getDataType( dataValueType )
			.getDataValueType();
	}

	function formatSourceForSave( sourceSnaks ) {
		var dataValue, type,
			result = {};
		sourceSnaks.forEach( function ( snak ) {
			result[ snak.sourceProperty ] = [];
		} );

		sourceSnaks.forEach( function ( snak ) {
			dataValue = ps.commons.tsvValueToJson( snak.sourceObject );
			type = getValueTypeFromDataValueType( dataValue.type );

			result[ snak.sourceProperty ].push( {
				snaktype: 'value',
				property: snak.sourceProperty,
				datavalue: {
					type: type,
					value: dataValue.value
				}
			} );
		} );

		return result;
	}
	/*
	 * END: private functions
	 */

	/*
	 * BEGIN: public functions
	 */
	ps.commons = {
		getBlacklistedSourceUrls: function getBlacklistedSourceUrls() {
			var blacklist,
				now = Date.now();
			if ( localStorage.getItem( 'pst_blacklist' ) ) {
				blacklist = JSON.parse( localStorage.getItem( 'pst_blacklist' ) );
				if ( !blacklist.timestamp ) {
					blacklist.timestamp = 0;
				}
				if ( now - blacklist.timestamp < ps.globals.CACHE_EXPIRY ) {
					console.info( 'PRIMARY SOURCES TOOL: Using cached reference URL blacklist' );
					return $.Deferred().resolve( blacklist.data );
				}
			}
			return $.ajax( {
				url: ps.globals.SOURCE_URL_BLACKLIST
			} ).then( function ( data ) {
				if ( data && data.parse && data.parse.text && data.parse.text[ '*' ] ) {
					blacklist = data.parse.text[ '*' ]
						.replace( /\n/g, '' )
						.replace( /^.*?<ul>(.*?)<\/ul>.*?$/g, '$1' )
						.replace( /<\/li>/g, '' )
						.split( '<li>' )
						.slice( 1 )
						.map( function ( url ) {
							return url.trim();
						} ).filter( function ( url ) {
							var copy = url;
							if ( /\s/g.test( copy ) || !/\./g.test( copy ) ) {
								console.warn(
									'PRIMARY SOURCES TOOL: Skipping invalid blacklisted URL:',
									copy
								);
								return false;
							}
							if ( !/^https?:\/\//.test( copy ) ) {
								copy = 'http://' + url;
							}
							try {
								return ( new URL( copy ) ).host !== '';
							} catch ( e ) {
								console.warn(
									'PRIMARY SOURCES TOOL: Skipping invalid blacklisted URL:',
									copy
								);
								return false;
							}
						} );
					console.info( 'PRIMARY SOURCES TOOL: Caching reference URL blacklist' );
					localStorage.setItem( 'pst_blacklist', JSON.stringify( {
						timestamp: now,
						data: blacklist
					} ) );
					return blacklist;
				} else {
					console.warn(
						'PRIMARY SOURCES TOOL: Could not retrieve reference URL blacklist, ' +
						'it will not be used'
					);
					return [];
				}
			} );
		},

		getWhitelistedSourceUrls: function getWhitelistedSourceUrls() {
			var whitelist,
				now = Date.now();
			if ( localStorage.getItem( 'pst_whitelist' ) ) {
				whitelist = JSON.parse( localStorage.getItem( 'pst_whitelist' ) );
				if ( !whitelist.timestamp ) {
					whitelist.timestamp = 0;
				}
				if ( now - whitelist.timestamp < ps.globals.CACHE_EXPIRY ) {
					console.info( 'PRIMARY SOURCES TOOL: Using cached reference URL whitelist' );
					return $.Deferred().resolve( whitelist.data );
				}
			}
			return $.ajax( {
				url: ps.globals.SOURCE_URL_WHITELIST
			} ).then( function ( data ) {
				if ( data && data.parse && data.parse.text && data.parse.text[ '*' ] ) {
					whitelist = data.parse.text[ '*' ]
						.replace( /\n/g, '' )
						.replace( /^.*?<ul>(.*?)<\/ul>.*?$/g, '$1' )
						.replace( /<\/li>/g, '' )
						.split( '<li>' ).slice( 1 )
						.map( function ( url ) {
							return url.trim();
						} )
						.filter( function ( url ) {
							var copy = url;
							if ( /\s/g.test( copy ) || !/\./g.test( copy ) ) {
								console.warn(
									'PRIMARY SOURCES TOOL: Skipping invalid whitelisted URL:',
									copy
								);
								return false;
							}
							if ( !/^https?:\/\//.test( copy ) ) {
								copy = 'http://' + url;
							}
							try {
								return ( new URL( copy ) ).host !== '';
							} catch ( e ) {
								console.warn(
									'PRIMARY SOURCES TOOL: Skipping invalid whitelisted URL:',
									copy
								);
								return false;
							}
						} );
					console.info( 'PRIMARY SOURCES TOOL: Caching reference URL whitelist' );
					localStorage.setItem( 'pst_whitelist', JSON.stringify( {
						timestamp: now,
						data: whitelist
					} ) );
					return whitelist;
				} else {
					console.warn(
						'PRIMARY SOURCES TOOL: Could not retrieve reference URL whitelist, ' +
						'it will not be used'
					);
					return [];
				}
			} );
		},

		getBlacklistedSourceUrlsWithCallback:
		function getBlacklistedSourceUrlsWithCallback( callback ) {
			ps.commons.getBlacklistedSourceUrls()
				.done( function ( blacklist ) {
					callback( null, blacklist );
				} )
				.fail( function () {
					console.warn(
						'PRIMARY SOURCES TOOL: Could not retrieve reference URL blacklist, ' +
						'it will not be used'
					);
					callback( null );
				} );
		},

		getWhitelistedSourceUrlsWithCallback:
		function getWhitelistedSourceUrlsWithCallback( callback ) {
			ps.commons.getWhitelistedSourceUrls()
				.done( function ( whitelist ) {
					callback( null, whitelist );
				} )
				.fail( function () {
					console.warn(
						'PRIMARY SOURCES TOOL: Could not retrieve reference URL whitelist, ' +
						'it will not be used'
					);
					callback( null );
				} );
		},

		isBlackListedBuilder: function isBlackListedBuilder( blacklistedSourceUrls ) {
			var parsedUrl, i;

			return function ( url ) {
				try {
					parsedUrl = new URL( url );
				} catch ( e ) {
					return false;
				}

				for ( i in blacklistedSourceUrls ) {
					if ( parsedUrl.host.indexOf( blacklistedSourceUrls[ i ] ) !== -1 ) {
						return true;
					}
				}
				return false;
			};
		},

		getValueHtml: function getValueHtml( value, property ) {
			var api, url,
				cacheKey = property + '\t' + value,
				parsed = ps.commons.tsvValueToJson( value ),
				dataValue = {
					type: getValueTypeFromDataValueType( parsed.type ),
					value: parsed.value
				},
				options = {
					lang: mw.language.getFallbackLanguageChain()[ 0 ] || 'en'
				};

			if ( cacheKey in VALUE_HTML_CACHE ) {
				return VALUE_HTML_CACHE[ cacheKey ];
			}

			if ( parsed.type === 'string' ) {
				// Link to external database
				VALUE_HTML_CACHE[ cacheKey ] = getUrlFormatter( property )
					.then( function ( urlFormatter ) {
						if ( urlFormatter === '' ) {
							return parsed.value;
						} else {
							url = urlFormatter.replace( '$1', parsed.value );
							return '<a rel="nofollow" class="external free" href="' + url + '">' +
							parsed.value + '</a>';
						}
					} );
			} else if ( parsed.type === 'url' ) {
				VALUE_HTML_CACHE[ cacheKey ] = $.Deferred()
					.resolve(
						'<a rel="nofollow" class="external free" href="' + parsed.value + '">' +
						parsed.value + '</a>'
					);
			} else if ( parsed.type === 'wikibase-item' || parsed.type === 'wikibase-property' ) {
				return ps.commons.getEntityLabel( value ).then( function ( label ) {
					return '<a href="/entity/' + value + '">' + label + '</a>';
				} );
			} else {
				api = new mw.Api();
				VALUE_HTML_CACHE[ cacheKey ] = api.get( {
					action: 'wbformatvalue',
					generate: 'text/html',
					datavalue: JSON.stringify( dataValue ),
					datatype: parsed.type,
					options: JSON.stringify( options )
				} ).then( function ( result ) {
					// Create links for geocoordinates
					if ( parsed.type === 'globe-coordinate' ) {
						url = 'https://tools.wmflabs.org/geohack/geohack.php?language=' +
						mw.config.get( 'wgUserLanguage' ) +
						'&params=' +
						dataValue.value.latitude +
						'_N_' +
						dataValue.value.longitude +
						'_E_globe:earth';
						return '<a rel="nofollow" class="external free" href="' + url + '">' +
						result.result + '</a>';
					}
					return result.result;
				} );
			}
			return VALUE_HTML_CACHE[ cacheKey ];
		},

		/* BEGIN: Primary sources tool API calls */
		// Update the suggestions state
		setStatementState: function setStatementState( quickStatement, state, dataset, type ) {
			var data = {
				qs: quickStatement,
				state: state,
				dataset: dataset,
				type: type,
				user: mw.user.getName()
			};
			if ( !ps.globals.STATEMENT_STATES[ state ] ) {
				ps.commons.reportError( 'Invalid statement state' );
			}
			return $.post( ps.globals.API_ENDPOINTS.CURATE_SERVICE, JSON.stringify( data ) )
				.fail( function () {
					ps.commons.reportError( 'Set statement state to ' + state + ' failed.' );
				} );
		},

		// Get the available datasets
		getDatasets: function getDatasets( callback ) {
			var blacklist,
				now = Date.now();
			if ( localStorage.getItem( 'pst_dataset' ) ) {
				blacklist = JSON.parse( localStorage.getItem( 'pst_dataset' ) );
				if ( !blacklist.timestamp ) {
					blacklist.timestamp = 0;
				}
				if ( now - blacklist.timestamp < ps.globals.CACHE_EXPIRY ) {
					return callback( blacklist.data );
				}
			}
			$.ajax( {
				url: ps.globals.API_ENDPOINTS.DATASETS_SERVICE
			} ).done( function ( data ) {
				localStorage.setItem( 'pst_dataset', JSON.stringify( {
					timestamp: now,
					data: data
				} ) );
				return callback( data );
			} ).fail( function ( xhr ) {
				console.warn(
					'PRIMARY SOURCES TOOL: Could not retrieve the available datasets. ' +
					'Something went wrong when calling:', ps.globals.API_ENDPOINTS.DATASETS_SERVICE,
					'The server responded with status code', xhr.status,
					'Reason:', xhr.responseText
				);
			} );
		},
		/* END: Primary sources tool API calls */

		/* BEGIN: Wikidata API calls */
		// BEGIN: post approved claims to Wikidata
		// https://www.wikidata.org/w/api.php?action=help&modules=wbcreateclaim
		createClaim: function createClaim( subject, predicate, object, qualifiers ) {
			var qualifierValue,
				claimValue = ( ps.commons.tsvValueToJson( object ) ).value,
				api = new mw.Api();

			console.debug(
				'PRIMARY SOURCES TOOL: Converted QuickStatement value to Wikidata JSON:',
				object,
				claimValue
			);

			return api.postWithToken( 'csrf', {
				action: 'wbcreateclaim',
				entity: subject,
				property: predicate,
				snaktype: 'value',
				value: JSON.stringify( claimValue ),
				summary: ps.globals.WIKIDATA_API_COMMENT
			} ).then( function ( data ) {
				// We save the qualifiers sequentially in order to avoid edit conflict
				var saveQualifiers = function () {
					var qualifier = qualifiers.pop();
					if ( qualifier === undefined ) {
						return data;
					}

					qualifierValue = (
						ps.commons.tsvValueToJson( qualifier.qualifierObject )
					).value;
					return api.postWithToken( 'csrf', {
						action: 'wbsetqualifier',
						claim: data.claim.id,
						property: qualifier.qualifierProperty,
						snaktype: 'value',
						value: JSON.stringify( qualifierValue ),
						summary: ps.globals.WIKIDATA_API_COMMENT
					} ).then( saveQualifiers );
				};
				return saveQualifiers();
			} );
		},

		// https://www.wikidata.org/w/api.php?action=help&modules=wbsetreference
		createReference:
		function createReference( subject, predicate, object, sourceSnaks, callback ) {
			var api = new mw.Api();

			api.get( {
				action: 'wbgetclaims',
				entity: subject,
				property: predicate
			} ).then( function ( data ) {
				var i, lenI, claimObject, mainSnak,
					index = -1;

				for ( i = 0, lenI = data.claims[ predicate ].length; i < lenI; i++ ) {
					claimObject = data.claims[ predicate ][ i ];
					mainSnak = claimObject.mainsnak;
					if ( mainSnak.snaktype === 'value' &&
						mw.ps.commons.jsonToTsvValue(
							mainSnak.datavalue, mainSnak.datatype
						) === object ) {
						index = i;
						break;
					}
				}
				return api.postWithToken( 'csrf', {
					action: 'wbsetreference',
					statement: data.claims[ predicate ][ index ].id,
					snaks: JSON.stringify( formatSourceForSave( sourceSnaks ) ),
					summary: ps.globals.WIKIDATA_API_COMMENT
				} );
			} ).done( function ( data ) {
				return callback( null, data );
			} ).fail( function ( error ) {
				return callback( error );
			} );
		},

		// Combines the 2 functions above
		createClaimWithReference:
		function createClaimWithReference( subject, predicate, object, qualifiers, sourceSnaks ) {
			var api = new mw.Api();

			return ps.commons.createClaim( subject, predicate, object, qualifiers )
				.then( function ( data ) {
					return api.postWithToken( 'csrf', {
						action: 'wbsetreference',
						statement: data.claim.id,
						snaks: JSON.stringify( formatSourceForSave( sourceSnaks ) ),
						summary: ps.globals.WIKIDATA_API_COMMENT
					} );
				} );
		},
		// END: post approved claims to Wikidata

		// BEGIN: get existing claims from Wikidata
		// https://www.wikidata.org/w/api.php?action=help&modules=wbgetclaims
		getClaims: function getClaims( subject, predicate, callback ) {
			var api = new mw.Api();

			api.get( {
				action: 'wbgetclaims',
				entity: subject,
				property: predicate
			} ).done( function ( data ) {
				return callback( null, data.claims[ predicate ] || [] );
			} ).fail( function ( error ) {
				return callback( error );
			} );
		},
		// END: get existing claims from Wikidata
		/* END: Wikidata API calls */

		/* BEGIN: utilities */
		reportError: function reportError( error ) {
			mw.notify( error, {
				autoHide: true,
				tag: 'ps-error'
			} );
		},

		isUrl: function isUrl( url ) {
			if ( typeof URL !== 'function' ) {
				return url.indexOf( 'http' ) === 0;
			}
			try {
				url = new URL( url.toString() );
				return url.protocol.indexOf( 'http' ) === 0 && url.host;
			} catch ( e ) {
				return false;
			}
		},

		getEntityLabel: function getEntityLabel( entityId ) {
			if ( !( entityId in ENTITY_LABEL_CACHE ) ) {
				ps.commons.loadEntityLabels( [ entityId ] );
			}
			return ENTITY_LABEL_CACHE[ entityId ];
		},

		getEntityLabels: function getEntityLabels( entityIds ) {
			// Split entityIds per bucket in order to match limits
			var promises,
				buckets = [],
				currentBucket = [];

			entityIds.forEach( function ( entityId ) {
				currentBucket.push( entityId );
				if ( currentBucket.length > 40 ) {
					buckets.push( currentBucket );
					currentBucket = [];
				}
			} );
			buckets.push( currentBucket );

			promises = buckets.map( function ( bucket ) {
				return ps.commons.getFewEntityLabels( bucket );
			} );

			return $.when.apply( this, promises ).then( function () {
				return $.extend.apply( this, arguments );
			} );
		},

		getFewEntityLabels: function getFewEntityLabels( entityIds ) {
			var api = new mw.Api(),
				language = mw.config.get( 'wgUserLanguage' );

			if ( entityIds.length === 0 ) {
				return $.Deferred().resolve( {} );
			}

			return api.get( {
				action: 'wbgetentities',
				ids: entityIds.join( '|' ),
				props: 'labels',
				languages: language,
				languagefallback: true
			} ).then( function ( data ) {
				var id, entity,
					labels = {};

				for ( id in data.entities ) {
					entity = data.entities[ id ];
					if ( entity.labels && entity.labels[ language ] ) {
						labels[ id ] = entity.labels[ language ].value;
					} else {
						labels[ id ] = entity.id;
					}
				}
				return labels;
			} );
		},

		loadEntityLabels: function loadEntityLabels( entityIds ) {
			var promise = ps.commons.getEntityLabels( entityIds );

			entityIds = entityIds.filter( function ( entityId ) {
				return !( entityId in ENTITY_LABEL_CACHE );
			} );
			if ( entityIds.length === 0 ) {
				return;
			}

			entityIds.forEach( function ( entityId ) {
				ENTITY_LABEL_CACHE[ entityId ] = promise.then( function ( labels ) {
					return labels[ entityId ];
				} );
			} );
		},

		// Wikidata JSON example: https://www.wikidata.org/wiki/Special:EntityData/Q666.json
		tsvValueToJson: function tsvValueToJson( value ) {
			var latitude, longitude, timeParts;

			if ( MATCHERS.ITEM.test( value ) ) {
				return {
					type: 'wikibase-item',
					value: {
						'entity-type': 'item',
						'numeric-id': parseInt( value.replace( /^Q/, '' ) )
					}
				};
			} else if ( MATCHERS.PROPERTY.test( value ) ) {
				return {
					type: 'wikibase-property',
					value: {
						'entity-type': 'property',
						'numeric-id': parseInt( value.replace( /^P/, '' ) )
					}
				};
			} else if ( MATCHERS.QUICKSTATEMENT_GLOBE_COORDINATE.test( value ) ) {
				latitude = value.replace( MATCHERS.QUICKSTATEMENT_GLOBE_COORDINATE, '$1' );
				longitude = value.replace( MATCHERS.QUICKSTATEMENT_GLOBE_COORDINATE, '$2' );
				return {
					type: 'globe-coordinate',
					value: {
						latitude: parseFloat( latitude ),
						longitude: parseFloat( longitude ),
						altitude: null,
						precision: computeCoordinatesPrecision( latitude, longitude ),
						globe: DEFAULT_GLOBE
					}
				};
			} else if ( MATCHERS.QUICKSTATEMENT_MONOLINGUAL_TEXT.test( value ) ) {
				return {
					type: 'monolingualtext',
					value: {
						language: value.replace( MATCHERS.QUICKSTATEMENT_MONOLINGUAL_TEXT, '$1' ),
						text: JSON.parse(
							value.replace( MATCHERS.QUICKSTATEMENT_MONOLINGUAL_TEXT, '$2' )
						)
					}
				};
			} else if ( MATCHERS.QUICKSTATEMENT_TIME.test( value ) ) {
				timeParts = value.split( '/' );
				return {
					type: 'time',
					value: {
						time: timeParts[ 0 ],
						timezone: 0,
						before: 0,
						after: 0,
						precision: parseInt( timeParts[ 1 ] ),
						calendarmodel: DEFAULT_CALENDAR_MODEL
					}
				};
			} else if ( MATCHERS.QUANTITY.test( value ) ) {
				return {
					type: 'quantity',
					value: {
						amount: value,
						unit: '1'
					}
				};
			} else {
				try {
					value = JSON.parse( value );
				} catch ( e ) {
					// If it is an invalid JSON, we assume it is the value
					if ( !( e instanceof SyntaxError ) ) {
						throw e;
					}
				}
				if ( ps.commons.isUrl( value ) ) {
					return {
						type: 'url',
						value: ps.commons.normalizeUrl( value )
					};
				} else {
					return {
						type: 'string',
						value: value
					};
				}
			}
		},

		rdfValueToJson: function rdfValueToJson( value ) {
			var longitude, latitude, timeParts;

			if ( MATCHERS.ITEM.test( value ) ) {
				return {
					type: 'wikibase-item',
					value: {
						'entity-type': 'item',
						'numeric-id': parseInt( value.replace( /^Q/, '' ) )
					}
				};
			} else if ( MATCHERS.PROPERTY.test( value ) ) {
				return {
					type: 'wikibase-property',
					value: {
						'entity-type': 'property',
						'numeric-id': parseInt( value.replace( /^P/, '' ) )
					}
				};
			} else if ( MATCHERS.RDF_GLOBE_COORDINATE.test( value ) ) {
				longitude = value.replace( MATCHERS.RDF_GLOBE_COORDINATE, '$1' );
				latitude = value.replace( MATCHERS.RDF_GLOBE_COORDINATE, '$2' );
				return {
					type: 'globe-coordinate',
					value: {
						latitude: parseFloat( latitude ),
						longitude: parseFloat( longitude ),
						altitude: null,
						precision: computeCoordinatesPrecision( latitude, longitude ),
						globe: DEFAULT_GLOBE
					}
				};
			} else if ( MATCHERS.RDF_MONOLINGUAL_TEXT.test( value ) ) {
				return {
					type: 'monolingualtext',
					value: {
						language: value.replace( MATCHERS.RDF_MONOLINGUAL_TEXT, '$2' ),
						text: JSON.parse( value.replace( MATCHERS.RDF_MONOLINGUAL_TEXT, '$1' ) )
					}
				};
			} else if ( MATCHERS.RDF_TIME.test( value ) ) {
				timeParts = value.split( '/' );
				return {
					type: 'time',
					value: {
						time: timeParts[ 0 ],
						timezone: 0,
						before: 0,
						after: 0,
						precision: parseInt( timeParts[ 1 ] ),
						calendarmodel: DEFAULT_CALENDAR_MODEL
					}
				};
			} else if ( MATCHERS.QUANTITY.test( value ) ) {
				return {
					type: 'quantity',
					value: {
						amount: value,
						unit: '1'
					}
				};
			} else {
				try {
					value = JSON.parse( value );
				} catch ( e ) {
					// If it is an invalid JSON we assume it is the value
					if ( !( e instanceof SyntaxError ) ) {
						throw e;
					}
				}
				if ( ps.commons.isUrl( value ) ) {
					return {
						type: 'url',
						value: ps.commons.normalizeUrl( value )
					};
				} else {
					return {
						type: 'string',
						value: '"' + value + '"'
					};
				}
			}
		},

		rdfValueToTsv: function rdfValueToTsv( value ) {
			var longitude, latitude, text, language, match, era;

			if ( MATCHERS.ITEM.test( value ) ) {
				return value;
			} else if ( MATCHERS.PROPERTY.test( value ) ) {
				return value;
			} else if ( MATCHERS.RDF_GLOBE_COORDINATE.test( value ) ) {
				longitude = value.replace( MATCHERS.RDF_GLOBE_COORDINATE, '$1' );
				latitude = value.replace( MATCHERS.RDF_GLOBE_COORDINATE, '$2' );
				// @43.3111/-16.6655
				return '@' + latitude + '/' + longitude;
			} else if ( MATCHERS.RDF_MONOLINGUAL_TEXT.test( value ) ) {
				text = value.replace( MATCHERS.RDF_MONOLINGUAL_TEXT, '$1' );
				language = value.replace( MATCHERS.RDF_MONOLINGUAL_TEXT, '$2' );
				// en:"Douglas Adams"
				return language + ':"' + text + '"';
			} else if ( MATCHERS.RDF_TIME.test( value ) ) {
				match = MATCHERS.RDF_TIME.exec( value );
				// No initial '-' means '+'
				era = match[ 1 ] ? match[ 1 ] : '+';
				// Guess precision based on '01' values
				if ( parseInt( match[ 3 ] ) > 1 ) {
					return era + value + '/11';
				} else if ( parseInt( match[ 2 ] ) > 1 ) {
					return era + value + '/10';
				} else {
					return era + value + '/9';
				}
			} else if ( MATCHERS.QUANTITY.test( value ) ) {
				return value;
			} else {
				return '"' + value + '"';
			}
		},

		buildValueKeysFromWikidataStatement:
		function buildValueKeysFromWikidataStatement( statement ) {
			var qualifierKeyParts,
				mainSnak = statement.mainsnak,
				keys = [ ps.commons.jsonToTsvValue( mainSnak.datavalue, mainSnak.datatype ) ];

			if ( mainSnak.snaktype !== 'value' ) {
				return [ mainSnak.snaktype ];
			}
			if ( statement.qualifiers ) {
				qualifierKeyParts = [];
				$.each( statement.qualifiers, function ( _, qualifiers ) {
					qualifiers.forEach( function ( qualifier ) {
						qualifierKeyParts.push(
							qualifier.property + '\t' +
                            ps.commons.jsonToTsvValue( qualifier.datavalue, qualifier.datatype )
						);
					} );
				} );
				qualifierKeyParts.sort();
				keys.push( keys[ 0 ] + '\t' + qualifierKeyParts.join( '\t' ) );
			}
			return keys;
		},

		jsonToTsvValue: function jsonToTsvValue( dataValue, dataType ) {
			var time, timePrecision, plainStringOrUrl;

			if ( !dataValue.type ) {
				console.warn(
					'PRIMARY SOURCES TOOL: Wikidata JSON value without data type:',
					dataValue,
					'It will be converted to QuickStatement as is'
				);
				return dataValue.value;
			}

			switch ( dataValue.type ) {
				case 'quantity':
					return dataValue.value.amount;
				case 'time':
					time = dataValue.value.time;
					timePrecision = dataValue.value.precision;
					if ( timePrecision < 11 ) {
						time = time.replace( '-00T', '-01T' );
					}
					if ( timePrecision < 10 ) {
						time = time.replace( '-00-', '-01-' );
					}
					return time + '/' + timePrecision;
				case 'globecoordinate':
					return '@' + dataValue.value.latitude + '/' + dataValue.value.longitude;
				case 'monolingualtext':
					return dataValue.value.language + ':' + JSON.stringify( dataValue.value.text );
				case 'string':
					plainStringOrUrl = ( dataType === 'url' ) ?
						ps.commons.normalizeUrl( dataValue.value ) :
						dataValue.value;
					return JSON.stringify( plainStringOrUrl );
				case 'wikibase-entityid':
					switch ( dataValue.value[ 'entity-type' ] ) {
						case 'item':
							return 'Q' + dataValue.value[ 'numeric-id' ];
						case 'property':
							return 'P' + dataValue.value[ 'numeric-id' ];
					}
			}

			console.warn(
				'PRIMARY SOURCES TOOL: Wikidata JSON value with unknown data type:',
				dataValue,
				'Type:',
				dataValue.type,
				'It will be converted to QuickStatement as is'
			);

			return dataValue.value;
		},

		jsonToRdfValue: function jsonToRdfValue( dataValue, dataType ) {
			var time, timePrecision, plainStringOrUrl;

			if ( !dataValue.type ) {
				console.warn(
					'PRIMARY SOURCES TOOL: Wikidata JSON value without data type:',
					dataValue,
					'It will be converted to RDF as is'
				);
				return dataValue.value;
			}

			switch ( dataValue.type ) {
				case 'quantity':
					return dataValue.value.amount;
				case 'time':
					// 2018-02-07T00:00:00Z
					time = dataValue.value.time;
					timePrecision = dataValue.value.precision;
					if ( timePrecision < 11 ) {
						time = time.replace( '-00T', '-01T' );
					}
					if ( timePrecision < 10 ) {
						time = time.replace( '-00-', '-01-' );
					}
					return time.replace( /[+-]/, '' );
				case 'globecoordinate':
					return 'Point(' +
					dataValue.value.longitude +
					' ' +
					dataValue.value.latitude +
					')';
				case 'monolingualtext':
					return JSON.stringify( dataValue.value.text ) + '@' + dataValue.value.language;
				case 'string':
					plainStringOrUrl = ( dataType === 'url' ) ?
						ps.commons.normalizeUrl( dataValue.value ) :
						dataValue.value;
					return JSON.stringify( plainStringOrUrl );
				case 'wikibase-entityid':
					switch ( dataValue.value[ 'entity-type' ] ) {
						case 'item':
							return 'Q' + dataValue.value[ 'numeric-id' ];
						case 'property':
							return 'P' + dataValue.value[ 'numeric-id' ];
					}
			}

			console.warn(
				'PRIMARY SOURCES TOOL: Wikidata JSON value with unknown data type:',
				dataValue,
				'Type:',
				dataValue.type,
				'It will be converted to RDF as is'
			);

			return dataValue.value;
		},

		normalizeUrl: function normalizeUrl( url ) {
			try {
				return ( new URL( url.toString() ) ).href;
			} catch ( e ) {
				return url;
			}
		},

		parsePrimarySourcesStatement:
		function parsePrimarySourcesStatement( statement, isBlacklisted ) {
			var i, qualifierKey, url, blacklisted, sourceQuickStatement,
				// The full QuickStatement acts as the ID
				id = statement.statement,
				dataset = statement.dataset,
				line = statement.statement.split( /\t/ ),
				subject = line[ 0 ],
				predicate = line[ 1 ],
				object = line[ 2 ],
				qualifiers = [],
				source = [],
				key = object,
				// Handle any qualifiers and/or sources
				qualifierKeyParts = [],
				lineLength = line.length;

			for ( i = 3; i < lineLength; i += 2 ) {
				if ( i === lineLength - 1 ) {
					console.warn(
						'PRIMARY SOURCES TOOL: Malformed QuickStatement,' +
						'will skip qualifiers and references:',
						id
					);
					break;
				}
				if ( MATCHERS.PROPERTY.test( line[ i ] ) ) {
					qualifierKey = line[ i ] + '\t' + line[ i + 1 ];
					qualifiers.push( {
						qualifierProperty: line[ i ],
						qualifierObject: line[ i + 1 ],
						key: qualifierKey
					} );
					qualifierKeyParts.push( qualifierKey );
				} else if ( /^S\d+$/.test( line[ i ] ) ) {
					source.push( {
						sourceProperty: line[ i ].replace( /^S/, 'P' ),
						sourceObject: line[ i + 1 ],
						sourceType: ( ps.commons.tsvValueToJson( line[ i + 1 ] ) ).type,
						sourceId: id,
						key: line[ i ] + '\t' + line[ i + 1 ]
					} );
				}

				// Avoid appending tabs to the statement key if there are no qualifiers
				if ( qualifierKeyParts.length !== 0 ) {
					qualifierKeyParts.sort();
					key += '\t' + qualifierKeyParts.join( '\t' );
				}

				// Filter out blacklisted source URLs
				source = source.filter( function ( source ) {
					if ( source.sourceType === 'url' ) {
						url = source.sourceObject.replace( /^"/, '' ).replace( /"$/, '' );
						blacklisted = isBlacklisted( url );
						if ( blacklisted ) {
							console.info(
								'PRIMARY SOURCES TOOL: Hit a blacklisted reference URL:',
								url
							);
							sourceQuickStatement = [
								subject, predicate, object, source.key
							].join( '\t' );
							( function ( currentId ) {
								ps.commons.setStatementState(
									currentId,
									ps.globals.STATEMENT_STATES.blacklisted,
									dataset,
									'reference'
								)
									.done( function () {
										console.info(
											'PRIMARY SOURCES TOOL: Blacklisted referenced claim ' +
											'[' + currentId + ']'
										);
									} );
							}( sourceQuickStatement ) );
						}
						// Return the non-blacklisted URLs
						return !blacklisted;
					}
					return true;
				} );
			}

			return {
				id: id,
				dataset: dataset,
				subject: subject,
				predicate: predicate,
				object: object,
				qualifiers: qualifiers,
				source: source,
				key: key
			};
		},

		preloadEntityLabels: function preloadEntityLabels( statements ) {
			var entityIds = [];

			statements.forEach( function ( statement ) {
				entityIds = entityIds.concat( extractEntityIdsFromStatement( statement ) );
			} );
			ps.commons.loadEntityLabels( entityIds );
		},

		datasetUriToLabel: function datasetUriToLabel( uri ) {
			if ( ps.commons.isUrl( uri ) ) {
				// [ "http:", "", "DATASET-LABEL", "STATE" ]
				return uri.split( '/' )[ 2 ];
			} else {
				console.warn(
					'PRIMARY SOURCES TOOL: The dataset has an invalid URI: ' +
					'<' + uri + '>. Will appear as is'
				);
				return uri;
			}
		}
		/* END: utilities */
	};

	mw.ps = ps;

	console.info( 'PRIMARY SOURCES TOOL: Common functions loaded' );

}( mediaWiki, jQuery ) );
