<?php
/**
 * PrimarySources extension hooks.
 *
 * @file
 * @ingroup Extensions
 * @author Marco Fossati - User:Hjfocs
 * @author Tommaso Montefusco - User:Kiailandi
 * @version 2.0
 * @license GNU General Public License 3.0
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
		$testModules['qunit']['ext.PrimarySources.test'] = array(
			'scripts' => array( 'tests/ext.PrimarySources.templates.test.js' ),
			'dependencies' => array( 'ext.PrimarySources.templates' ),
			'localBasePath' => __DIR__,
			'remoteExtPath' => 'PrimarySources'
		);

		return true;
	}

}
