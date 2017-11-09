/**
 * Base library for PrimarySources.
 *
 * Exposed globally as `primarySources` with `ps` as shortcut.
 *
 * @class ps
 * @alternateClassName primarySources
 * @singleton
 */
( function ( mw, $ ) {

    console.log("PrimarySources - init");

    var primarySources = {};

    mw.loader.load([
  'jquery.tipsy',
  'oojs-ui',
  'wikibase.dataTypeStore',
  'mediawiki.cookie']
  );

    // Attach to window and globally
    window.primarySources = window.ps = primarySources;

} ( mediaWiki, jQuery ) );