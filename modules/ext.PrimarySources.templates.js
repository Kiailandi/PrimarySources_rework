(function(mw, $) {
    console.log("Primary sources tool - HTML templates");
    
    //FIXME
    /*mw.wbTemplates = mw.wbTemplates || {};
    mw.wbTemplates.store = mw.wbTemplates.store || {};
    mw.wbTemplates.store.values = mw.wbTemplates.store.values || {};
    */
   
    /*mw.wbTemplates.store.values["primarysources-referenceview"] = "<div class=\"wikibase-referenceview $1\">\n<div class=\"wikibase-referenceview-heading $4\">$3</div>\n<div class=\"wikibase-referenceview-listview\">$2</div>\n</div>";
    mw.wbTemplates.store.values["primarysources-toolbar-button"] = "<span class=\"$3 wikibase-toolbar-item wikibase-toolbar-button $1\"><a class=\"$4\" href=\"#\" data-statement-id=\"$5\" data-dataset=\"$6\" data-property=\"$7\" data-object=\"$8\" data-sources=\"$9\" data-qualifiers=\"$10\"><span class=\"wb-icon\"></span>$2</a></span>";
    mw.wbTemplates.store.values["primarysources-statementgroupview"] = "<div class=\"wikibase-statementgroupview listview-item\" id=\"$3\">\n<div class=\"wikibase-statementgroupview-property new-property\">\n<div class=\"wikibase-statementgroupview-property-label\" dir=\"auto\">$1</div>\n</div>\n$2\n</div>";
    mw.wbTemplates.store.values["primarysources-statementlistview"] = "<div class=\"wikibase-statementlistview wikibase-toolbar-item\">\n<div class=\"wikibase-statementlistview-listview\">\n$1\n</div>\n$2\n</div>";
    mw.wbTemplates.store.values["primarysources-statementview"] = "<div class=\"wikibase-statementview wb-$1 $2\">\n<div class=\"wikibase-statementview-rankselector\">$3</div>\n<div class=\"wikibase-statementview-mainsnak-container\">\n<div class=\"wikibase-statementview-mainsnak\" dir=\"auto\">$4</div>\n<div class=\"wikibase-statementview-qualifiers\">$5</div>\n</div>\n$6\n<div class=\"wikibase-statementview-references-container\">\n<div class=\"wikibase-statementview-references-heading\">$7</div>\n<div class=\"wikibase-statementview-references $9\">$8</div>\n</div>\n</div>";
    mw.wbTemplates.store.values["primarysources-toolbar-container"] = "<span class=\"wikibase-toolbar-container $1\">$2</span>";
    mw.wbTemplates.store.values["primarysources-ui-toggler"] = "<a class=\"ui-toggler ui-toggler-toggle ui-state-default\"><span class=\"ui-toggler-icon ui-icon ui-icon-triangle-1-s\"></span><span class=\"ui-toggler-label\">$1</span></a>";
    */
    var ps = {};
    
    ps.templates = {
        /*qualifierHtml:  
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
            [0].outerHTML.replace(/(?:\r\n|\r|\n)/g, "")*/
            qualifierHtml:
        '<div class="wikibase-listview">' +
          '<div class="wikibase-snaklistview listview-item">' +
            '<div class="wikibase-snaklistview-listview">' +
              '<div class="wikibase-snakview listview-item">' +
                '<div class="wikibase-snakview-property-container">' +
                  '<div class="wikibase-snakview-property" dir="auto">' +
                    '{{qualifier-property-html}}' +
                  '</div>' +
                '</div>' +
                '<div class="wikibase-snakview-value-container" dir="auto">' +
                  '<div class="wikibase-snakview-typeselector"></div>' +
                  '<div class="wikibase-snakview-value wikibase-snakview-variation-valuesnak" style="height: auto; width: 100%;">' +
                    '<div class="valueview valueview-instaticmode" aria-disabled="false">' +
                      '{{qualifier-object}}' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<!-- wikibase-listview -->' +
            '</div>' +
          '</div>' +
        '</div>',
    sourceHtml:
        '<div class="wikibase-referenceview listview-item wikibase-toolbar-item new-source">' + // Remove wikibase-reference-d6e3ab4045fb3f3feea77895bc6b27e663fc878a wikibase-referenceview-d6e3ab4045fb3f3feea77895bc6b27e663fc878a
          '<div class="wikibase-referenceview-heading new-source">' +
            '<div class="wikibase-edittoolbar-container wikibase-toolbar-container">' +
              '<span class="wikibase-toolbar wikibase-toolbar-item wikibase-toolbar-container">' +
                '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-add">' +
                  '<a class="f2w-button f2w-source f2w-approve" href="#" data-statement-id="{{statement-id}}" data-dataset="{{data-dataset}}" data-property="{{data-property}}" data-object="{{data-object}}" data-source="{{data-source}}" data-qualifiers="{{data-qualifiers}}"><span class="wb-icon"></span>approve</a>' +
                '</span>' +
              '</span>' +
              ' ' +
              /* TODO: Broken by the last changes.
              '<span class="wikibase-toolbar wikibase-toolbar-item wikibase-toolbar-container">' +
                '[' +
                '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-edit">' +
                  '<a class="f2w-button f2w-source f2w-edit" href="#" data-statement-id="{{statement-id}}" data-property="{{data-property}}" data-object="{{data-object}}" data-source-property="{{data-source-property}}" data-source-object="{{data-source-object}}" data-qualifiers="{{data-qualifiers}}">edit</a>' +
                '</span>' +
                ']' +
              '</span>' +*/
              '<span class="wikibase-toolbar wikibase-toolbar-item wikibase-toolbar-container">' +
                '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-remove">' +
                  '<a class="f2w-button f2w-source f2w-reject" href="#" data-statement-id="{{statement-id}}" data-dataset="{{data-dataset}}" data-property="{{data-property}}" data-object="{{data-object}}" data-source="{{data-source}}" data-qualifiers="{{data-qualifiers}}"><span class="wb-icon"></span>reject</a>' +
                '</span>' +
              '</span>' +
            '</div>' +
          '</div>' +
          '<div class="wikibase-referenceview-listview">' +
            '<div class="wikibase-snaklistview listview-item">' +
              '<div class="wikibase-snaklistview-listview">' +
                '{{source-html}}' +
                '<!-- wikibase-listview -->' +
              '</div>' +
            '</div>' +
            '<!-- [0,*] wikibase-snaklistview -->' +
          '</div>' +
        '</div>',
    sourceItemHtml:
        '<div class="wikibase-snakview listview-item">' +
          '<div class="wikibase-snakview-property-container">' +
            '<div class="wikibase-snakview-property" dir="auto">' +
              '{{source-property-html}}' +
            '</div>' +
          '</div>' +
          '<div class="wikibase-snakview-value-container" dir="auto">' +
            '<div class="wikibase-snakview-typeselector"></div>' +
            '<div class="wikibase-snakview-value wikibase-snakview-variation-valuesnak" style="height: auto;">' +
              '<div class="valueview valueview-instaticmode" aria-disabled="false">' +
                '{{source-object}}' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>',
    statementViewHtml:
        '<div class="wikibase-statementview listview-item wikibase-toolbar-item new-object">' + // Removed class wikibase-statement-q31$8F3B300A-621A-4882-B4EE-65CE7C21E692
          '<div class="wikibase-statementview-rankselector">' +
            '<div class="wikibase-rankselector ui-state-disabled">' +
              '<span class="ui-icon ui-icon-rankselector wikibase-rankselector-normal" title="Normal rank"></span>' +
            '</div>' +
          '</div>' +
          '<div class="wikibase-statementview-mainsnak-container">' +
            '<div class="wikibase-statementview-mainsnak" dir="auto">' +
              '<!-- wikibase-snakview -->' +
              '<div class="wikibase-snakview">' +
                '<div class="wikibase-snakview-property-container">' +
                  '<div class="wikibase-snakview-property" dir="auto">' +
                    '{{property-html}}' +
                  '</div>' +
                '</div>' +
                '<div class="wikibase-snakview-value-container" dir="auto">' +
                  '<div class="wikibase-snakview-typeselector"></div>' +
                  '<div class="wikibase-snakview-value wikibase-snakview-variation-valuesnak" style="height: auto;">' +
                    '<div class="valueview valueview-instaticmode" aria-disabled="false">{{object}}</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="wikibase-statementview-qualifiers">' +
              '{{qualifiers}}' +
              '<!-- wikibase-listview -->' +
            '</div>' +
          '</div>' +
          '<!-- wikibase-toolbar -->' +
          '<span class="wikibase-toolbar-container wikibase-edittoolbar-container">' +
            '<span class="wikibase-toolbar-item wikibase-toolbar wikibase-toolbar-container">' +
              '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-add">' +
              '</span>' +
            '</span>' +
            ' ' +
            '<span class="wikibase-toolbar-item wikibase-toolbar wikibase-toolbar-container">' +
              '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-remove">' +
              '</span>' +
            '</span>' +
          '</span>' +
          '<div class="wikibase-statementview-references-container">' +
            '<div class="wikibase-statementview-references-heading">' +
              '<a class="ui-toggler ui-toggler-toggle ui-state-default">' + // Removed ui-toggler-toggle-collapsed
                '<span class="ui-toggler-icon ui-icon ui-icon-triangle-1-s ui-toggler-icon3dtrans"></span>' +
                '<span class="ui-toggler-label">{{references}}</span>' +
              '</a>' +
            '</div>' +
            '<div class="wikibase-statementview-references wikibase-toolbar-item">' + // Removed style="display: none;"
              '<!-- wikibase-listview -->' +
              '<div class="wikibase-listview">' +
                '{{sources}}' +
              '</div>' +
              '<div class="wikibase-addtoolbar-container wikibase-toolbar-container">' +
                '<!-- [' +
                '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-add">' +
                  '<a href="#">add reference</a>' +
                '</span>' +
                '] -->' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>',
    mainHtml:
        '<div class="wikibase-statementgroupview listview-item" id="{{property}}">' +
          '<div class="wikibase-statementgroupview-property new-property">' +
            '<div class="wikibase-statementgroupview-property-label" dir="auto">' +
              '{{property-html}}' +
            '</div>' +
          '</div>' +
          '<!-- wikibase-statementlistview -->' +
          '<div class="wikibase-statementlistview wikibase-toolbar-item">' +
            '<div class="wikibase-statementlistview-listview">' +
              '<!-- [0,*] wikibase-statementview -->' +
              '{{statement-views}}' +
            '</div>' +
            '<!-- [0,1] wikibase-toolbar -->' +
            '<span class="wikibase-toolbar-container"></span>' +
            '<span class="wikibase-toolbar-wrapper">' +
              '<div class="wikibase-addtoolbar-container wikibase-toolbar-container">' +
                '<!-- [' +
                '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-add">' +
                  '<a href="#">add</a>' +
                '</span>' +
                '] -->' +
              '</div>' +
            '</span>' +
          '</div>' +
        '</div>'
    };
    
    mw.ps = ps;
    
})( mediaWiki, jQuery );
