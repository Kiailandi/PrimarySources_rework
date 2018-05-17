( function ( mw, $ ) {
	var ps = mw.ps || {};

	ps.referencePreview = {
		openNav: function openNav( itemLabel, propertyLabel, propertyValue, referenceURL, buttons ) {
			var blackboard = $( '#blackboard' );

			console.debug( 'Reference preview buttons passed:', buttons );

			$( '#myNav' ).width( '100%' );
			blackboard.append( $( buttons[ 0 ] ).clone( true, true ) );
			blackboard.append( $( buttons[ 1 ] ).clone( true, true ) );
			blackboard.append( '<div class="loader"></div>' );

			$.ajax( {
				type: 'GET',
				url: ps.globals.API_ENDPOINTS.PREVIEW_SERVICE + encodeURIComponent( referenceURL ),
				success: function ( msg ) {
					var data, regEx, linkList, index, item, key;

					$( '.loader' ).remove();
					if ( msg !== 'no preview' ) {
						data = JSON.parse( msg );
						regEx = new RegExp( '(' + itemLabel + '|' + propertyLabel + '|' + propertyValue + ')(?!([^<]+)?>)', 'gi' );

						if ( !data.hasOwnProperty( 'excerpt' ) ) {
							blackboard.append( '<h1><a href="' + data.url + '">' + data.url + '</a></h1>' );
							blackboard.append( '<ul></ul>' );
							linkList = $( '#blackboard > ul' );

							for ( index in data ) {
								item = data[ index ];
								if ( index !== 'url' && item !== null ) {
									if ( index === 'other' ) {
										while ( typeof item === 'string' ) {
											item = JSON.parse( item );
										}
										for ( key in item ) {
											if ( item[ key ] !== null ) {
												linkList.append( ( '<li><b>' + key + '</b>: ' + item[ key ] + '</li>' ).replace( regEx, '<span class="highlight">$1</span>' ) );
											}
										}
									} else {
										linkList.append( ( '<li><b>' + index + '</b>: ' + item + '</li>' ).replace( regEx, '<span class="highlight">$1</span>' ) );
									}
								}
							}
						} else {
							blackboard.append( '<h1><a href="' + data.url + '">' + data.url + '</a></h1>' );
							if ( data.content === '' || data.content === '<body></body>' ) {
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
			var refs, refLabel;

			if ( container.find( '.external.free' ).length > 0 ) {
				refs = container.find( '.wikibase-snakview-property' );
				refs.each( function ( index, item ) {
					refLabel = $( item ).children().text();
					if ( refLabel === 'reference URL' ) {
						$( item ).append(
							'<a class="preview-button" onclick="mw.ps.referencePreview.openNav(\'' +
								$( '.wikibase-title-label' ).text() + '\',\'' +
								$( item ).parents( '.wikibase-statementgroupview.listview-item' ).find( '.wikibase-statementgroupview-property-label' ).children().text() + '\',\'' +
								$( item ).parents( '.wikibase-statementview.listview-item.wikibase-toolbar-item' ).find( '.wikibase-statementview-mainsnak .wikibase-snakview-value.wikibase-snakview-variation-valuesnak' ).children().text() + '\',\'' +
								container.find( item ).closest( '.wikibase-snakview.listview-item' ).find( '.external.free' ).text() + '\',' +
								'$(this).closest(\'.wikibase-referenceview.listview-item.wikibase-toolbar-item.new-source\').children().find(\'.pst-button.pst-source\'))' +
							'">Preview</a>' );
					}
				} );
			}
		}
	};

	( function appendOverlay() {
		$( '#content' ).append(
			'<div id="myNav" class="overlay">' +
				'<a href="javascript:void(0)" class="closebtn" onclick="mw.ps.referencePreview.closeNav()">press q to exit or press here &times;</a>' +
				'<div id="blackboard" class="overlay-content"></div>' +
			'</div>' );
	}() );

	// Bind 'q' to close the preview, as 'Esc' conflicts with closing the filter dialog
	$( document ).keypress( function ( e ) {
		if ( e.key === 'q' ) {
			mw.ps.referencePreview.closeNav();
		}
	} );

	mw.ps = ps;

	console.info( 'PRIMARY SOURCES TOOL: Reference preview loaded' );

}( mediaWiki, jQuery ) );
