( function ( mw, $ ) {
	var ps = mw.ps || {},
		// Used in multiple functions by the property browser
		ANCHOR_LIST = [],
		SPECIAL_PAGE = 'Special:IngestDataset';

	// Private function
	function scrollFollowTop( $sidebar ) {
		var $window = $( window ),
			offset = $sidebar.offset(),
			topPadding = 15;

		$window.scroll( function () {
			if ( $window.scrollTop() > offset.top ) {
				$sidebar.stop().animate( {
					marginTop: $window.scrollTop() - offset.top + topPadding
				}, 200 );
			} else {
				$sidebar.stop().animate( {
					marginTop: 0
				}, 200 );
			}
		} );
	}

	/*
	 * BEGIN: public functions
	 */
	ps.sidebar = {
		/* BEGIN: dataset selection */
		initConfigDialog: function initConfigDialog( windowManager, button ) {
			function ConfigDialog( config ) {
				ConfigDialog.super.call( this, config );
			}
			// Main dialog settings
			OO.inheritClass( ConfigDialog, OO.ui.ProcessDialog );
			ConfigDialog.static.name = 'ps-config';
			ConfigDialog.static.title = 'Choose a primary sources dataset';
			ConfigDialog.static.actions = [
				{
					action: 'save',
					label: 'Save',
					flags: [ 'primary', 'progressive' ],
					icon: 'check'
				},
				{
					label: 'Cancel',
					flags: [ 'safe', 'destructive' ],
					icon: 'close'
				}
			];

			ConfigDialog.prototype.initialize = function () {
				var datasetSelection,
					availableDatasets = [
						new OO.ui.RadioOptionWidget( {
							data: '',
							label: 'All'
						} )
					],
					datasetDescriptionWidget = new OO.ui.LabelWidget(),
					missingStatementsWidget = new OO.ui.LabelWidget(),
					totalStatementsWidget = new OO.ui.LabelWidget(),
					uploaderWidget = new OO.ui.LabelWidget(),
					datasetsPanel = new OO.ui.PanelLayout( {
						padded: true,
						expanded: false,
						scrollable: false
					} ),
					infoFields = new OO.ui.FieldsetLayout(),
					infoPanel = new OO.ui.PanelLayout( {
						padded: true,
						expanded: false,
						scrollable: false
					} ),
					// See https://doc.wikimedia.org/oojs-ui/master/js/#!/api/OO.ui.MenuLayout
					layout = new OO.ui.MenuLayout( {
						position: 'before',
						expanded: false
					} );

				ConfigDialog.super.prototype.initialize.apply( this, arguments );

				/* BEGIN: available datasets as radio options */
				// Fill the options with the available datasets
				ps.commons.getDatasets( function ( datasets ) {
					datasets.forEach( function ( item ) {
						var uri = item.dataset;
						availableDatasets.push( new OO.ui.RadioOptionWidget( {
							data: uri,
							label: ps.commons.datasetUriToLabel( uri )
						} ) );
					} );
				} );
				datasetSelection = new OO.ui.RadioSelectWidget( {
					items: availableDatasets
				} )
					.connect( this, { select: 'setDatasetInfo' } );
				this.datasetSelection = datasetSelection;
				/* END: datasets as radio options */

				/* BEGIN: selected dataset info */
				this.datasetDescriptionWidget = datasetDescriptionWidget;
				this.missingStatementsWidget = missingStatementsWidget;
				this.totalStatementsWidget = totalStatementsWidget;
				this.uploaderWidget = uploaderWidget;
				infoFields.addItems( [
					new OO.ui.FieldLayout( datasetDescriptionWidget, {
						align: 'top',
						label: 'Description:'
					} ),
					new OO.ui.FieldLayout( missingStatementsWidget, {
						align: 'top',
						label: 'Missing statements:'
					} ),
					new OO.ui.FieldLayout( totalStatementsWidget, {
						align: 'top',
						label: 'Total statements:'
					} ),
					new OO.ui.FieldLayout( uploaderWidget, {
						align: 'top',
						label: 'Author:'
					} )
				] );
				this.infoPanel = infoPanel;
				/* END: selected dataset info */

				/* BEGIN: final result as a menu layout */
				// Add the radio options to the layout
				layout.$menu.append(
					datasetsPanel.$element.append( datasetSelection.$element )
				);
				// Add the selected dataset info to the layout
				layout.$content.append(
					infoPanel.$element.append( infoFields.$element )
				);
				// Add the the menu layout to the main dialog
				this.$body.append( layout.$element );
				/* END: final result as a menu layout */
			};

			ConfigDialog.prototype.setDatasetInfo = function () {
				var datasetDescriptionWidget = this.datasetDescriptionWidget,
					missingStatementsWidget = this.missingStatementsWidget,
					totalStatementsWidget = this.totalStatementsWidget,
					uploaderWidget = this.uploaderWidget,
					selected = this.datasetSelection.findSelectedItem();
				/*
				 * IF:
				 * 1. we switch off the info panel;
				 * 2. the user clicks on 'cancel';
				 * 3. the user reopens the dialog;
				 * 4. the user selects a dataset;
				 * THEN the dialog height will not fit.
				 * Replace with empty labels instead.
				 */
				if ( selected.getLabel() === 'All' ) {
					datasetDescriptionWidget.setLabel();
					missingStatementsWidget.setLabel();
					totalStatementsWidget.setLabel();
					uploaderWidget.setLabel();
				} else {
					$.get(
						ps.globals.API_ENDPOINTS.STATISTICS_SERVICE,
						{ dataset: selected.getData() },
						function ( data ) {
							var description = data.description ?
								new OO.ui.HtmlSnippet(
									'<i>' + data.description + '</i>'
								) :
								new OO.ui.HtmlSnippet(
									'<i>Not available</i>'
								);
							datasetDescriptionWidget.setLabel( description );
							missingStatementsWidget.setLabel(
								new OO.ui.HtmlSnippet(
									'<b>' +
									data.missing_statements.toLocaleString() +
									'</b>'
								)
							);
							totalStatementsWidget.setLabel(
								new OO.ui.HtmlSnippet(
									'<b>' +
									data.total_statements.toLocaleString() +
									'</b>'
								)
							);
							uploaderWidget.setLabel(
								new OO.ui.HtmlSnippet(
									'<a href="' + data.uploader + '">' +
									data.uploader.split( 'User:' )[ 1 ] +
									'</a>' ) );
						}
					);
				}
			};

			ConfigDialog.prototype.getActionProcess = function ( action ) {
				if ( action === 'save' ) {
					mw.cookie.set(
						'ps-dataset',
						this.datasetSelection.findSelectedItem().getData()
					);
					return new OO.ui.Process( function () {
						location.reload();
					} );
				}

				return ConfigDialog.super.prototype.getActionProcess.call( this, action );
			};

			windowManager.addWindows( [ new ConfigDialog() ] );
			button.click( function () {
				windowManager.openWindow( 'ps-config' );
			} );
		},
		/* END: dataset selection */

		alphaPos: function alphaPos( text ) {
			var i;

			if ( text <= ANCHOR_LIST[ 0 ] ) {
				return 0;
			}
			for ( i = 0; i < ANCHOR_LIST.length - 1; i++ ) {
				if ( text > ANCHOR_LIST[ i ] && text < ANCHOR_LIST[ i + 1 ] ) {
					return i + 1;
				}
			}
			return ANCHOR_LIST.length;
		},

		appendToNav: function appendToNav( container ) {
			var anchor, textWithoutSpace, textWithSpace, pos,
				firstNewObj =
					$( container ).find( '.new-object' )[ 0 ] ||
					$( container ).find( '.new-source' )[ 0 ];

			if ( firstNewObj ) {
				anchor = {
					title: $( container ).find(
						'.wikibase-statementgroupview-property-label'
					),
					target: $( firstNewObj ).find(
						'.valueview-instaticmode'
					)[ 0 ]
				};
				textWithoutSpace = anchor.title.text().replace( /\W/g, '' );
				textWithSpace = anchor.title.text().replace( /[^\w\s]/g, '' );
				if ( ANCHOR_LIST.indexOf( textWithoutSpace ) === -1 ) {
					pos = ps.sidebar.alphaPos( textWithoutSpace );
					ANCHOR_LIST.splice( pos, 0, textWithoutSpace );
					if ( pos === 0 ) {
						$( '#p-ps-nav-list' ).prepend(
							'<li id="n-ps-anchor-' + textWithoutSpace + '">' +
							'<a href="#" title="move to ' + textWithSpace + '">' +
							textWithSpace + '</a></li>'
						);
					} else {
						$( '#n-ps-anchor-' + ANCHOR_LIST[ pos - 1 ] ).after(
							'<li id="n-ps-anchor-' + textWithoutSpace + '">' +
							'<a href="#" title="move to ' + textWithSpace + '">' +
							textWithSpace + '</a></li>'
						);
					}
					$( '#n-ps-anchor-' + textWithoutSpace ).click( function ( e ) {
						e.preventDefault();
						anchor.target.scrollIntoView();
					} );
				}
			}
		}
	};
	/*
	 * END: public functions
	 */

	/* BEGIN: sidebar links, self-invoking */
	mw.loader.using(
		[ 'mediawiki.util', 'mediawiki.Title', 'oojs-ui', 'wikibase.dataTypeStore' ],
		function createSidebarLinks() {
			var filterLink, randomItemLink, datasetSelectionLink,
				datasetLabel = ps.globals.DATASET ?
					ps.commons.datasetUriToLabel( ps.globals.DATASET ) :
					'',
				windowManager = new OO.ui.WindowManager();

			// Primary sources tool dedicated portlet, before the suggestion browser
			$( '#p-tb' ).after(
				$( '<div>' )
					.addClass( 'portal' )
					.attr( {
						role: 'navigation',
						id: 'p-pst',
						'aria-labelledby': 'p-pst-label'
					} )
					.append( $( '<h3>' )
						.attr( 'id', 'p-pst-label' )
						.text( 'Primary sources tool' )
					)
					// Needed to style the links
					.append( $( '<div>' )
						.addClass( 'body' )
					)
			);

			// Filter
			filterLink = $( mw.util.addPortletLink(
				'p-pst',
				'#',
				'Filter',
				'n-pst-filter',
				'Browse and curate available data'
			) );

			// Random item
			randomItemLink = $( mw.util.addPortletLink(
				'p-pst',
				'#',
				'Random ' + datasetLabel + ' item',
				'n-pst-random',
				'Go to a random item with statement suggestions'
			) );
			// Bind link click to /random service call
			randomItemLink.children().click( function ( e ) {
				e.preventDefault();
				e.target.innerHTML = '<img src="https://upload.wikimedia.org/' +
				'wikipedia/commons/f/f8/Ajax-loader%282%29.gif" class="ajax"/>';
				$.ajax( {
					url: ps.globals.API_ENDPOINTS.RANDOM_SERVICE + '?dataset=' + ps.globals.DATASET
				} ).done( function ( data ) {
					var newQid = data[ 0 ].statement.split( /\t/ )[ 0 ];
					document.location.href = document.location.origin + '/wiki/' + newQid;
				} ).fail( function () {
					return ps.commons.reportError( 'Could not obtain random primary sources item' );
				} );
			} );

			// Dataset selection
			datasetSelectionLink = $( mw.util.addPortletLink(
				'p-pst',
				'#',
				'Choose dataset',
				'n-pst-datasets',
				'Get info and pick your primary sources dataset'
			) );

			// Dataset upload/update
			$( mw.util.addPortletLink(
				'p-pst',
				mw.Title.newFromText( SPECIAL_PAGE ).getUrl(),
				'Upload dataset',
				'n-pst-upload',
				'Upload or update a dataset to the primary sources database'
			) );

			$( 'body' ).append( windowManager.$element );
			// Bind filter link to filter modal window (function in filter module)
			ps.filter.initFilterDialog( windowManager, filterLink );
			// Bind dataset selection link to modal window (function in this module)
			ps.sidebar.initConfigDialog( windowManager, datasetSelectionLink );
		} );
	/* END: sidebar links, self-invoking */

	/* BEGIN: browse suggested claims, self-invoking */
	mw.loader.using( [ 'mediawiki.util' ], function generateNav() {
		var navigation;

		$( '#mw-panel' ).append(
			'<div class="portal" role="navigation" id="p-ps-navigation" ' +
			'aria-labelledby="p-ps-navigation-label">' +
			'<h3 id="p-ps-navigation-label">Browse item suggestions</h3>' +
			'</div>'
		);
		navigation = $( '#p-ps-navigation' );
		navigation.append( '<div class="body"><ul id="p-ps-nav-list"></ul></div>' );
		$( '#p-ps-nav-list' ).before(
			'<a href="#" id="n-ps-anchor-btt" title="move to top">' +
			'&#x25B2 back to top &#x25B2' +
			'</a>'
		);
		$( '#n-ps-anchor-btt' ).click( function ( e ) {
			e.preventDefault();
			$( 'html,body' ).animate( {
				scrollTop: 0
			}, 0 );
		} );
		scrollFollowTop( navigation );
	} );
	/* END: browse suggested claims, self-invoking */

	mw.ps = ps;

	console.info( 'PRIMARY SOURCES TOOL: Sidebar facilities loaded' );

}( mediaWiki, jQuery ) );
