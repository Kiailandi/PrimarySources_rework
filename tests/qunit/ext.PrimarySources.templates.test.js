HTML_TEMPLATES = {
    qualifierHtml:
      '<div class="wikibase-listview">' +
        '<div class="wikibase-snaklistview">' +
          '<div class="wikibase-snaklistview-listview">' +
            '<div class="wikibase-snakview">' +
              '<div class="wikibase-snakview-property-container">' +
                '<div class="wikibase-snakview-property" dir="auto">' +
                  '{{qualifier-property-html}}' +
                '</div>' +
              '</div>' +
              '<div class="wikibase-snakview-value-container" dir="auto">' +
                '<div class="wikibase-snakview-typeselector">' +
                '</div>' +
                '<div class="wikibase-snakview-value wikibase-snakview-variation-valuesnak">' +
                  '{{qualifier-object}}' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>',
    sourceHtml:
      '<div class="wikibase-referenceview new-source">' +
        '<div class="wikibase-referenceview-heading new-source">' +
          '<span class="wikibase-toolbar-item wikibase-toolbar wikibase-edittoolbar-container wikibase-toolbar-container">' +
            '<span class="wikibase-toolbar-item wikibase-toolbar wikibase-toolbar-container">' +
              '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-add">' +
                '<a class="f2w-button f2w-source f2w-approve" href="#" data-statement-id="{{statement-id}}" data-property="{{data-property}}" data-object="{{data-object}}" data-sources="{{data-source}}" data-qualifiers="{{data-qualifiers}}">' +
                  '<span class="wb-icon">' +
                  '</span>' +
                  'approve reference' +
                '</a>' +
              '</span>' +
            '</span>' +
            '<span class="wikibase-toolbar-item wikibase-toolbar wikibase-toolbar-container">' +
              '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-edit">' +
                '<a class="f2w-button f2w-source f2w-edit" href="#" data-statement-id="{{statement-id}}" data-property="{{data-property}}" data-object="{{data-object}}" data-sources="{{data-source}}" data-qualifiers="{{data-qualifiers}}">' +
                  '<span class="wb-icon">' +
                  '</span>' +
                  'edit reference' +
                '</a>' +
              '</span>' +
            '</span>' +
            '<span class="wikibase-toolbar-item wikibase-toolbar wikibase-toolbar-container">' +
              '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-remove">' +
                '<a class="f2w-button f2w-source f2w-reject" href="#" data-statement-id="{{statement-id}}" data-property="{{data-property}}" data-object="{{data-object}}" data-sources="{{data-source}}" data-qualifiers="{{data-qualifiers}}">' +
                  '<span class="wb-icon">' +
                  '</span>' +
                    'reject reference' +
                '</a>' +
              '</span>' +
            '</span>' +
          '</span>' +
        '</div>' +
        '<div class="wikibase-referenceview-listview">' +
          '<div class="wikibase-snaklistview">' +
            '<div class="wikibase-snaklistview-listview">' +
              '{{source-html}}' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' ,
    sourceItemHtml:
      '<div class="wikibase-snakview">' +
        '<div class="wikibase-snakview-property-container">' +
          '<div class="wikibase-snakview-property" dir="auto">' +
            '{{source-property-html}}' +
          '</div>' +
        '</div>' +
        '<div class="wikibase-snakview-value-container" dir="auto">' +
          '<div class="wikibase-snakview-typeselector">' +
          '</div>' +
          '<div class="wikibase-snakview-value wikibase-snakview-variation-valuesnak">' +
            '{{source-object}}' +
          '</div>' +
        '</div>' +
      '</div>',
    statementViewHtml:
      '<div class="wikibase-statementview wb-normal listview-item wikibase-toolbar-item new-object">' +
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
                  '{{property-html}}' +
                '</div>' +
              '</div>' +
              '<div class="wikibase-snakview-value-container" dir="auto">' +
                '<div class="wikibase-snakview-typeselector">' +
                '</div>' +
                  '<div class="wikibase-snakview-value wikibase-snakview-variation-valuesnak">' +
                  '{{object}}' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +    
          '<div class="wikibase-statementview-qualifiers">' +
            '{{qualifiers}}' +
          '</div>' +
        '</div>' +
        '<span class="wikibase-toolbar-container wikibase-edittoolbar-container">' +
          '<span class="wikibase-toolbar-item wikibase-toolbar wikibase-toolbar-container">' +
            '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-add">' +
              '<a class="f2w-button f2w-property f2w-approve" href="#" data-statement-id="{{statement-id}}" data-property="{{data-property}}" data-object="{{data-object}}" data-sources="{{data-sources}}" data-qualifiers="{{data-qualifiers}}">' +
                '<span class="wb-icon">' +
                '</span>' +
                'approve claim' +
              '</a>' +
            '</span>' +
          '</span>' +
          '<span class="wikibase-toolbar-item wikibase-toolbar wikibase-toolbar-container">' +
            '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-edit">' +
              '<a class="f2w-button f2w-property f2w-edit" href="#" data-statement-id="{{statement-id}}" data-property="{{data-property}}" data-object="{{data-object}}" data-sources="{{data-sources}}" data-qualifiers="{{data-qualifiers}}">' +
                '<span class="wb-icon">' +
                '</span>' +
                'edit claim' +
              '</a>' +
            '</span>' +
          '</span>' +
          '<span class="wikibase-toolbar-item wikibase-toolbar wikibase-toolbar-container">' +
            '<span class="wikibase-toolbarbutton wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbar-button-remove">' +
              '<a class="f2w-button f2w-property f2w-reject" href="#" data-statement-id="{{statement-id}}" data-property="{{data-property}}" data-object="{{data-object}}" data-sources="{{data-sources}}" data-qualifiers="{{data-qualifiers}}">' +
                '<span class="wb-icon">' +
                '</span>' +
                'reject claim' +
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
                '{{references}}' +
              '</span>' +
            '</a>' +
          '</div>' + 
          '<div class="wikibase-statementview-references wikibase-toolbar-item">' +
            '<div class="wikibase-listview">' +
              '{{sources}}' +
            '</div>' +
            '<span class="wikibase-toolbar-container wikibase-addtoolbar wikibase-toolbar-item wikibase-toolbar wikibase-addtoolbar-container">' +
              '<span class="wikibase-toolbar-item wikibase-toolbar-button wikibase-toolbarbutton wikibase-toolbar-button-add">' +
                '<a href="#" title="">' +
                  '<span class="wb-icon">' +
                  '</span>' +
                  'add reference' +
                '</a>' +
              '</span>' +
            '</span>' +
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
        '<div class="wikibase-statementlistview wikibase-toolbar-item">' +
          '<div class="wikibase-statementlistview-listview">' +
            '{{statement-views}}' +
          '</div>' +
          '<span class="wikibase-toolbar-container">' +
          '</span>' +
        '</div>' +
      '</div>'
  };
  
  (function ($, mw ) {
    QUnit.module( 'ext.PrimarySources.templates', QUnit.newMwEnvironment());
    
    QUnit.test("ps_qualifierHtml", function( assert ){
      assert.equal(mw.ps.templates.qualifierHtml, HTML_TEMPLATES.qualifierHtml, "Test PrimarySources qualifierHtml");
    });
  
    QUnit.test("ps_sourceHtml", function( assert ){
      assert.equal(mw.ps.templates.sourceHtml, HTML_TEMPLATES.sourceHtml, "Test PrimarySources sourceHtml");
    });
  
    QUnit.test("ps_sourceItemHtml", function( assert ){
      assert.equal(mw.ps.templates.sourceItemHtml, HTML_TEMPLATES.sourceItemHtml, "Test PrimarySources sourceItemHtml");
    });
  
    QUnit.test("ps_statementViewHtml", function( assert ){
      assert.equal(mw.ps.templates.statementViewHtml, HTML_TEMPLATES.statementViewHtml, "Test PrimarySources statementViewHtml");    
    });
  
    QUnit.test("ps_mainHtml", function( assert ){
      assert.equal(mw.ps.templates.mainHtml, HTML_TEMPLATES.mainHtml, "Test PrimarySources mainHtml");
    });
  
  }( jQuery, mediaWiki ) );
  