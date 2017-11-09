/**
 * Common module.
 * Contains functions used by both the main components:
 * item-based curation and filter.
 */
(function(mw, ps) {
    console.log("Primary sources tool - common module");
    
    // accessible object
    var common = {};
    
    var DEBUG = JSON.parse(localStorage.getItem('f2w_debug')) || false;
    localStorage.setItem('f2w_debug', true);

    var API_ENDPOINT = {};
    API_ENDPOINT.WIKIDATA_ENTITY_DATA_URL = 'https://www.wikidata.org/wiki/Special:EntityData/{{qid}}.json';
    API_ENDPOINT.FREEBASE_ENTITY_DATA_URL = 'https://tools.wmflabs.org/wikidata-primary-sources/entities/{{qid}}';
    API_ENDPOINT.FREEBASE_STATEMENT_APPROVAL_URL = 'https://tools.wmflabs.org/wikidata-primary-sources/statements/{{id}}' + '?state={{state}}&user={{user}}';
    API_ENDPOINT.FREEBASE_STATEMENT_SEARCH_URL = 'https://tools.wmflabs.org/wikidata-primary-sources/statements/all';
    API_ENDPOINT.FREEBASE_DATASETS = 'https://tools.wmflabs.org/wikidata-primary-sources/datasets/all';
    API_ENDPOINT.FREEBASE_SOURCE_URL_BLACKLIST = 'https://www.wikidata.org/w/api.php' + '?action=parse&format=json&prop=text' + '&page=Wikidata:Primary_sources_tool/URL_blacklist';
    API_ENDPOINT.FREEBASE_SOURCE_URL_WHITELIST = 'https://www.wikidata.org/w/api.php' + '?action=parse&format=json&prop=text' + '&page=Wikidata:Primary_sources_tool/URL_whitelist';

    var CACHE_EXPIRY = 60 * 60 * 1000;

    common.API_ENDPOINT = API_ENDPOINT;

    var dataset = null;
    mw.loader.using(['mediawiki.cookie']).then(function() {
        dataset = mw.cookie.get('ps-dataset', null, '');
    });

    common.dataset = dataset;

    common.debug = {
        log: function(message) {
            if (DEBUG) {
                console.log('PST: ' + message);
            }
        }
    };

    /**
   * Return a list of black listed source urls from
   * https://www.wikidata.org/wiki/Wikidata:Primary_sources_tool/URL_blacklist
   * saved in localStorage
   * @returns {*}
   */
    common.getBlacklistedSourceUrls = function getBlacklistedSourceUrls() {
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
        }).then(function(data) {
            if (data && data.parse && data.parse.text && data.parse.text['*']) {
                var blacklist = data.parse.text['*'].replace(/\n/g, '').replace(/^.*?<ul>(.*?)<\/ul>.*?$/g, '$1').replace(/<\/li>/g, '').split('<li>').slice(1).map(function(url) {
                    return url.trim();
                }).filter(function(url) {
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
    }

    /**
   *
   * @param blacklistedSourceUrls
   * @returns {Function}
   */
    common.isBlackListedBuilder = function isBlackListedBuilder(blacklistedSourceUrls) {
        return function(url) {
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
        }
        ;
    }

    /**
   *
   * @param callback
   * @returns {*}
   */
    common.getPossibleDatasets = function getPossibleDatasets(callback) {
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
        }).done(function(data) {
            localStorage.setItem('f2w_dataset', JSON.stringify({
                timestamp: now,
                data: data
            }));
            return callback(data);
        }).fail(function() {
            util.debug.log('Could not obtain datasets');
        });
    }

    // BEGIN: format data
    var valueHtmlCache = {};
    common.getValueHtml = function getValueHtml(value, property) {
        var cacheKey = property + '\t' + value;
        if (cacheKey in valueHtmlCache) {
            return valueHtmlCache[cacheKey];
        }
        var parsed = tsvValueToJson(value);
        var dataValue = {
            type: getValueTypeFromDataValueType(parsed.type),
            value: parsed.value
        };
        var options = {
            'lang': mw.language.getFallbackLanguageChain()[0] || 'en'
        };

        if (parsed.type === 'string') {
            // Link to external database
            valueHtmlCache[cacheKey] = getUrlFormatter(property).then(function(urlFormatter) {
                if (urlFormatter === '') {
                    return parsed.value;
                } else {
                    var url = urlFormatter.replace('$1', parsed.value);
                    return '<a rel="nofollow" class="external free" href="' + url + '">' + parsed.value + '</a>';
                }
            });
        } else if (parsed.type === 'url') {
            valueHtmlCache[cacheKey] = $.Deferred().resolve('<a rel="nofollow" class="external free" href="' + parsed.value + '">' + parsed.value + '</a>');
        } else if (parsed.type === 'wikibase-item' || parsed.type === 'wikibase-property') {
            return getEntityLabel(value).then(function(label) {
                return '<a href="/entity/' + value + '">' + label + '</a>';
                //TODO: better URL
            });
        } else {
            var api = new mw.Api();
            valueHtmlCache[cacheKey] = api.get({
                action: 'wbformatvalue',
                generate: 'text/html',
                datavalue: JSON.stringify(dataValue),
                datatype: parsed.type,
                options: JSON.stringify(options)
            }).then(function(result) {
                // Create links for geocoordinates
                if (parsed.type === 'globe-coordinate') {
                    var url = 'https://tools.wmflabs.org/geohack/geohack.php' + '?language=' + mw.config.get('wgUserLanguage') + '&params=' + dataValue.value.latitude + '_N_' + dataValue.value.longitude + '_E_globe:earth';
                    return '<a rel="nofollow" class="external free" href="' + url + '">' + result.result + '</a>';
                }

                return result.result;
            });
        }

        return valueHtmlCache[cacheKey];
    }
    // END: format data

    /* BEGIN: Wikibase API calls */
    // BEGIN: post approved claims to Wikidata
    // https://www.wikidata.org/w/api.php?action=help&modules=wbcreateclaim
    common.createClaim = function createClaim(subject, predicate, object, qualifiers) {
        var value = (tsvValueToJson(object)).value;
        var api = new mw.Api();
        return api.postWithToken('csrf', {
            action: 'wbcreateclaim',
            entity: subject,
            property: predicate,
            snaktype: 'value',
            value: JSON.stringify(value),
            summary: WIKIDATA_API_COMMENT
        }).then(function(data) {
            // We save the qualifiers sequentially in order to avoid edit conflict
            var saveQualifiers = function() {
                var qualifier = qualifiers.pop();
                if (qualifier === undefined) {
                    return data;
                }

                var value = (tsvValueToJson(qualifier.qualifierObject)).value;
                return api.postWithToken('csrf', {
                    action: 'wbsetqualifier',
                    claim: data.claim.id,
                    property: qualifier.qualifierProperty,
                    snaktype: 'value',
                    value: JSON.stringify(value),
                    summary: WIKIDATA_API_COMMENT
                }).then(saveQualifiers);
            };

            return saveQualifiers();
        });
    }
    // https://www.wikidata.org/w/api.php?action=help&modules=wbsetreference
    common.createReference = function createReference(subject, predicate, object, sourceSnaks, callback) {
        var api = new mw.Api();
        api.get({
            action: 'wbgetclaims',
            entity: subject,
            property: predicate
        }).then(function(data) {
            var index = -1;
            for (var i = 0, lenI = data.claims[predicate].length; i < lenI; i++) {
                var claimObject = data.claims[predicate][i];
                var mainSnak = claimObject.mainsnak;
                if (mainSnak.snaktype === 'value' && jsonToTsvValue(mainSnak.datavalue, mainSnak.datatype) === object) {
                    index = i;
                    break;
                }
            }
            return api.postWithToken('csrf', {
                action: 'wbsetreference',
                statement: data.claims[predicate][index].id,
                snaks: JSON.stringify(formatSourceForSave(sourceSnaks)),
                summary: WIKIDATA_API_COMMENT
            });
        }).done(function(data) {
            return callback(null, data);
        }).fail(function(error) {
            return callback(error);
        });
    }
    // combines the 2 functions above
    common.createClaimWithReference = function createClaimWithReference(subject, predicate, object, qualifiers, sourceSnaks) {
        var api = new mw.Api();
        return createClaim(subject, predicate, object, qualifiers).then(function(data) {
            return api.postWithToken('csrf', {
                action: 'wbsetreference',
                statement: data.claim.id,
                snaks: JSON.stringify(formatSourceForSave(sourceSnaks)),
                summary: WIKIDATA_API_COMMENT
            });
        });
    }
    // END: post approved claims to Wikidata

    // BEGIN: get existing claims from Wikidata
    // https://www.wikidata.org/w/api.php?action=help&modules=wbgetclaims
    common.getClaims = function getClaims(subject, predicate, callback) {
        var api = new mw.Api();
        api.get({
            action: 'wbgetclaims',
            entity: subject,
            property: predicate
        }).done(function(data) {
            return callback(null, data.claims[predicate] || []);
        }).fail(function(error) {
            return callback(error);
        });
    }
    // END:  get existing claims from Wikidata
    /* END: Wikibase API calls */

    // BEGIN: utilities
    common.isUrl = function isUrl(url) {
        if (typeof URL !== 'function') {
            return url.indexOf('http') === 0;
            // TODO: very bad fallback hack
        }

        try {
            url = new URL(url.toString());
            return url.protocol.indexOf('http') === 0 && url.host;
        } catch (e) {
            return false;
        }
    }
    common.reportError = function reportError(error) {
        mw.notify(error, {
            autoHide: false,
            tag: 'ps-error'
        });
    }
    common.jsonToTsvValue = function jsonToTsvValue(dataValue, dataType) {
      if (!dataValue.type) {
        debug.log('No data value type given');
        return dataValue.value;
      }
      switch (dataValue.type) {
      case 'quantity':
        return dataValue.value.amount;
      case 'time':
        var time = dataValue.value.time;

        // Normalize the timestamp
        if (dataValue.value.precision < 11) {
          time = time.replace('-01T', '-00T');
        }
        if (dataValue.value.precision < 10) {
          time = time.replace('-01-', '-00-');
        }

        return time + '/' + dataValue.value.precision;
      case 'globecoordinate':
        return '@' + dataValue.value.latitude + '/' + dataValue.value.longitude;
      case 'monolingualtext':
        return dataValue.value.language + ':' + JSON.stringify(dataValue.value.text);
      case 'string':
        var str = (dataType === 'url') ? normalizeUrl(dataValue.value)
                                       : dataValue.value;
        return JSON.stringify(str);
      case 'wikibase-entityid':
        switch (dataValue.value['entity-type']) {
          case 'item':
            return 'Q' + dataValue.value['numeric-id'];
          case 'property':
            return 'P' + dataValue.value['numeric-id'];
        }
      }
      debug.log('Unknown data value type ' + dataValue.type);
      return dataValue.value;
    }
    // END: utilities

    ps.common = common;

}(mediaWiki, primarySources));
