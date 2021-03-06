( function ( mw ) {
	// Uncomment the following line to add fake blue statements for testing
	// localStorage.setItem('pst_fakeOrRandomData', true);

	var ps = mw.ps || {},
		BASE_URI = 'https://pst.wmflabs.org/v2/',
		WIKIDATA_BASE_URI = 'https://www.wikidata.org/';

	// Public constants
	ps.globals = {
		API_ENDPOINTS: {
			DATASETS_SERVICE: BASE_URI + 'datasets',
			STATISTICS_SERVICE: BASE_URI + 'statistics',
			RANDOM_SERVICE: BASE_URI + 'random',
			SUGGEST_SERVICE: BASE_URI + 'suggest?qid={{qid}}',
			CURATE_SERVICE: BASE_URI + 'curate',
			SEARCH_SERVICE: BASE_URI + 'search',
			PROPERTIES_SERVICE: BASE_URI + 'properties',
			VALUES_SERVICE: BASE_URI + 'values',
			SPARQL_SERVICE: BASE_URI + 'sparql',
			PREVIEW_SERVICE: 'https://tools.wmflabs.org/strephit/search?url='
		},
		SOURCE_URL_BLACKLIST:
			WIKIDATA_BASE_URI + 'w/api.php' +
			'?action=parse&format=json&prop=text' +
			'&page=Wikidata:Primary_sources_tool/URL_blacklist',
		SOURCE_URL_WHITELIST:
			WIKIDATA_BASE_URI + 'w/api.php' +
			'?action=parse&format=json&prop=text' +
			'&page=Wikidata:Primary_sources_tool/URL_whitelist',
		WIKIDATA_ENTITY_DATA_URL:
			WIKIDATA_BASE_URI +
			'wiki/Special:EntityData/{{qid}}.json',
		WIKIDATA_API_COMMENT: 'Added via [[Wikidata:Primary sources tool]]',
		STATEMENT_STATES: {
			'new': 'new',
			approved: 'approved',
			rejected: 'rejected',
			duplicate: 'duplicate',
			blacklisted: 'blacklisted'
		},
		STATEMENT_FORMAT: 'QuickStatement',
		FAKE_OR_RANDOM_DATA:
			JSON.parse( localStorage.getItem( 'pst_fakeOrRandomData' ) ) ||
			false,
		CACHE_EXPIRY: 60 * 60 * 1000,
		/*
		 * See https://caolan.github.io/async/
		 * Script taken from
		 * https://github.com/caolan/async/blob/master/dist/async.js
		 */
		ASYNC_SCRIPT:
			WIKIDATA_BASE_URI + 'w/index.php' +
			'?title=User:Kiailandi/async.js&action=raw&ctype=text%2Fjavascript'
	};

	// Get the selected dataset from a cookie
	mw.loader.using( [ 'mediawiki.cookie' ], function () {
		ps.globals.DATASET = mw.cookie.get( 'ps-dataset', null, '' );
	} );

	mw.ps = ps;

	console.info( 'PRIMARY SOURCES TOOL: Globals module loaded' );

}( mediaWiki ) );
