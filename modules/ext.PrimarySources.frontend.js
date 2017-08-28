(function(mw, $) {


    (function extendWbTemplates (){
        mw.wbTemplates.store.values["primarysources-referenceview"] = "<div class=\"wikibase-referenceview $1\">\n<div class=\"wikibase-referenceview-heading $4\">$3</div>\n<div class=\"wikibase-referenceview-listview\">$2</div>\n</div>";
        mw.wbTemplates.store.values["primarysources-toolbar-button"] = "<span class=\"$3 wikibase-toolbar-item wikibase-toolbar-button $1\"><a class=\"$4\" href=\"#\" data-statement-id=\"$5\" data-property=\"$6\" data-object=\"$7\" data-sources=\"$8\" data-qualifiers=\"$9\"><span class=\"wb-icon\"></span>$2</a></span>";
        mw.wbTemplates.store.values["primarysources-statementgroupview"] = "<div class=\"wikibase-statementgroupview listview-item\" id=\"$3\">\n<div class=\"wikibase-statementgroupview-property new-property\">\n<div class=\"wikibase-statementgroupview-property-label\" dir=\"auto\">$1</div>\n</div>\n$2\n</div>"
        mw.wbTemplates.store.values["primarysources-statementlistview"] = "<div class=\"wikibase-statementlistview wikibase-toolbar-item\">\n<div class=\"wikibase-statementlistview-listview\">\n$1\n</div>\n$2\n</div>"
        mw.wbTemplates.store.values["primarysources-statementview"] = "<div class=\"wikibase-statementview wb-$1 $2\">\n<div class=\"wikibase-statementview-rankselector\">$3</div>\n<div class=\"wikibase-statementview-mainsnak-container\">\n<div class=\"wikibase-statementview-mainsnak\" dir=\"auto\">$4</div>\n<div class=\"wikibase-statementview-qualifiers\">$5</div>\n</div>\n$6\n<div class=\"wikibase-statementview-references-container\">\n<div class=\"wikibase-statementview-references-heading\">$7</div>\n<div class=\"wikibase-statementview-references $9\">$8</div>\n</div>\n</div>",
        mw.wbTemplates.store.values["primarysources-toolbar-container"] = "<span class=\"wikibase-toolbar-container $1\">$2</span>",
        mw.wbTemplates.store.values["primarysources-ui-toggler"] = "<a class=\"ui-toggler ui-toggler-toggle ui-state-default\"><span class=\"ui-toggler-icon ui-icon ui-icon-triangle-1-s\"></span><span class=\"ui-toggler-label\">$1</span></a>"
    })();

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
                                    '{{qualifier-property-html}}', 
                                    'wikibase-snakview-variation-valuesnak', 
                                    '{{qualifier-object}}'
                                )
                            )
                        )
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
                        mw.wbTemplate("primarysources-referenceview", 
                            'new-source', 
                            mw.wbTemplate("wikibase-toolbar",
                                "wikibase-edittoolbar-container wikibase-toolbar-container",
                                mw.wbTemplate("wikibase-toolbar",
                                    "wikibase-toolbar-container",
                                    mw.wbTemplate("primarysources-toolbar-button",
                                        "wikibase-toolbar-button-add",
                                        "approve reference",
                                        "wikibase-toolbarbutton",
                                        "f2w-button f2w-source f2w-approve",
                                        "{{statement-id}}",
                                        "{{data-property}}",
                                        "{{data-object}}",
                                        "{{data-source}}",
                                        "{{data-qualifiers}}"
                                    )
                                ).add(
                                mw.wbTemplate("wikibase-toolbar",
                                    "wikibase-toolbar-container",
                                    mw.wbTemplate("primarysources-toolbar-button",
                                        "wikibase-toolbar-button-edit",
                                        "edit reference",
                                        "wikibase-toolbarbutton",
                                        "f2w-button f2w-source f2w-edit",
                                        "{{statement-id}}",
                                        "{{data-property}}",
                                        "{{data-object}}",
                                        "{{data-source}}",
                                        "{{data-qualifiers}}"
                                    )
                                ).add(
                                mw.wbTemplate("wikibase-toolbar",
                                    "wikibase-toolbar-container",
                                    mw.wbTemplate("primarysources-toolbar-button",
                                        "wikibase-toolbar-button-remove",
                                        "reject reference",
                                        "wikibase-toolbarbutton",
                                        "f2w-button f2w-source f2w-reject",
                                        "{{statement-id}}",
                                        "{{data-property}}",
                                        "{{data-object}}",
                                        "{{data-source}}",
                                        "{{data-qualifiers}}"
                                    )
                                )))
                            ),
                            mw.wbTemplate("wikibase-snaklistview", "{{source-html}}"),
                            "new-source"
                        )
                        [0].outerHTML.replace(/(?:\r\n|\r|\n)/g, ""),  
        /*wb_sourceItemHtml: (mw.wbTemplates.store.values["wikibase-snakview"]
                            .replace('$1', "{{source-property-html}}")
                            .replace('$2', "wikibase-snakview-variation-valuesnak")
                            .replace('$3', "{{source-object}}"))
                            .replace(/(?:\r\n|\r|\n)/g, ""),*/
        sourceItemHtml:     /*(mw.wbTemplates.store.values["wikibase-snakview"]
                            .replace('$1', "{{source-property-html}}")
                            .replace('$2', "wikibase-snakview-variation-valuesnak")
                            .replace('$3', '<div class="valueview valueview-instaticmode" aria-disabled="false">{{source-object}}</div>'))
                            .replace(/(?:\r\n|\r|\n)/g, ""),*/
                        mw.wbTemplate("wikibase-snakview",
                            "{{source-property-html}}",
                            "wikibase-snakview-variation-valuesnak",
                            "{{source-object}}")
                        [0].outerHTML.replace(/(?:\r\n|\r|\n)/g, ""),  
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
        statementViewHtml:  mw.wbTemplate("primarysources-statementview",
                                "normal",
                                "listview-item wikibase-toolbar-item new-object",
                                mw.wbTemplate("wikibase-rankselector",
                                    "ui-state-disabled",
                                    "wikibase-rankselector-normal",
                                    "Normal rank"
                                ),
                                mw.wbTemplate("wikibase-snakview",
                                    "{{property-html}}",
                                    "wikibase-snakview-variation-valuesnak",
                                    "{{object}}"
                                ),
                                "{{qualifiers}}",
                                mw.wbTemplate("primarysources-toolbar-container",
                                    "wikibase-edittoolbar-container",
                                    mw.wbTemplate("wikibase-toolbar",
                                        "wikibase-toolbar-container",
                                        mw.wbTemplate("primarysources-toolbar-button",
                                            "wikibase-toolbar-button-add",
                                            "approve claim",
                                            "wikibase-toolbarbutton",
                                            "f2w-button f2w-property f2w-approve",
                                            "{{statement-id}}",
                                            "{{data-property}}",
                                            "{{data-object}}",
                                            "{{data-sources}}",
                                            "{{data-qualifiers}}"
                                        )
                                    ).add(
                                    mw.wbTemplate("wikibase-toolbar",
                                        "wikibase-toolbar-container",
                                        mw.wbTemplate("primarysources-toolbar-button",
                                            "wikibase-toolbar-button-edit",
                                            "edit claim",
                                            "wikibase-toolbarbutton",
                                            "f2w-button f2w-property f2w-edit",
                                            "{{statement-id}}",
                                            "{{data-property}}",
                                            "{{data-object}}",
                                            "{{data-sources}}",
                                            "{{data-qualifiers}}"
                                        )
                                    ).add(
                                    mw.wbTemplate("wikibase-toolbar",
                                        "wikibase-toolbar-container",
                                        mw.wbTemplate("primarysources-toolbar-button",
                                            "wikibase-toolbar-button-remove",
                                            "reject claim",
                                            "wikibase-toolbarbutton",
                                            "f2w-button f2w-property f2w-reject",
                                            "{{statement-id}}",
                                            "{{data-property}}",
                                            "{{data-object}}",
                                            "{{data-sources}}",
                                            "{{data-qualifiers}}"
                                        )
                                    )))
                                ),
                                mw.wbTemplate("primarysources-ui-toggler", "{{references}}"),
                                mw.wbTemplate("wikibase-listview","{{sources}}")
                                    .add(
                                    mw.wbTemplate("primarysources-toolbar-container",
                                        "wikibase-addtoolbar wikibase-toolbar-item wikibase-toolbar wikibase-addtoolbar-container",
                                        mw.wbTemplate("wikibase-toolbar-button",
                                            "wikibase-toolbarbutton wikibase-toolbar-button-add",
                                            "#",
                                            "add reference",
                                            "")
                                    )),
                                "wikibase-toolbar-item"
                            )
                            [0].outerHTML.replace(/(?:\r\n|\r|\n)/g, ""),
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
        mainHtml: mw.wbTemplate("primarysources-statementgroupview",
                        "{{property-html}}",
                        mw.wbTemplate("primarysources-statementlistview", 
                            "{{statement-views}}",
                            mw.wbTemplate("wikibase-toolbar-container", "")),
                        "{{property}}")
                    [0].outerHTML.replace(/(?:\r\n|\r|\n)/g, "")        
    },
    
    mw.PrimarySources = PrimarySources;
    
}( mediaWiki, jQuery ) );
