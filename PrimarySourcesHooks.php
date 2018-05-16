<?php
/**
 * PrimarySources extension hooks.
 *
 * @file
 * @ingroup Extensions
 * @author Marco Fossati - User:Hjfocs
 * @author Tommaso Montefusco - User:Kiailandi
 * @version 2.0
 * @license GPL-3.0-or-later
 */

class PrimarySourcesHooks {
	/**
	 * Add the PrimarySources front-end JavaScript modules to the page view.
	 * Implemented as a handler for the BeforePageDisplay hook.
	 *
	 * @param OutputPage &$out The page view.
	 * @param Skin &$skin The user interface skin.
	 * @return bool Always true.
	 */
	public static function onBeforePageDisplay( OutputPage &$out, Skin &$skin ) {
		$out->addModules( 'ext.PrimarySources.globals' );
		$out->addModules( 'ext.PrimarySources.commons' );
		$out->addModules( 'ext.PrimarySources.templates' );
		$out->addModules( 'ext.PrimarySources.referencePreview' );
		$out->addModules( 'ext.PrimarySources.itemCuration' );
		$out->addModules( 'ext.PrimarySources.filter' );
		$out->addModules( 'ext.PrimarySources.sidebar' );

		return true;
	}

	/**
	 * Handler for the ResourceLoaderTestModules hook.
	 *
	 * @param array &$testModules The ResourceLoader test modules array.
	 * @param ResourceLoader &$resourceLoader The ResourceLoader controller.
	 * @return bool Always true.
	 */
	public static function onResourceLoaderTestModules(
		array &$testModules, ResourceLoader &$resourceLoader ) {
		$testModules['qunit']['ext.PrimarySources.test'] = [
			'scripts' => [ 'tests/ext.PrimarySources.templates.test.js' ],
			'dependencies' => [ 'ext.PrimarySources.templates' ],
			'localBasePath' => __DIR__,
			'remoteExtPath' => 'PrimarySources'
		];

		return true;
	}

}
