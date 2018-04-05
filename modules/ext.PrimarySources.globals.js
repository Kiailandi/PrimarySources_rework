(function (mw, $) {

    var ps = mw.ps || {};

    // Get the selected dataset from a cookie
    mw.loader.using(['mediawiki.cookie'], function () {
        ps.globals.DATASET = mw.cookie.get('ps-dataset', null, '');
    });

    var BASE_URI = 'https://pst.wmflabs.org/pst/';

    // Uncomment the following line to enable debug log messages
    localStorage.setItem('f2w_debug', true);
    // Uncomment the following line to add fake blue statements for testing
    // localStorage.setItem('f2w_fakeOrRandomData', true);

    // accessible object
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
            SOURCE_URL_BLACKLIST: 'https://wikidata-pst.wmflabs.org/w/api.php' + '?action=parse&format=json&prop=text' + '&page=Wikidata:Primary_sources_tool/URL_blacklist',
            SOURCE_URL_WHITELIST: 'https://wikidata-pst.wmflabs.org/w/api.php' + '?action=parse&format=json&prop=text' + '&page=Wikidata:Primary_sources_tool/URL_whitelist',
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
        DEBUG: JSON.parse(localStorage.getItem('f2w_debug')) || false,
        FAKE_OR_RANDOM_DATA: JSON.parse(localStorage.getItem('f2w_fakeOrRandomData')) || false,
        CACHE_EXPIRY: 60 * 60 * 1000,
        DATASET: "",
        // SPARQL query to get the set of statement item values in the back end
        STATEMENT_VALUES: 'SELECT DISTINCT ?statement_value WHERE {' +
        '  GRAPH ?dataset {' +
        '  ?statement_node ?statement_property ?statement_value .' +
        '  FILTER STRSTARTS(str(?statement_node), "http://wikidata-pst.wmflabs.org/entity/statement/") .' +
        '  FILTER STRSTARTS(str(?statement_value), "http://wikidata-pst.wmflabs.org/entity/Q") .' +
        '  FILTER STRENDS(str(?dataset), "new") .}' +
        '}'
    };

    mw.ps = ps;

    console.log("Primary sources tool - globals module loaded");
    
})(mediaWiki, jQuery);
