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

    function computeCoordinatesPrecision(latitude, longitude) {
        return Math.min(
            Math.pow(10, -numberOfDecimalDigits(latitude)),
            Math.pow(10, -numberOfDecimalDigits(longitude))
        );
    }

    // "http://research.google.com/pubs/vrandecic.html"
    function isUrl(url) {
        if (typeof URL !== 'function') {
            return url.indexOf('http') === 0; // TODO: very bad fallback hack
        }

        try {
            url = new URL(url.toString());
            return url.protocol.indexOf('http') === 0 && url.host;
        } catch (e) {
            return false;
        }
    }

    function normalizeUrl(url) {
        try {
            return (new URL(url.toString())).href;
        } catch (e) {
            return url;
        }
    }

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


    util.debug = {
        log: function(message) {
            if (DEBUG) {
                console.log('F2W: ' + message);
            }
        }
    };

    util.tsvValueToJson = function tsvValueToJson(value) {
        // From https://www.wikidata.org/wiki/Special:ListDatatypes and
        // https://de.wikipedia.org/wiki/Wikipedia:Wikidata/Wikidata_Spielwiese
        // https://www.wikidata.org/wiki/Special:EntityData/Q90.json

        // Q1
        var itemRegEx = /^Q\d+$/;

        // P1
        var propertyRegEx = /^P\d+$/;

        // @43.3111/-16.6655
        var coordinatesRegEx = /^@([+\-]?\d+(?:.\d+)?)\/([+\-]?\d+(?:.\d+))?$/;

        // fr:"Les Misérables"
        var languageStringRegEx = /^(\w+):("[^"\\]*(?:\\.[^"\\]*)*")$/;

        // +2013-01-01T00:00:00Z/10
        /* jshint maxlen: false */
        var timeRegEx = /^[+-]\d+-\d\d-\d\dT\d\d:\d\d:\d\dZ\/\d+$/;
        /* jshint maxlen: 80 */

        // +/-1234.4567
        var quantityRegEx = /^[+-]\d+(\.\d+)?$/;

        if (itemRegEx.test(value)) {
            return {
                type: 'wikibase-item',
                value: {
                    'entity-type': 'item',
                    'numeric-id': parseInt(value.replace(/^Q/, ''))
                }
            };
        } else if (propertyRegEx.test(value)) {
            return {
                type: 'wikibase-property',
                value: {
                    'entity-type': 'property',
                    'numeric-id': parseInt(value.replace(/^P/, ''))
                }
            };
        } else if (coordinatesRegEx.test(value)) {
            var latitude = value.replace(coordinatesRegEx, '$1');
            var longitude = value.replace(coordinatesRegEx, '$2');
            return {
                type: 'globe-coordinate',
                value: {
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    altitude: null,
                    precision: computeCoordinatesPrecision(latitude, longitude),
                    globe: 'http://www.wikidata.org/entity/Q2'
                }
            };
        } else if (languageStringRegEx.test(value)) {
            return {
                type: 'monolingualtext',
                value: {
                    language: value.replace(languageStringRegEx, '$1'),
                    text: JSON.parse(value.replace(languageStringRegEx, '$2'))
                }
            };
        } else if (timeRegEx.test(value)) {
            var parts = value.split('/');
            return {
                type: 'time',
                value: {
                    time: parts[0],
                    timezone: 0,
                    before: 0,
                    after: 0,
                    precision: parseInt(parts[1]),
                    calendarmodel: 'http://www.wikidata.org/entity/Q1985727'
                }
            };
        } else if (quantityRegEx.test(value)) {
            return {
                type: 'quantity',
                value: {
                    amount: value,
                    unit: '1'
                }
            };
        } else {
            try {
                value = JSON.parse(value);
            } catch(e) { //If it is an invalid JSON we assume it is the value
                if (!(e instanceof SyntaxError)) {
                    throw e;
                }
            }
            if (isUrl(value)) {
                return {
                    type: 'url',
                    value: normalizeUrl(value)
                };
            } else {
                return {
                    type: 'string',
                    value: value
                };
            }
        }
    };

    var entityLabelCache = {};
    function getEntityLabel(entityId) {
        if(!(entityId in entityLabelCache)) {
            loadEntityLabels([entityId]);
        }

        return entityLabelCache[entityId];
    }

    function getEntityLabels(entityIds) {
        //Split entityIds per bucket in order to match limits
        var buckets = [];
        var currentBucket = [];

        entityIds.forEach(function(entityId) {
            currentBucket.push(entityId);
            if(currentBucket.length > 40) {
                buckets.push(currentBucket);
                currentBucket = [];
            }
        });
        buckets.push(currentBucket);

        var promises = buckets.map(function(bucket) {
            return getFewEntityLabels(bucket);
        });

        return $.when.apply(this, promises).then(function() {
            return $.extend.apply(this, arguments);
        });
    }

    function getFewEntityLabels(entityIds) {
        if (entityIds.length === 0) {
            return $.Deferred().resolve({});
        }
        var api = new mw.Api();
        var language = mw.config.get('wgUserLanguage');
        return api.get({
            action: 'wbgetentities',
            ids: entityIds.join('|'),
            props: 'labels',
            languages: language,
            languagefallback: true
        }).then(function(data) {
            var labels = {};
            for (var id in data.entities) {
                var entity = data.entities[id];
                if (entity.labels && entity.labels[language]) {
                    labels[id] = entity.labels[language].value;
                } else {
                    labels[id] = entity.id;
                }
            }
            return labels;
        });
    }

    function extractEntityIdsFromStatement(statement) {
        function isEntityId(str) {
            return /^[PQ]\d+$/.test(str);
        }

        var entityIds = [statement.subject, statement.predicate];

        if (isEntityId(statement.object)) {
            entityIds.push(statement.object);
        }

        statement.qualifiers.forEach(function(qualifier) {
            entityIds.push(qualifier.qualifierProperty);
            if(isEntityId(qualifier.qualifierObject)) {
                entityIds.push(qualifier.qualifierObject);
            }
        });

        statement.source.forEach(function(snak) {
            entityIds.push(snak.sourceProperty);
            if(isEntityId(snak.sourceObject)) {
                entityIds.push(snak.sourceObject);
            }
        });

        return entityIds;
    }

    function loadEntityLabels(entityIds) {
        entityIds = entityIds.filter(function(entityId) {
            return !(entityId in entityLabelCache);
        });
        if(entityIds.length === 0) {
            return;
        }

        var promise = getEntityLabels(entityIds);
        entityIds.forEach(function(entityId) {
            entityLabelCache[entityId] = promise.then(function(labels) {
                return labels[entityId];
            });
        });
    }

    /**
     *
     * @param statements
     */
    util.preloadEntityLabels = function preloadEntityLabels(statements) {
        var entityIds = [];
        statements.forEach(function(statement) {
            entityIds = entityIds.concat(extractEntityIdsFromStatement(statement));
        });
        loadEntityLabels(entityIds);
    };

    function getValueTypeFromDataValueType(dataValueType) {
        return wikibase.dataTypeStore.getDataType(dataValueType)
            .getDataValueType();
    }

    var urlFormatterCache = {};
    function getUrlFormatter(property) {
        if (property in urlFormatterCache) {
            return urlFormatterCache[property];
        }

        var api = new mw.Api();
        urlFormatterCache[property] = api.get({
            action: 'wbgetentities',
            ids: property,
            props: 'claims'
        }).then(function(result) {
            var urlFormatter = '';
            $.each(result.entities, function(_, entity) {
                if (entity.claims && 'P1630' in entity.claims) {
                    urlFormatter = entity.claims.P1630[0].mainsnak.datavalue.value;
                }
            });
            return urlFormatter;
        });
        return urlFormatterCache[property];
    }

    var valueHtmlCache = {};
    util.getValueHtml = function (value, property) {
        var cacheKey = property + '\t' + value;
        if (cacheKey in valueHtmlCache) {
            return valueHtmlCache[cacheKey];
        }
        var parsed = util.tsvValueToJson(value);
        var dataValue = {
            type: getValueTypeFromDataValueType(parsed.type),
            value: parsed.value
        };
        var options = {
            'lang': mw.language.getFallbackLanguageChain()[0] || 'en'
        };

        if (parsed.type === 'string') { // Link to external database
            valueHtmlCache[cacheKey] = getUrlFormatter(property)
                .then(function(urlFormatter) {
                    if (urlFormatter === '') {
                        return parsed.value;
                    } else {
                        var url = urlFormatter.replace('$1', parsed.value);
                        return '<a rel="nofollow" class="external free" href="' + url + '">' +
                            parsed.value + '</a>';
                    }
                });
        } else if (parsed.type === 'url') {
            valueHtmlCache[cacheKey] = $.Deferred().resolve(
                '<a rel="nofollow" class="external free" href="' + parsed.value + '">' + parsed.value + '</a>'
            );
        } else if(parsed.type === 'wikibase-item' || parsed.type === 'wikibase-property') {
            return getEntityLabel(value).then(function(label) {
                return '<a href="/entity/' + value + '">' + label + '</a>'; //TODO: better URL
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
                    var url = 'https://tools.wmflabs.org/geohack/geohack.php' +
                        '?language=' + mw.config.get('wgUserLanguage') + '&params=' +
                        dataValue.value.latitude + '_N_' +
                        dataValue.value.longitude + '_E_globe:earth';
                    return '<a rel="nofollow" class="external free" href="' + url + '">' +
                        result.result + '</a>';
                }

                return result.result;
            });
        }

        return valueHtmlCache[cacheKey];
    };

    ps.util = util;

}(mediaWiki, primarySources) );
