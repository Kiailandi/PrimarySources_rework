( function ( mw, ps) {
  console.log("PrimarySources - util");

var FREEBASE_DATASETS =
    'https://tools.wmflabs.org/wikidata-primary-sources/datasets/all';

var CACHE_EXPIRY = 60 * 60 * 1000;


var util = {};

dataset = null;
mw.loader.using([
  'mediawiki.cookie']
  ).then( function() { 
    dataset = mw.cookie.get('ps-dataset', null, '');
});

util.dataset = dataset; 

util.getPossibleDatasets = function getPossibleDatasets(callback) {
    var now = Date.now();
    if (localStorage.getItem('f2w_dataset')) {
      var blacklist = JSON.parse(localStorage.getItem('f2w_dataset'));
      if (!blacklist.timestamp) {
        blacklist.timestamp = 0;
      }
      if (now - blacklist.timestamp < CACHE_EXPIRY) {
        return callback(blacklist.data);
      }
    }
    $.ajax({
      url: FREEBASE_DATASETS
    }).done(function(data) {
      localStorage.setItem('f2w_dataset', JSON.stringify({
        timestamp: now,
        data: data
      }));
      return callback(data);
    }).fail(function() {
      debug.log('Could not obtain datasets');
    });
  };

ps.util = util;

} ( mediaWiki, primarySources ) );
