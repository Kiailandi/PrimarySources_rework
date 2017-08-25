(function(mw, $) {

    var PrimarySources = {};
    
    PrimarySources.template = {
        /*wb_qualifierHtml:   (mw.wbTemplates.store.values["wikibase-listview"]
                            .replace('$1', mw.wbTemplates.store.values["wikibase-snaklistview"]
                            .replace('$1', mw.wbTemplates.store.values["wikibase-snakview"]
                            .replace('$1', '{{qualifier-property-html}}')
                            .replace('$2', 'wikibase-snakview-variation-valuesnak')
                            .replace('$3', '{{qualifier-object}}'))))
                            .replace(/(?:\r\n|\r|\n)/g, ""),*/
        /*wb_qualifierHtml:   mw.wbTemplate("wikibase-listview", 
                            mw.wbTemplate("wikibase-snaklistview",
                            mw.wbTemplate("wikibase-snakview", 
                            '{{qualifier-property-html}}', 'wikibase-snakview-variation-valuesnak', '{{qualifier-object}}')))
                            [0].outerHTML.replace(/(?:\r\n|\r|\n)/g, ""),*/

        qualifierHtml:  mw.wbTemplate("wikibase-listview", 
                        mw.wbTemplate("wikibase-snaklistview",
                        mw.wbTemplate("wikibase-snakview", 
                        '{{qualifier-property-html}}', 'wikibase-snakview-variation-valuesnak', '{{qualifier-object}}')))
                        [0].outerHTML.replace(/(?:\r\n|\r|\n)/g, ""),

        /*wb_sourceHtml: (mw.wbTemplates.store.values["wikibase-toolbar-container"]
                    .replace('$1', mw.wbTemplates.store.values["wikibase-toolbar-item"]
                    .replace('$1', mw.wbTemplates.store.values["wikibase-toolbar-button"])))
                    .replace(/(?:\r\n|\r|\n)/g, ""), */                     
        sourceHtml:    /*(mw.wbTemplates.store.values["wikibase-referenceview"]
                        .replace('$1', 'listview-item wikibase-toolbar-item')
                        .replace('$2', mw.wbTemplates.store.values["wikibase-toolbar-container"]
                        .replace('$1', mw.wbTemplates.store.values["wikibase-toolbar-item"]
                        .replace('$1', mw.wbTemplates.store.values["wikibase-toolbar-button"]
                        .replace('$1', 'wikibase-toolbar-button-add')
                        .replace('$2', '#')
                        .replace('$3', 'approve reference')
                        .replace('$4', 'do something here')
                            .concat(mw.wbTemplates.store.values["wikibase-toolbar-button"]
                            .replace('$1', 'wikibase-toolbar-button-remove')
                            .replace('$2', '#')
                            .replace('$3', 'reject reference')
                            .replace('$4', 'do something here'))
                        ))))
                        .replace(/(?:\r\n|\r|\n)/g, ""),*/
                        mw.wbTemplate("wikibase-referenceview", 'listview-item wikibase-toolbar-item', 
                        mw.wbTemplate("wikibase-toolbar-container", 
                        mw.wbTemplate("wikibase-toolbar-button", "wikibase-toolbar-button-add")
                    ),"source")
                    [0].outerHTML.replace(/(?:\r\n|\r|\n)/g, ""),  
        /*wb_sourceItemHtml: (mw.wbTemplates.store.values["wikibase-snakview"]
                            .replace('$1', "{{source-property-html}}")
                            .replace('$2', "wikibase-snakview-variation-valuesnak")
                            .replace('$3', "{{source-object}}"))
                            .replace(/(?:\r\n|\r|\n)/g, ""),*/
        sourceItemHtml:    (mw.wbTemplates.store.values["wikibase-snakview"]
                            .replace('$1', "{{source-property-html}}")
                            .replace('$2', "wikibase-snakview-variation-valuesnak")
                            .replace('$3', '<div class="valueview valueview-instaticmode" aria-disabled="false">{{source-object}}</div>'))
                            .replace(/(?:\r\n|\r|\n)/g, ""),
        /*wb_statementViewHtml:  (mw.wbTemplates.store.values["wikibase-statementview"]
                            .replace('$1', "")
                            .replace('$2', "normal wikibase-toolbar-item")
                            .replace('$3', mw.wbTemplates.store.values["wikibase-rankselector"]
                                .replace('$1', "ui-state-disabled")
                                .replace('$2', "wikibase-rankselector-normal")
                                .replace('$3', "Normal rank"))
                            .replace('$4', mw.wbTemplates.store.values["wikibase-snakview"]
                                .replace('$1', "")
                                .replace('$2', "wikibase-snakview-variation-valuesnak")
                                .replace('$3', '<a title="Q6256" href="/wiki/Q6256">country</a>'))
                            .replace('$5', "")
                            .replace('$6', mw.wbTemplates.store.values["wikibase-toolbar-container"]
                                .replace('$1', mw.wbTemplates.store.values["wikibase-toolbar-container"]
                                    .replace('$1', mw.wbTemplates.store.values["wikibase-toolbar-button"]
                                        .replace('$1', "wikibase-toolbar-button-edit")
                                        .replace('$2', "#")
                                        .replace('$3', "edit")
                                        .replace('$4', ""))))
                            .replace('$7', '<a class="ui-toggler ui-toggler-toggle ui-state-default">' +
                                           '<span class="ui-toggler-icon ui-icon ui-icon-triangle-1-s">' +
                                           '</span>' +
                                           '<span class="ui-toggler-label">' +
                                           '0 references' +
                                           '</span>' +
                                           '</a>')
                            .replace('$8', '<div class="wikibase-addtoolbar wikibase-toolbar-item wikibase-toolbar wikibase-addtoolbar-container wikibase-toolbar-container">' +
                                           '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-add">' +
                                           '<a href="#" title="">' +
                                           '<span class="wb-icon">' +
                                           '</span>' +
                                           'add reference' +
                                           '</a>' +
                                           '</span>' +
                                           '</div>')
                            .replace('$9', ""))
                            .replace(/(?:\r\n|\r|\n)/g, "")
                            .replace(' wikibase-statement-', ""),*/
        ps_statementViewHtml: "",
        /*wb_mainHtml: (mw.wbTemplates.store.values["wikibase-statementgroupview"]
                    .replace('$1', "{{property-html}}")
                    .replace('$2', mw.wbTemplates.store.values["wikibase-statementlistview"]
                        .replace('$1', "{{statement-views}}"
                                    .concat(mw.wbTemplates.store.values["wikibase-toolbar-container"]
                                        .replace('$1', "")
                                        .concat(mw.wbTemplates.store.values["wikibase-toolbar-wrapper"])
                                            .replace('$1', mw.wbTemplates.store.values["wikibase-toolbar-item"]
                                                .replace('$1', mw.wbTemplates.store.values["wikibase-toolbar-button"]
                                                    .replace('$1', "wikibase-toolbar-button-add")
                                                    .replace('$2', "#")
                                                    .replace('$3', "add")
                                                    .replace('$4', "Add a new value")))))
                        .replace('$2', ""))
                    .replace('$3', ""))
                    .replace(/(?:\r\n|\r|\n)/g, ""),*/
        ps_mainHtml: ""
        
    },
    
    PrimarySources.addNewClass = function (DOMitem, itemType){
        
        if(itemType === "property"){
            $(DOMitem).children().first().addClass('new-property');
        }
        else
            if(itemType === "source"){
                DOMitem.addClass('new-source');
                DOMitem.children().first().addClass('new-source');        
            }
            else
                if (itemType === "statementView"){
                    DOMitem.addClass('new-object');
                }
        return DOMitem;
    }

    mw.PrimarySources = PrimarySources;
    
}( mediaWiki, jQuery ) );
