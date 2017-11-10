(function(mw, ps) {
  console.log("Primary sources tool - Sidebar facilities");

  // accessible object
  var sidebar = {};
  
  // BEGIN: browse suggested claims
  sidebar.generateNav = (function generateNav() {
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
  })();
  sidebar.scrollFollowTop = function scrollFollowTop($sidebar) {
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
  var anchorList = [];
  sidebar.alphaPos = function alphaPos(text){
    if(text <= anchorList[0]){
      return 0;
    }
    for(var i = 0; i < anchorList.length -1; i++){
      if(text > anchorList[i] && text < anchorList[i+1]){
        return i+1;
      }
    }
    return anchorList.length;
  }
  sidebar.appendToNav = function appendToNav(container){
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
  
  ps.sidebar = sidebar;
  
}(mediaWiki, primarySources));