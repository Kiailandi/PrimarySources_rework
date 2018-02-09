(function (mw, $) {
  console.log("Primary sources tool - globals module");

  var ps = mw.ps || {};

  // Get the selected dataset from a cookie
  var dataset;
  mw.loader.using(['mediawiki.cookie']).then(function () {
    dataset = mw.cookie.get('ps-dataset', null, '');
  });
  var api_base_uri = 'https://pst.wmflabs.org/pst/';

  // Uncomment the following line to enable debug log messages
  localStorage.setItem('f2w_debug', true);
  // Uncomment the following line to add fake blue statements for testing
  // localStorage.setItem('f2w_fakeOrRandomData', true);

  // accessible object
  ps.globals = {
    API_ENDPOINTS: {
      DATASETS_SERVICE: api_base_uri + 'datasets',
      RANDOM_SERVICE: api_base_uri + 'random',
      SUGGEST_SERVICE: api_base_uri + 'suggest?qid={{qid}}',
      CURATE_SERVICE: api_base_uri + 'curate',
      SEARCH_SERVICE: api_base_uri + 'search',
      SOURCE_URL_BLACKLIST: 'https://www.wikidata.org/w/api.php' + '?action=parse&format=json&prop=text' + '&page=Wikidata:Primary_sources_tool/URL_blacklist',
      SOURCE_URL_WHITELIST: 'https://www.wikidata.org/w/api.php' + '?action=parse&format=json&prop=text' + '&page=Wikidata:Primary_sources_tool/URL_whitelist',
      WIKIDATA_ENTITY_DATA_URL: 'https://www.wikidata.org/wiki/Special:EntityData/{{qid}}.json'
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
    DATASET: dataset,
    // SPARQL query to get the set of statement item values in the back end
    STATEMENT_VALUES:
      'SELECT DISTINCT ?statement_value WHERE {' +
      '  GRAPH ?dataset {' +
      '  ?statement_node ?statement_property ?statement_value .' +
      '  FILTER STRSTARTS(str(?statement_node), "http://www.wikidata.org/entity/statement/") .' +
      '  FILTER STRSTARTS(str(?statement_value), "http://www.wikidata.org/entity/Q") .' +
      '  FILTER STRENDS(str(?dataset), "new") .}' +
      '}'
  };

  mw.ps = {};

}(mediaWiki, jQuery));
