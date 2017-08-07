var wb_HTML_TEMPLATES = {
  qualifierHtml:  
    '<div class="wikibase-listview">'+
      '<div class="wikibase-snaklistview">'+
        '<div class="wikibase-snaklistview-listview">'+
          '<div class="wikibase-snakview">'+
            '<div class="wikibase-snakview-property-container">'+
              '<div class="wikibase-snakview-property" dir="auto">'+
                '{{qualifier-property-html}}'+
              '</div>'+
            '</div>'+
            '<div class="wikibase-snakview-value-container" dir="auto">'+
              '<div class="wikibase-snakview-typeselector"></div>'+
                '<div class="wikibase-snakview-value wikibase-snakview-variation-valuesnak">'+
                  '{{qualifier-object}}'+
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>',
    sourceHtml:
    '<span class="wikibase-toolbar-container wikibase-edittoolbar-container">'+
    '<span class="wikibase-toolbar wikibase-toolbar-item wikibase-toolbar-container">'+
      '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-edit">' +
        '<a href="#" title="">'+
          '<span class="wb-icon">'+
          '</span>'+
            '$1'+
        '</a>'+
      '</span>'+
      '</span>'+
    '</span>',
    sourceItemHtml: 
    '<div class="wikibase-snakview">'+
      '<div class="wikibase-snakview-property-container">'+
        '<div class="wikibase-snakview-property" dir="auto">'+
        '{{source-property-html}}' +
        '</div>'+
      '</div>'+
      '<div class="wikibase-snakview-value-container" dir="auto">'+
        '<div class="wikibase-snakview-typeselector">'+
        '</div>'+
        '<div class="wikibase-snakview-value wikibase-snakview-variation-valuesnak">'+
          '{{source-object}}'+
        '</div>'+
      '</div>'+
    '</div>',
    statementViewHtml:
    '<div class="wikibase-statementview wb-normal listview-item wikibase-toolbar-item">' +
      '<div class="wikibase-statementview-rankselector">' +
        '<div class="wikibase-rankselector ui-state-disabled">' +
          '<span class="ui-icon ui-icon-rankselector wikibase-rankselector-normal" title="Normal rank">' +
          '</span>' +
        '</div>' +
      '</div>' +
      '<div class="wikibase-statementview-mainsnak-container">' +
        '<div class="wikibase-statementview-mainsnak" dir="auto">' +
          '<div class="wikibase-snakview">' +
            '<div class="wikibase-snakview-property-container">' +
              '<div class="wikibase-snakview-property" dir="auto">' + 
              '</div>' +
            '</div>' +
            '<div class="wikibase-snakview-value-container" dir="auto">' + 
              '<div class="wikibase-snakview-typeselector">' +
              '</div>' +
              '<div class="wikibase-snakview-value wikibase-snakview-variation-valuesnak">' +
                '<a title="Q6256" href="/wiki/Q6256">' +
                  'country' + 
                '</a>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="wikibase-statementview-qualifiers">' +
        '</div>' +
      '</div>' +
      '<span class="wikibase-toolbar-container wikibase-edittoolbar-container">' +
        '<span class="wikibase-toolbar wikibase-toolbar-item wikibase-toolbar-container">' +
            '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-edit">' +
              '<a href="#" title="">' +
                '<span class="wb-icon">' +
                '</span>' +
                'edit' +
              '</a>' +
            '</span>' +
          '</span>' +
        '</span>' +
        '<div class="wikibase-statementview-references-container">' +
          '<div class="wikibase-statementview-references-heading">' +
            '<a class="ui-toggler ui-toggler-toggle ui-state-default">' +
              '<span class="ui-toggler-icon ui-icon ui-icon-triangle-1-s">' +
              '</span>' +
              '<span class="ui-toggler-label">' +
                '0 references' +
              '</span>' +
            '</a>' +
          '</div>' +
          '<div class="wikibase-statementview-references ">' +
            '<div class="wikibase-addtoolbar wikibase-toolbar-item wikibase-toolbar wikibase-addtoolbar-container wikibase-toolbar-container">' +
              '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-add">' +
                '<a href="#" title="">' +
                  '<span class="wb-icon">' +
                  '</span>' +
                  'add reference' +
                '</a>' +
                '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>',
    mainHtml:
    '<div class="wikibase-statementgroupview listview-item" id="">' +
      '<div class="wikibase-statementgroupview-property">' +
        '<div class="wikibase-statementgroupview-property-label" dir="auto">' +
          '{{property-html}}' +
        '</div>' +
      '</div>' +
      '<div class="wikibase-statementlistview">' +
        '<div class="wikibase-statementlistview-listview">' +
          '{{statement-views}}' +
          '<span class="wikibase-toolbar-container">' +
          '</span>' +
          '<span class="wikibase-toolbar-wrapper">' +
            '<div class="wikibase-addtoolbar wikibase-toolbar-item wikibase-toolbar wikibase-addtoolbar-container wikibase-toolbar-container">' +
              '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-add">' +
                '<a href="#" title="Add a new value">' +
                  '<span class="wb-icon">' +
                  '</span>' +
                  'add' +
                '</a>' +
              '</span>' +
            '</div>' +
          '</span>' +
        '</div>' +
      '</div>' +
    '</div>' 
},
HTML_TEMPLATES = {
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
                '<div class="wikibase-snakview-value wikibase-snakview-variation-valuesnak">' +
                    '{{qualifier-object}}' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>',
  sourceHtml:
      '<div class="wikibase-referenceview listview-item wikibase-toolbar-item new-source">' +
      '<div class="wikibase-referenceview-heading new-source">' +
          '<div class="wikibase-edittoolbar-container wikibase-toolbar-container">' +
            '<span class="wikibase-toolbar wikibase-toolbar-item wikibase-toolbar-container">' +
              '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-add">' +
                '<a class="f2w-button f2w-source f2w-approve" href="#" data-statement-id="{{statement-id}}" data-property="{{data-property}}" data-object="{{data-object}}" data-source="{{data-source}}" data-qualifiers="{{data-qualifiers}}"><span class="wb-icon"></span>approve reference</a>' +
              '</span>' +
            '</span>' +
            '<span class="wikibase-toolbar wikibase-toolbar-item wikibase-toolbar-container">' +
            '[' +
            '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-edit">' +
            '<a class="f2w-button f2w-source f2w-edit" href="#" data-statement-id="{{statement-id}}" data-property="{{data-property}}" data-object="{{data-object}}" data-source-property="{{data-source-property}}" data-source-object="{{data-source-object}}" data-qualifiers="{{data-qualifiers}}">edit</a>' +
            '</span>' +
            ']' +            
            '<span class="wikibase-toolbar wikibase-toolbar-item wikibase-toolbar-container">' +
              '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-remove">' +
                '<a class="f2w-button f2w-source f2w-reject" href="#" data-statement-id="{{statement-id}}" data-property="{{data-property}}" data-object="{{data-object}}" data-source="{{data-source}}" data-qualifiers="{{data-qualifiers}}"><span class="wb-icon"></span>reject reference</a>' +
              '</span>' +
            '</span>' +
          '</div>' +
        '</div>' +
        '<div class="wikibase-referenceview-listview">' +
          '<div class="wikibase-snaklistview listview-item">' +
            '<div class="wikibase-snaklistview-listview">' +
              '{{source-html}}' +
            '</div>' +
          '</div>' +
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
          '<div class="wikibase-snakview-value wikibase-snakview-variation-valuesnak">' +
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
              '<a class="f2w-button f2w-property f2w-approve" href="#" data-statement-id="{{statement-id}}" data-property="{{data-property}}" data-object="{{data-object}}" data-qualifiers="{{data-qualifiers}}" data-sources="{{data-sources}}"><span class="wb-icon"></span>approve claim</a>' +
            '</span>' +
          '</span>' +
          ' ' +
          '<span class="wikibase-toolbar-item wikibase-toolbar wikibase-toolbar-container">' +
            '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-remove">' +
              '<a class="f2w-button f2w-property f2w-reject" href="#" data-statement-id="{{statement-id}}" data-property="{{data-property}}" data-object="{{data-object}}" data-qualifiers="{{data-qualifiers}}" data-sources="{{data-sources}}"><span class="wb-icon"></span>reject claim</a>' +
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

(function ($, mw ) {
  QUnit.module( 'ext.PrimarySources.frontend', QUnit.newMwEnvironment());

  QUnit.test("wb_qualifierHtml", function( assert ){
    assert.equal(mw.PrimarySources.template.wb_qualifierHtml, wb_HTML_TEMPLATES.qualifierHtml, "Test qualifierHtml for Wikibase");
  });

  QUnit.test("ps_qualifierHtml", function( assert ){
    assert.equal(mw.PrimarySources.template.qualifierHtml, HTML_TEMPLATES.qualifierHtml, "Test qualifierHtml for PrimarySources");
  });

  QUnit.skip("wb_sourceHtml", function( assert ){
    assert.equal(mw.PrimarySources.template.wb_sourceHtml, wb_HTML_TEMPLATES.sourceHtml, "Test sourceHtml for Wikibase");
  });

  QUnit.test("ps_sourceHtml", function( assert ){
    assert.equal(mw.PrimarySources.template.sourceHtml, HTML_TEMPLATES.sourceHtml, "Test sourceHtml for PrimarySources");
  });

  QUnit.test("wb_sourceItemHtml", function ( assert ){
    assert.equal(mw.PrimarySources.template.wb_sourceItemHtml, wb_HTML_TEMPLATES.sourceItemHtml, "Test sourceItemHtml for Wikibase");
  });

  QUnit.skip("ps_sourceItemHtml", function( assert ){
    assert.equal(mw.PrimarySources.template.sourceItemHtml, HTML_TEMPLATES.sourceItemHtml, "Test sourceItemHtml for PrimarySources");
  });

  QUnit.test("wb_statementViewHtml", function( assert){
    assert.equal(mw.PrimarySources.template.wb_statementViewHtml, wb_HTML_TEMPLATES.statementViewHtml.replace(/ listview-item/g, "").replace(/wikibase-edittoolbar-container /g, "").replace("wikibase-toolbarbutton ", "").replace(" wikibase-edittoolbar-container", "").replace(" wikibase-toolbar-item wikibase-toolbar", ""), "Test statementViewHtml for Wikibase");    
  });

  QUnit.skip("ps_statementViewHtml", function( assert ){
    assert.equal(mw.PrimarySources.template.ps_statementViewHtml, HTML_TEMPLATES.statementViewHtml.replace(/ listview-item/g, "").replace(/wikibase-edittoolbar-container /g, "").replace("wikibase-toolbarbutton ", "").replace(" wikibase-edittoolbar-container", "").replace(" wikibase-toolbar-item wikibase-toolbar", ""), "Test statementViewHtml for PrimarySources");    
  });

  QUnit.test("wb_mainHtml", function( assert ){
    assert.equal(mw.PrimarySources.template.wb_mainHtml, wb_HTML_TEMPLATES.mainHtml.replace(/ listview-item/g, ""), "Test mainHtml for Wikibase");
  });

  QUnit.skip("ps_mainHtml", function( assert ){
    assert.equal(mw.PrimarySources.template.ps_mainHtml, HTML_TEMPLATES.mainHtml, "Test mainHtml for PrimarySources");
  });

}( jQuery, mediaWiki ) );
