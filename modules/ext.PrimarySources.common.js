/**
 * Common module.
 * Contains functions used by both the main components:
 * item-based curation and filter.
 */
(function(mw, ps) {
    console.log("PrimarySources - common");

    // accessible object
    var common = {};

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
        return url.indexOf('http') === 0; // TODO: very bad fallback hack
      }

      try {
        url = new URL(url.toString());
        return url.protocol.indexOf('http') === 0 && url.host;
      } catch (e) {
        return false;
      }
    }
    common.reportError = function reportError(error) {
      mw.notify(
        error,
        {autoHide: false, tag: 'ps-error'}
      );
    }
    // END: utilities
    
    ps.common = common;

}(mediaWiki, primarySources));
