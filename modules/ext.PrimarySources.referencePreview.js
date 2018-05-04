( function ( mw, $ ) {
	var ps = mw.ps || {};

	ps.referencePreview = {
		openNav: function openNav( itemLabel, propertyLabel, propertyValue, referenceURL, buttons ) {

			console.debug( 'Reference preview buttons passed:', arguments );

			$( '#myNav' ).width( '100%' );

			var blackboard = $( '#blackboard' );

			blackboard.append( $( buttons[ 0 ] ).clone( true, true ) );
			blackboard.append( $( buttons[ 1 ] ).clone( true, true ) );
			blackboard.append( '<div class="loader"></div>' );

			$.ajax( {
				type: 'GET',
				url: ps.globals.API_ENDPOINTS.PREVIEW_SERVICE + encodeURIComponent( referenceURL ),
				success: function ( msg ) {
					$( '.loader' ).remove();

					if ( msg != 'no preview' ) {
						var data = JSON.parse( msg );
						var regEx = new RegExp( '(' + itemLabel + '|' + propertyLabel + '|' + propertyValue + ')(?!([^<]+)?>)', 'gi' );

						if ( !data.hasOwnProperty( 'excerpt' ) ) {
							blackboard.append( '<h1><a href="' + data.url + '">' + data.url + '</a></h1>' );
							blackboard.append( '<ul></ul>' );

							var linklist = $( '#blackboard > ul' );
							for ( var index in data ) {
								var item = data[ index ];
								if ( index != 'url' && item !== null ) {
									if ( index == 'other' ) {
										while ( typeof item === 'string' ) {
											item = JSON.parse( item );
										}
										for ( var key in item ) {
											if ( item[ key ] !== null ) {
												linklist.append( ( '<li>' + '<strong>' + key + '</strong>' + ': ' + item[ key ] + '</li>' ).replace( regEx, '<span class="highlight">$1</span>' ) );
											}
										}
									} else {
										linklist.append( ( '<li>' + '<strong>' + index + '</strong>' + ': ' + item + '</li>' ).replace( regEx, '<span class="highlight">$1</span>' ) );
									}
								}
							}
						} else {
							blackboard.append( '<h1><a href="' + data.url + '">' + data.url + '</a></h1>' );
							if ( data.content === '' || data.content == '<body></body>' ) {
								blackboard.append( '<p>Preview not available for this reference.</p>' );
							} else {
								blackboard.append( $.parseHTML( data.content.replace( /<a[^>]*>(.*?)<\/a>/g, '$1' ).replace( /<img .*?>/g, '' ).replace( regEx, '<span class="highlight">$1</span>' ) ) );
							}
						}
					} else {
						blackboard.append( '<h1>Preview not available for this reference.</h1>' );
					}
				},
				error: function ( xhr ) {
					console.warn( 'PRIMARY SOURCES TOOL: Will not show the reference preview. Something went wrong when calling:', ps.globals.API_ENDPOINTS.PREVIEW_SERVICE, 'The server responded with status code', xhr.status, 'Reason:', xhr.responseText );
					$( '.loader' ).remove();
					blackboard.append( '<h1>Preview not available for this reference.</h1>' );
				}
			} );
		},
		closeNav: function closeNav() {
			$( '#myNav' ).width( '0%' );
			$( '#blackboard' ).html( '' );
		},
		appendPreviewButton: function appendPreviewButton( container ) {
			if ( container.find( '.external.free' ).length > 0 ) {
				var refs = container.find( '.wikibase-snakview-property' );
				refs.each( function ( index, item ) {
					var refLabel = $( item ).children().text();
					// if(refLabel === "reference URL"){
					$( item ).append( '<a class="preview-button" onclick="mw.ps.referencePreview.openNav(\'' + $( '.wikibase-title-label' ).text() + '\',\'' +
                                                                                       $( item ).parents( '.wikibase-statementgroupview.listview-item' ).find( '.wikibase-statementgroupview-property-label' ).children().text() + '\',\'' +
                                                                                       $( item ).parents( '.wikibase-statementview.listview-item.wikibase-toolbar-item' ).find( '.wikibase-statementview-mainsnak .wikibase-snakview-value.wikibase-snakview-variation-valuesnak' ).children().text() + '\',\'' +
                                                                                       container.find( item ).closest( '.wikibase-snakview.listview-item' ).find( '.external.free' ).text() + '\'' + ',' + '$(this).closest(\'.wikibase-referenceview.listview-item.wikibase-toolbar-item.new-source\').children().find(\'.f2w-button.f2w-source\'))">Preview</a>' );
					// }
				} );
			}
		}
	};

	mw.ps = ps;

	( function appendOverlay() {
		$( '#content' ).append( '<div id="myNav" class="overlay">' +
                             '<a href="javascript:void(0)" class="closebtn" onclick="mw.ps.referencePreview.closeNav()">press q to exit or press here &times;</a>' +
                             '<div id="blackboard" class="overlay-content"></div>' +
                             '</div>' );
	}() );

	$( document ).keypress( function ( e ) {
		if ( e.key === 'q' ) {
			mw.ps.referencePreview.closeNav();
		}
	} );

	console.info( 'PRIMARY SOURCES TOOL: Reference preview loaded' );

}( mediaWiki, jQuery ) );
