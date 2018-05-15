<?php
/**
 * Hooks for the PrimarySources extension.
 *
 * @file
 * @ingroup Extensions
 */

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

	public static function onResourceLoaderTestModules( array &$testModules, ResourceLoader &$resourceLoader ) {
		$testModules['qunit']['ext.PrimarySources.tests'] = array(
			'scripts' => 'tests/qunit/ext.PrimarySources.templates.test.js',
			'dependencies' => 'ext.PrimarySources.templates',
			'localBasePath' => __DIR__,
			'remoteExtPath' => 'PrimarySources'
		);

		return true;
	}

}
