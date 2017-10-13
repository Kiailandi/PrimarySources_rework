( function (mw, ps) {
    console.log("PrimarySources - util");

    var DEBUG = JSON.parse(localStorage.getItem('f2w_debug')) || false;
    localStorage.setItem('f2w_debug', true);

    var API_ENDPOINT = {};
    API_ENDPOINT.WIKIDATA_ENTITY_DATA_URL =
        'https://www.wikidata.org/wiki/Special:EntityData/{{qid}}.json';
    API_ENDPOINT.FREEBASE_ENTITY_DATA_URL =
        'https://tools.wmflabs.org/wikidata-primary-sources/entities/{{qid}}';
    API_ENDPOINT.FREEBASE_STATEMENT_APPROVAL_URL =
        'https://tools.wmflabs.org/wikidata-primary-sources/statements/{{id}}' +
        '?state={{state}}&user={{user}}';
    API_ENDPOINT.FREEBASE_STATEMENT_SEARCH_URL =
        'https://tools.wmflabs.org/wikidata-primary-sources/statements/all';
    API_ENDPOINT.FREEBASE_DATASETS =
        'https://tools.wmflabs.org/wikidata-primary-sources/datasets/all';
    API_ENDPOINT.FREEBASE_SOURCE_URL_BLACKLIST = 'https://www.wikidata.org/w/api.php' +
        '?action=parse&format=json&prop=text' +
        '&page=Wikidata:Primary_sources_tool/URL_blacklist';
    API_ENDPOINT.FREEBASE_SOURCE_URL_WHITELIST = 'https://www.wikidata.org/w/api.php' +
        '?action=parse&format=json&prop=text' +
        '&page=Wikidata:Primary_sources_tool/URL_whitelist';

    var CACHE_EXPIRY = 60 * 60 * 1000;

    // accessible object
    var util = {};

    util.API_ENDPOINT = API_ENDPOINT;

    var dataset = null;
    mw.loader.using([
        'mediawiki.cookie']
    ).then(function () {
        dataset = mw.cookie.get('ps-dataset', null, '');
    });

    util.dataset = dataset;

    util.debug = {
        log: function(message) {
            if (DEBUG) {
                console.log('F2W: ' + message);
            }
        }
    };

    /**
     * Return a list of black listed source urls from
     * https://www.wikidata.org/wiki/Wikidata:Primary_sources_tool/URL_blacklist
     * saved in localStorage
     * @returns {*}
     */
    util.getBlacklistedSourceUrls = function getBlacklistedSourceUrls() {
        var now = Date.now();
        if (localStorage.getItem('f2w_blacklist')) {
            var blacklist = JSON.parse(localStorage.getItem('f2w_blacklist'));
            if (!blacklist.timestamp) {
                blacklist.timestamp = 0;
            }
            if (now - blacklist.timestamp < CACHE_EXPIRY) {
                util.debug.log('Using cached source URL blacklist');
                return $.Deferred().resolve(blacklist.data);
            }
        }
        return $.ajax({
            url: util.API_ENDPOINT.FREEBASE_SOURCE_URL_BLACKLIST,
            data: {
                origin: '*'
            }
        }).then(function (data) {
            if (data && data.parse && data.parse.text && data.parse.text['*']) {
                var blacklist = data.parse.text['*']
                    .replace(/\n/g, '')
                    .replace(/^.*?<ul>(.*?)<\/ul>.*?$/g, '$1')
                    .replace(/<\/li>/g, '')
                    .split('<li>').slice(1)
                    .map(function (url) {
                        return url.trim();
                    })
                    .filter(function (url) {
                        var copy = url;

                        if (/\s/g.test(copy) || !/\./g.test(copy)) {
                            return false;
                        }
                        if (!/^https?:\/\//.test(copy)) {
                            copy = 'http://' + url;
                        }
                        try {
                            var newUrl = new URL(copy);
                            var resul = newUrl.host !== '';
                            return resul;
                        } catch (e) {
                            console.log("ERROR");
                            console.log(e);
                            return false;
                        }
                    });
                util.debug.log('Caching source URL blacklist');
                util.debug.log(' -- -- -- ');

                localStorage.setItem('f2w_blacklist', JSON.stringify({
                    timestamp: now,
                    data: blacklist
                }));
                return blacklist;
            } else {
                // Fail silently
                util.debug.log('Could not obtain blacklisted source URLs');
                return [];
            }
        });
    };

    /**
     *
     * @param blacklistedSourceUrls
     * @returns {Function}
     */
    util.isBlackListedBuilder = function isBlackListedBuilder(blacklistedSourceUrls) {
        return function (url) {
            try {
                var url = new URL(url);
            } catch (e) {
                return false;
            }

            for (var i in blacklistedSourceUrls) {
                if (url.host.indexOf(blacklistedSourceUrls[i]) !== -1) {
                    return true;
                }
            }
            return false;
        };
    };


    /**
     *
     * @param callback
     * @returns {*}
     */
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
            url: util.API_ENDPOINT.FREEBASE_DATASETS,
            data: {
                origin: '*'
            }
        }).done(function (data) {
            localStorage.setItem('f2w_dataset', JSON.stringify({
                timestamp: now,
                data: data
            }));
            return callback(data);
        }).fail(function () {
            util.debug.log('Could not obtain datasets');
        });
    };

    ps.util = util;

}(mediaWiki, primarySources) );
