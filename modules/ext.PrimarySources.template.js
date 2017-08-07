(function(mw, $) {

    var PrimarySources = {};
    
    PrimarySources.HTML_TEMPLATES = {
        qualifierHtml:  mw.wbTemplate("wikibase-listview", 
        mw.wbTemplate("wikibase-snaklistview",
        mw.wbTemplate("wikibase-snakview", 
        '{{qualifier-property-html}}', 'wikibase-snakview-variation-valuesnak', '{{qualifier-object}}').addClass("listview-item")).addClass("listview-item"))
        [0].outerHTML.replace(/(?:\r\n|\r|\n)/g, ""),

    };


    mw.PrimarySources = PrimarySources;

}( mediaWiki, jQuery ) );
