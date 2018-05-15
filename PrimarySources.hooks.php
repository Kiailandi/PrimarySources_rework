<?php
/**
 * Hooks for PrimarySources extension
 *
 * @file
 * @ingroup Extensions
 */

use Wikibase\DataModel\Entity\Item;
use Wikibase\Repo\WikibaseRepo;
use Wikibase\View\SnakHtmlGenerator;
use Wikibase\Repo\SnakFactory;
use Wikibase\View\Template\TemplateFactory;
use Wikibase\DataModel\Entity\PropertyId;
use Wikibase\DataModel\Snak\PropertyNoValueSnak;
use Wikibase\View\Template\TemplateRegistry;
use Wikibase\Lib\SnakFormatter;
use Wikibase\DataModel\Services\EntityId\EntityIdLabelFormatter;
use Wikibase\DataModel\Services\EntityId\EscapingEntityIdFormatter;
use Wikibase\DataModel\Services\Lookup\EntityRetrievingTermLookup;
use Wikibase\DataModel\Services\Lookup\LanguageLabelDescriptionLookup;
use Wikibase\Lib\EntityIdHtmlLinkFormatter;
use Wikibase\Lib\LanguageNameLookup;
use Wikibase\Repo\Content\EntityContentDiff;
use Wikibase\Repo\Diff\ClaimDiffer;
use Wikibase\Repo\Diff\ClaimDifferenceVisualizer;
use Wikibase\Repo\Diff\DifferencesSnakVisualizer;
use Wikibase\Repo\Diff\EntityDiffVisualizer;
use Wikibase\View\DummyLocalizedTextProvider;
use ValueFormatters\FormatterOptions;
use ValueFormatters\ValueFormatter;

class PrimarySourcesHooks {
	/**
	 * Add welcome module to the load queue of all pages
	 */
	public static function onBeforePageDisplay( OutputPage &$out, Skin &$skin ) {
		/*global $wgExampleEnableWelcome;

		if ( $wgExampleEnableWelcome ) {
			$out->addModules( 'ext.Example.welcome.init' );
		}*/

		$out->addModules( 'ext.PrimarySources.globals' );
		$out->addModules( 'ext.PrimarySources.commons' );
		$out->addModules( 'ext.PrimarySources.templates' );
		$out->addModules( 'ext.PrimarySources.sidebar' );
		$out->addModules( 'ext.PrimarySources.itemCuration' );
		$out->addModules( 'ext.PrimarySources.referencePreview' );
		$out->addModules( 'ext.PrimarySources.filter' );

		// Always return true, indicating that parser initialization should
		// continue normally.
		return true;
	}

	/**
	 * Expose configuration variables through mw.config in javascript.
	 */
	public static function onResourceLoaderGetConfigVars( &$vars ) {
		/*global $wgExampleEnableWelcome, $wgExampleWelcomeColorDefault, $wgExampleWelcomeColorDays;

		if ( $wgExampleEnableWelcome ) {
			$vars['wgExampleWelcomeColorDefault'] = $wgExampleWelcomeColorDefault;
			$vars['wgExampleWelcomeColorDays'] = $wgExampleWelcomeColorDays;
		}
		*/
		return true;
	}

	/**
	 * Register parser hooks
	 * See also http://www.mediawiki.org/wiki/Manual:Parser_functions
	 */
	public static function onParserFirstCallInit( &$parser ) {
		/*
		// Add the following to a wiki page to see how it works:
		//  <dump>test</dump>
		//  <dump foo="bar" baz="quux">test content</dump>
		$parser->setHook( 'dump', 'PrimarySourcesHooks::parserTagDump' );

		// Add the following to a wiki page to see how it works:
		//  {{#echo: hello }}
		$parser->setFunctionHook( 'echo', 'PrimarySourcesHooks::parserFunctionEcho' );

		// Add the following to a wiki page to see how it works:
		//  {{#showme: hello | hi | there }}
		$parser->setFunctionHook( 'showme', 'PrimarySourcesHooks::parserFunctionShowme' );
		*/
		return true;
	}

	public static function onRegisterMagicWords( &$magicWordsIds ) {
		// Add the following to a wiki page to see how it works:
		//  {{MYWORD}}
		$magicWordsIds[] = 'myword';

		return true;
	}

	public static function onParserGetVariableValueSwitch( &$parser, &$cache, &$magicWordId, &$ret ) {
		/*if ( $magicWordId === 'myword' ) {
			// Return value and cache should match. Cache is used to save
			// additional call when it is used multiple times on a page.
			$ret = $cache['myword'] = self::parserGetWordMyword();
		}*/

		return true;
	}

	/**
	 * This registers our database schema update(s)
	 */
	public static function onLoadExtensionSchemaUpdates( $updater ) {
		/*$updater->addExtensionTable( 'example_note', __DIR__ . '/sql/add-example_note.sql' );*/

		return true;
	}

	public static function onOutputPageParserOutput(OutputPage &$out){
		$wikibaseRepo = WikibaseRepo::getDefaultInstance();
		$formatterFactory = $wikibaseRepo->getSnakFormatterFactory();
		$termLookup = new EntityRetrievingTermLookup( $wikibaseRepo->getEntityLookup() );
		$labelDescriptionLookup = new LanguageLabelDescriptionLookup( $termLookup, "en" );
		$labelFormatter = new EntityIdLabelFormatter( $labelDescriptionLookup );
		$newProperty = new PropertyId('P2' );
		$newSnak = new PropertyNoValueSnak( $newProperty );
		$options = new FormatterOptions( array(
			//TODO: fallback chain
			ValueFormatter::OPT_LANG => "en"
		) );
		$snakBreadCrumbFormatter = $formatterFactory->getSnakFormatter( SnakFormatter::FORMAT_HTML, $options);
		$newSnakHTMLGenerator  = new SnakHtmlGenerator(
			TemplateFactory::getDefaultInstance(),
			$snakBreadCrumbFormatter,
			new EscapingEntityIdFormatter( $labelFormatter, 'htmlspecialchars' ),
			new DummyLocalizedTextProvider()
		);
		$newHTML = $newSnakHTMLGenerator->getSnakHtml( $newSnak );
		$out->addHTML($newHTML);
		return true;
	}

	public static function onResourceLoaderTestModules( array &$testModules, ResourceLoader &$resourceLoader ) {
		$boilerplate = [
			'localBasePath' => __DIR__,
			'remoteExtPath' => 'PrimarySources',
		];
		
		/*$testModules['qunit']['ext.PrimarySources.tests'] = $boilerplate + array(
			'dependencies' => ['ext.PrimarySources.templates'],
			'scripts' => ['tests/qunit/ext.PrimarySources.templates.test.js']
		);*/
		return true;
	}

	/**
	 * Parser magic word handler for {{MYWORD}}
	 *
	 * @return string: Wikitext to be rendered in the page.
	 */
	public static function parserGetWordMyword() {
		/*global $wgExampleMyWord;

		return wfEscapeWikiText( $wgExampleMyWord );*/
	}

	/**
	 * Parser hook handler for <dump>
	 *
	 * @param string $data: The content of the tag.
	 * @param array $params: The attributes of the tag.
	 * @param Parser $parser: Parser instance available to render
	 *  wikitext into html, or parser methods.
	 * @param PPFrame $frame: Can be used to see what template
	 *  arguments ({{{1}}}) this hook was used with.
	 *
	 * @return string: HTML to insert in the page.
	 */
	public static function parserTagDump( $data, $attribs, $parser, $frame ) {
		$dump =  array(
			'content' => $data,
			'atributes' => (object)$attribs,
		);

		// Very important to escape user data with htmlspecialchars() to prevent
		// an XSS security vulnerability.
		$html = '<pre>Dump Tag: '
			. htmlspecialchars( FormatJson::encode( $dump, /*prettyPrint=*/true ) )
			. '</pre>';

		return $html;
	}

	/**
	 * Parser function handler for {{#echo: .. }}
	 *
	 * @param Parser $parser
	 * @param string $value
	 *
	 * @return string: HTML to insert in the page.
	 */
	public static function parserFunctionEcho( $parser, $value ) {
		//return '<pre>Echo Function: ' . htmlspecialchars( $value ) . '</pre>';
	}

	/**
	 * Parser function handler for {{#showme: .. | .. }}
	 *
	 * @param Parser $parser
	 * @param string $arg
	 *
	 * @return string: HTML to insert in the page.
	 */
	public static function parserFunctionShowme( $parser, $value /* arg2, arg3, */ ) {
		//$args = array_slice( func_get_args(), 2 );
		//$showme = array(
		//    'value' => $value,
		//    'arguments' => $args,
		//);

		//return '<pre>Showme Function: '
		//    . htmlspecialchars( FormatJson::encode( $showme, /*prettyPrint=*/true ) )
		//    . '</pre>';
	}
}
