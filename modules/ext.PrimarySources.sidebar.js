(function(mw, $) {
  console.log("Primary sources tool - Sidebar facilities");
  
  var ps = mw.ps || {};

  // Used by filter and dataset selection modal windows 
  var windowManager;
  // Used by the property browser
  var anchorList = [];

  var dataset = ps.globals.DATASET;

  // accessible object
  ps.sidebar = {
    // BEGIN: dataset selection
    configDialog: function configDialog(winMan, button) {
      function ConfigDialog(config) {
        ConfigDialog.super.call(this, config);
      }
      // Main dialog settings
      OO.inheritClass(ConfigDialog, OO.ui.ProcessDialog);
      ConfigDialog.static.name = 'ps-config';
      ConfigDialog.static.title = 'Choose a primary sources dataset';
      ConfigDialog.static.actions = [
        {action: 'save', label: 'Save', flags: ['primary', 'constructive']},
        {label: 'Cancel', flags: 'safe'}
      ];
  
      ConfigDialog.prototype.initialize = function() {
        ConfigDialog.super.prototype.initialize.apply(this, arguments);
  
        // BEGIN: datasets as radio options
        var allDatasets = new OO.ui.RadioOptionWidget({
          data: '',
          label: 'All'
        });
        var availableDatasets = [allDatasets];
        // Fill the options with the available datasets
        ps.commons.getDatasets(function(datasets) {
          datasets.forEach(function(item) {
            var uri = item['dataset'];
            availableDatasets.push(new OO.ui.RadioOptionWidget({
              data: uri,
              label: datasetUriToLabel(uri),
            }));
          });
        });
        var datasetSelection = new OO.ui.RadioSelectWidget({
          items: availableDatasets
        })
        .connect(this, {select: 'setDatasetInfo'});
        this.datasetSelection = datasetSelection;
        var datasetsPanel = new OO.ui.PanelLayout({
          padded: true,
          expanded: false,
          scrollable: false
        });
        // END: datasets as radio options
  
        // BEGIN: selected dataset info
        var datasetDescriptionWidget = new OO.ui.LabelWidget();
        var missingStatementsWidget = new OO.ui.LabelWidget();
        var totalStatementsWidget = new OO.ui.LabelWidget();
        var uploaderWidget = new OO.ui.LabelWidget();
        this.datasetDescriptionWidget = datasetDescriptionWidget;
        this.missingStatementsWidget = missingStatementsWidget;
        this.totalStatementsWidget = totalStatementsWidget;
        this.uploaderWidget = uploaderWidget;
        var infoFields = new OO.ui.FieldsetLayout();
        infoFields.addItems([
          new OO.ui.FieldLayout(datasetDescriptionWidget, {
            align: 'top',
            label: 'Description:'
          }),
          new OO.ui.FieldLayout(missingStatementsWidget, {
            align: 'top',
            label: 'Missing statements:'
          }),
          new OO.ui.FieldLayout(totalStatementsWidget, {
            align: 'top',
            label: 'Total statements:'
          }),
          new OO.ui.FieldLayout(uploaderWidget, {
            align: 'top',
            label: 'Author:'
          })
        ]);
        var infoPanel = new OO.ui.PanelLayout({
          padded: true,
          expanded: false,
          scrollable: false
        })
        this.infoPanel = infoPanel;
        // END: selected dataset info
  
        // BEGIN: final result as a menu layout
        // see https://doc.wikimedia.org/oojs-ui/master/js/#!/api/OO.ui.MenuLayout
        var layout = new OO.ui.MenuLayout({
          position: 'before',
          expanded: false
        });
        // Add the radio options to the layout
        layout.$menu.append(
            datasetsPanel.$element.append(datasetSelection.$element)
        );
        // Add the selected dataset info to the layout
        layout.$content.append(
            infoPanel.$element.append(infoFields.$element)
        );
        // Add the the menu layout to the main dialog
        this.$body.append(layout.$element);
        // END: final result as a menu layout
      };
  
      ConfigDialog.prototype.setDatasetInfo = function () {
        var datasetDescriptionWidget = this.datasetDescriptionWidget;
        var missingStatementsWidget = this.missingStatementsWidget;
        var totalStatementsWidget = this.totalStatementsWidget;
        var uploaderWidget = this.uploaderWidget;
        var selected = this.datasetSelection.findSelectedItem();
        /*
          IF:
          1. we switch off the info panel;
          2. the user clicks on 'cancel';
          3. the user reopens the dialog;
          4. the user selects a dataset;
          THEN the dialog height will not fit.
  
          Replace with empty labels instead.
        */
        if (selected.getLabel() === 'All') {
          datasetDescriptionWidget.setLabel();
          missingStatementsWidget.setLabel();
          totalStatementsWidget.setLabel();
          uploaderWidget.setLabel();
        } else {
          $.get(
            ps.globals.API_ENDPOINTS.STATISTICS_SERVICE,
            {dataset: selected.getData()},
            function(data) {
              var description = data.description == null
              ? new OO.ui.HtmlSnippet('<i>Not available</i>')
              : new OO.ui.HtmlSnippet('<i>' + data.description + '</i>');
              datasetDescriptionWidget.setLabel(description);
              missingStatementsWidget.setLabel(new OO.ui.HtmlSnippet('<b>' + data.missing_statements.toLocaleString() + '</b>'));
              totalStatementsWidget.setLabel(new OO.ui.HtmlSnippet('<b>' + data.total_statements.toLocaleString() + '</b>'));
              uploaderWidget.setLabel(new OO.ui.HtmlSnippet('<a href="' + data.uploader + '">' + data.uploader.split('User:')[1] + '</a>'));
            }
          );
        }
      }
  
      ConfigDialog.prototype.getActionProcess = function(action) {
        if (action === 'save') {
          mw.cookie.set('ps-dataset', this.datasetSelection.findSelectedItem().getData());
          return new OO.ui.Process(function() {
            location.reload();
          });
        }
  
        return ConfigDialog.super.prototype.getActionProcess.call(this, action);
      };
  
      winMan.addWindows([new ConfigDialog()]);
  
      button.click(function() {
        winMan.openWindow('ps-config');
      });
    },
    // END: dataset selection
    alphaPos: function alphaPos(text){
      if(text <= anchorList[0]){
        return 0;
      }
      for(var i = 0; i < anchorList.length -1; i++){
        if(text > anchorList[i] && text < anchorList[i+1]){
          return i+1;
        }
      }
      return anchorList.length;
    },
    appendToNav: function appendToNav(container){
      var firstNewObj = $(container).find('.new-object')[0] || $(container).find('.new-source')[0];
      if (firstNewObj) {
        var anchor = {
          title : $(container).find('.wikibase-statementgroupview-property-label'),
          target : $(firstNewObj).find('.valueview-instaticmode')[0]
        };
        var text_nospace = anchor.title.text().replace(/\W/g, '');
        var text_space = anchor.title.text().replace(/[^\w\s]/g, '');
        if(anchorList.indexOf(text_nospace) == -1){
          var pos = ps.sidebar.alphaPos(text_nospace);
          anchorList.splice(pos, 0, text_nospace);
          if(pos === 0){
            $('#p-ps-nav-list').prepend('<li id="n-ps-anchor-' + text_nospace + '"><a href="#" title="move to ' + text_space + '">' + text_space + '</a></li>');
          }
          else{
            $('#n-ps-anchor-' + anchorList[pos-1]).after('<li id="n-ps-anchor-' + text_nospace + '"><a href="#" title="move to ' + text_space + '">' + text_space + '</a></li>');
          }
          $('#n-ps-anchor-' + text_nospace).click(function(e) {
            e.preventDefault();
            anchor.target.scrollIntoView();
          });
        }
      }
    }
  };

    function scrollFollowTop($sidebar) {
        var $window = $(window),
            offset = $sidebar.offset(),
            topPadding = 15;

        $window.scroll(function() {
            if ($window.scrollTop() > offset.top) {
                $sidebar.stop().animate({
                    marginTop: $window.scrollTop() - offset.top + topPadding
                }, 200);
            } else {
                $sidebar.stop().animate({
                    marginTop: 0
                }, 200);
            }
        });
    }

    // BEGIN: sidebar links - self invoking
    mw.loader.using( ['mediawiki.util'], function createSidebarLinks() {

        console.log("Create sidebar links");

        // Random item link
        var datasetLabel = (dataset === '') ? 'primary sources' : ps.commons.datasetUriToLabel(dataset);
        var portletLink = $(mw.util.addPortletLink(
            'p-navigation',
            '#',
            'Random ' + datasetLabel + ' item',
            'n-random-ps',
            'Load a new random ' + datasetLabel + ' item',
            '',
            '#n-help'
        ));
        portletLink.children().click(function(e) {
            e.preventDefault();
            e.target.innerHTML = '<img src="https://upload.wikimedia.org/' +
                'wikipedia/commons/f/f8/Ajax-loader%282%29.gif" class="ajax"/>';
            $.ajax({
                url: ps.globals.API_ENDPOINTS.RANDOM_SERVICE + '?dataset=' + dataset
            }).done(function(data) {
                var newQid = data[0].statement.split(/\t/)[0];
                document.location.href = document.location.origin + "/wiki/" + newQid;
            }).fail(function() {
                return ps.commons.reportError('Could not obtain random primary sources item');
            });
        });

        mw.loader.using(
            ['jquery.tipsy', 'oojs-ui', 'wikibase.dataTypeStore'], function() {
                windowManager = new OO.ui.WindowManager();
                $('body').append(windowManager.$element);

                // Dataset selection gear icon
                var configButton = $('<span>')
                    .attr({
                        id: 'ps-config-button',
                        title: 'Select primary sources datasets'
                    })
                    .tipsy()
                    .appendTo(portletLink);
                // Bind gear icon to dataset selection modal window (function in this module)
                ps.sidebar.configDialog(windowManager, configButton);

                // Filter link
                var listButton = $(mw.util.addPortletLink(
                    'p-tb',
                    '#',
                    'Primary sources filter',
                    'n-ps-list',
                    'List statements from primary sources'
                ));
                // Bind filter link to filter modal window (function in filter module)
                ps.filter.init(windowManager, listButton);
            });
    });
    // END: sidebar links

    // BEGIN: browse suggested claims - self invoking
    mw.loader.using( ['mediawiki.util'], function generateNav() {
        $('#mw-panel').append('<div class="portal" role="navigation" id="p-ps-navigation" aria-labelledby="p-ps-navigation-label"><h3 id="p-ps-navigation-label">Browse Primary Sources</h3></div>');
        var navigation =  $('#p-ps-navigation');
        navigation.append('<div class="body"><ul id="p-ps-nav-list"></ul></div>');
        $('#p-ps-nav-list').before('<a href="#" id="n-ps-anchor-btt" title="move to top">&#x25B2 back to top &#x25B2</a>');
        $('#n-ps-anchor-btt').click(function(e) {
            e.preventDefault();
            $('html,body').animate({
                scrollTop: 0
            }, 0);
        });
        scrollFollowTop(navigation);
    });
    // END: browse suggested claims

    mw.ps = ps;
  
})(mediaWiki, jQuery);