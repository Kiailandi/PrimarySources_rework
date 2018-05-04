(function (mw, $) {

    // Uncomment the following line to add fake blue statements for testing
    // localStorage.setItem('f2w_fakeOrRandomData', true);

    var ps = mw.ps || {};

    var BASE_URI = 'https://pst.wmflabs.org/v2/';

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
            PREVIEW_SERVICE: 'https://tools.wmflabs.org/strephit/search?url=',
            SOURCE_URL_BLACKLIST: 'https://wikidata-pst.wmflabs.org/w/api.php' + '?action=parse&format=json&prop=text' + '&page=Testwiki:Primary_sources_tool/URL_blacklist',
            SOURCE_URL_WHITELIST: 'https://wikidata-pst.wmflabs.org/w/api.php' + '?action=parse&format=json&prop=text' + '&page=Testwiki:Primary_sources_tool/URL_whitelist',
            WIKIDATA_ENTITY_DATA_URL: 'https://wikidata-pst.wmflabs.org/wiki/Special:EntityData/{{qid}}.json'
        },

        WIKIDATA_API_COMMENT: 'Added via [[Wikidata:Primary sources tool]]',
        STATEMENT_STATES: {
            unapproved: 'new',
            approved: 'approved',
            rejected: 'rejected',
            duplicate: 'duplicate',
            blacklisted: 'blacklisted'
        },
        STATEMENT_FORMAT: 'QuickStatement',
        FAKE_OR_RANDOM_DATA: JSON.parse(localStorage.getItem('f2w_fakeOrRandomData')) || false,
        CACHE_EXPIRY: 60 * 60 * 1000
    };

    // Get the selected dataset from a cookie
    mw.loader.using(['mediawiki.cookie'], function () {
        ps.globals.DATASET = mw.cookie.get('ps-dataset', null, '');
    });

    mw.ps = ps;

    console.info('PRIMARY SOURCES TOOL: Globals module loaded');
    
})(mediaWiki, jQuery);
