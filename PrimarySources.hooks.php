<?php
/**
 * Hooks for the PrimarySources extension
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
	public static function onBeforePageDisplay( OutputPage &$out, Skin &$skin ) {
		$out->addModules( 'ext.PrimarySources.globals' );
		$out->addModules( 'ext.PrimarySources.commons' );
		$out->addModules( 'ext.PrimarySources.templates' );
		$out->addModules( 'ext.PrimarySources.sidebar' );
		$out->addModules( 'ext.PrimarySources.itemCuration' );
		$out->addModules( 'ext.PrimarySources.referencePreview' );
		$out->addModules( 'ext.PrimarySources.filter' );

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

}
