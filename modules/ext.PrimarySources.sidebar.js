(function(mw, $) {
  
  console.log("Primary sources tool - Sidebar facilities");
  
  var ps = mw.ps || {};

  // Used by filter and dataset selection modal windows 
  var windowManager;
  // Used by the property browser
  var anchorList = [];

  // accessible object
  ps.sidebar = {
    // BEGIN: sidebar links
    createSidebarLinks: (function createSidebarLinks() {

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
          document.location.href = 'https://www.wikidata.org/wiki/' + newQid;
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
        // Bind filter link to filter modal window (function in filter module: pass the window manager)
        ps.filter.listDialog(windowManager, listButton);
      });
    })(),
    // END: sidebar links
    
    // BEGIN: dataset selection 
    configDialog: function configDialog(winMan, button) {
      function ConfigDialog(config) {
        ConfigDialog.super.call(this, config);
      }
      OO.inheritClass(ConfigDialog, OO.ui.ProcessDialog);
      ConfigDialog.static.name = 'ps-config';
      ConfigDialog.static.title = 'Primary sources datasets';
      ConfigDialog.static.size = 'large';
      ConfigDialog.static.actions = [
        {action: 'save', label: 'Save', flags: ['primary', 'constructive']},
        {label: 'Cancel', flags: 'safe'}
      ];

      ConfigDialog.prototype.initialize = function() {
        ConfigDialog.super.prototype.initialize.apply(this, arguments);

        this.dataset = new OO.ui.ButtonSelectWidget({
          items: [new OO.ui.ButtonOptionWidget({
            data: '',
            label: 'All sources'
          })]
        });

        var dialog = this;
        ps.commons.getDatasets(function(datasets) {
          datasets.forEach(function(item) {
            var uri = item['dataset'];
            dialog.dataset.addItems([new OO.ui.ButtonOptionWidget({
              data: uri,
              label: ps.commons.datasetUriToLabel(uri),
            })]);
          });
        });

        this.dataset.selectItemByData(dataset);

        var fieldset = new OO.ui.FieldsetLayout({
          label: 'Dataset to use'
        });
        fieldset.addItems([this.dataset]);

        this.panel = new OO.ui.PanelLayout({
          padded: true,
          expanded: false
        });
        this.panel.$element.append(fieldset.$element);
        this.$body.append(this.panel.$element);
      };

      ConfigDialog.prototype.getActionProcess = function(action) {
        if (action === 'save') {
          mw.cookie.set('ps-dataset', this.dataset.getSelectedItem().getData());
          return new OO.ui.Process(function() {
            location.reload();
          });
        }

        return ConfigDialog.super.prototype.getActionProcess.call(this, action);
      };

      ConfigDialog.prototype.getBodyHeight = function() {
        return this.panel.$element.outerHeight(true);
      };

      winMan.addWindows([new ConfigDialog()]);

      button.click(function() {
        winMan.openWindow('ps-config');
      });
    },
    // END: dataset selection  
    
    // BEGIN: browse suggested claims
    generateNav: (function generateNav() {
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
    })(),
    scrollFollowTop: function scrollFollowTop($sidebar) {
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
    },
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
      var firstNewObj = $(container).find('.new-object')[0];
      if (firstNewObj) {
        var anchor = {
          title : $(container).find('.wikibase-statementgroupview-property-label'),
          target : $(firstNewObj).find('.valueview-instaticmode')[0]
        };
        var text_nospace = anchor.title.text().replace(/\W/g, '');
        var text_space = anchor.title.text().replace(/[^\w\s]/g, '');
        if(anchorList.indexOf(text_nospace) == -1){
          var pos = alphaPos(text_nospace);
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
    // END: browse suggested claims
    }
  
  mw.ps = ps;
  
}(mediaWiki, jQuery));