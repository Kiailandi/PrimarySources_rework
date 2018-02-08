(function(mw) {
  console.log("Primary sources tool - globals module");

    // Attach to window and globally
    window.primarySources = window.ps = {};
  
  // accessible object
  var globals = {};

  var API_BASE_URI = 'https://pst.wmflabs.org/pst/';
  
  globals.API_ENDPOINTS = {
      DATASETS_SERVICE: API_BASE_URI + 'datasets',
      RANDOM_SERVICE: API_BASE_URI + 'random',
      SUGGEST_SERVICE: API_BASE_URI + 'suggest?qid={{qid}}',
      CURATE_SERVICE: API_BASE_URI + 'curate',
      SEARCH_SERVICE: API_BASE_URI + 'search',
      SOURCE_URL_BLACKLIST: 'https://www.wikidata.org/w/api.php' + '?action=parse&format=json&prop=text' + '&page=Wikidata:Primary_sources_tool/URL_blacklist',
      SOURCE_URL_WHITELIST: 'https://www.wikidata.org/w/api.php' + '?action=parse&format=json&prop=text' + '&page=Wikidata:Primary_sources_tool/URL_whitelist',
      WIKIDATA_ENTITY_DATA_URL: 'https://www.wikidata.org/wiki/Special:EntityData/{{qid}}.json'
  };

  globals.WIKIDATA_API_COMMENT = 'Added via [[Wikidata:Primary sources tool]]';

  globals.STATEMENT_STATES = {
    unapproved: 'new',
    approved: 'approved',
    rejected: 'rejected',
    duplicate: 'duplicate',
    blacklisted: 'blacklisted'
  };
  globals.STATEMENT_FORMAT = 'QuickStatement';

  // Uncomment the following line to enable debug log messages
  localStorage.setItem('f2w_debug', true);
  globals.DEBUG = JSON.parse(localStorage.getItem('f2w_debug')) || false;
  
  globals.FAKE_OR_RANDOM_DATA = JSON.parse(localStorage.getItem('f2w_fakeOrRandomData')) || false;
  
  globals.CACHE_EXPIRY = 60 * 60 * 1000;

  var DATASET = null;
  mw.loader.using(['mediawiki.cookie']).then(function() {
      DATASET = mw.cookie.get('ps-dataset', null, '');
  });
  globals.DATASET = DATASET;
  
  // SPARQL query to get the set of statement item values in the back end
  globals.STATEMENT_VALUES =
  'SELECT DISTINCT ?statement_value WHERE {' +
  '  GRAPH ?dataset {' +
  '  ?statement_node ?statement_property ?statement_value .' +
  '  FILTER STRSTARTS(str(?statement_node), "http://www.wikidata.org/entity/statement/") .' +
  '  FILTER STRSTARTS(str(?statement_value), "http://www.wikidata.org/entity/Q") .' +
  '  FILTER STRENDS(str(?dataset), "new") .}' +
  '}';
  
  ps.globals = globals;
  
}(mediaWiki));
