(function(mw, $) {
    console.log("Primary sources tool - HTML templates");

    (function extendWbTemplates (){
        mw.wbTemplates.store.values["primarysources-referenceview"] = "<div class=\"wikibase-referenceview $1\">\n<div class=\"wikibase-referenceview-heading $4\">$3</div>\n<div class=\"wikibase-referenceview-listview\">$2</div>\n</div>";
        mw.wbTemplates.store.values["primarysources-toolbar-button"] = "<span class=\"$3 wikibase-toolbar-item wikibase-toolbar-button $1\"><a class=\"$4\" href=\"#\" data-statement-id=\"$5\" data-dataset=\"$6\" data-property=\"$7\" data-object=\"$8\" data-sources=\"$9\" data-qualifiers=\"$10\"><span class=\"wb-icon\"></span>$2</a></span>";
        mw.wbTemplates.store.values["primarysources-statementgroupview"] = "<div class=\"wikibase-statementgroupview listview-item\" id=\"$3\">\n<div class=\"wikibase-statementgroupview-property new-property\">\n<div class=\"wikibase-statementgroupview-property-label\" dir=\"auto\">$1</div>\n</div>\n$2\n</div>";
        mw.wbTemplates.store.values["primarysources-statementlistview"] = "<div class=\"wikibase-statementlistview wikibase-toolbar-item\">\n<div class=\"wikibase-statementlistview-listview\">\n$1\n</div>\n$2\n</div>";
        mw.wbTemplates.store.values["primarysources-statementview"] = "<div class=\"wikibase-statementview wb-$1 $2\">\n<div class=\"wikibase-statementview-rankselector\">$3</div>\n<div class=\"wikibase-statementview-mainsnak-container\">\n<div class=\"wikibase-statementview-mainsnak\" dir=\"auto\">$4</div>\n<div class=\"wikibase-statementview-qualifiers\">$5</div>\n</div>\n$6\n<div class=\"wikibase-statementview-references-container\">\n<div class=\"wikibase-statementview-references-heading\">$7</div>\n<div class=\"wikibase-statementview-references $9\">$8</div>\n</div>\n</div>";
        mw.wbTemplates.store.values["primarysources-toolbar-container"] = "<span class=\"wikibase-toolbar-container $1\">$2</span>";
        mw.wbTemplates.store.values["primarysources-ui-toggler"] = "<a class=\"ui-toggler ui-toggler-toggle ui-state-default\"><span class=\"ui-toggler-icon ui-icon ui-icon-triangle-1-s\"></span><span class=\"ui-toggler-label\">$1</span></a>";
    })();

    var ps = {};
    
    ps.templates = {
        qualifierHtml:  
            mw.wbTemplate("wikibase-listview", 
                mw.wbTemplate("wikibase-snaklistview",
                    mw.wbTemplate("wikibase-snakview", 
                        '{{qualifier-property-html}}', 
                        'wikibase-snakview-variation-valuesnak', 
                        '{{qualifier-object}}'
                    )
                )
            )
            [0].outerHTML.replace(/(?:\r\n|\r|\n)/g, ""),
                        
        sourceHtml:     
            mw.wbTemplate("primarysources-referenceview", 
                'new-source', 
                mw.wbTemplate("wikibase-toolbar",
                    "wikibase-edittoolbar-container wikibase-toolbar-container",
                    mw.wbTemplate("wikibase-toolbar",
                        "wikibase-toolbar-container",
                        mw.wbTemplate("primarysources-toolbar-button",
                            "wikibase-toolbar-button-add",
                            "approve",
                            "wikibase-toolbarbutton",
                            "f2w-button f2w-source f2w-approve",
                            "{{statement-id}}",
                            "{{data-dataset}}",
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
                            "edit",
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
                            "reject",
                            "wikibase-toolbarbutton",
                            "f2w-button f2w-source f2w-reject",
                            "{{statement-id}}",
                            "{{data-dataset}}",
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
        
        sourceItemHtml: 
            mw.wbTemplate("wikibase-snakview",
                "{{source-property-html}}",
                "wikibase-snakview-variation-valuesnak",
                "{{source-object}}")
            [0].outerHTML.replace(/(?:\r\n|\r|\n)/g, ""),  
        
        statementViewHtml:  
            mw.wbTemplate("primarysources-statementview",
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
                        "wikibase-toolbar-container"
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
                        "wikibase-toolbar-container"
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
        
        mainHtml: 
            mw.wbTemplate("primarysources-statementgroupview",
                "{{property-html}}",
                mw.wbTemplate("primarysources-statementlistview", 
                    "{{statement-views}}",
                    mw.wbTemplate("wikibase-toolbar-container", "")),
                "{{property}}")
            [0].outerHTML.replace(/(?:\r\n|\r|\n)/g, "")        
    };
    
    mw.ps = ps;
    
}( mediaWiki, jQuery ) );
