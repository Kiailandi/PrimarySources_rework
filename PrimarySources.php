<?php
/**
 * Wikidata primary sources tool version 2.
 * 
 * This extension is the front-end component of the tool.
 * See the following links for more information:
 * https://www.wikidata.org/wiki/Wikidata:Primary_sources_tool
 * https://phabricator.wikimedia.org/project/profile/2788/
 * https://meta.wikimedia.org/wiki/Grants:IEG/StrepHit:_Wikidata_Statements_Validation_via_References/Renewal/Timeline
 *
 * @file
 * @ingroup Extensions
 * @author Marco Fossati - User:Hjfocs
 * @author Tommaso Montefusco - User:Kiailandi
 * @version 2.0
 * @license GNU General Public Licence 3.0
 */

 // See https://www.mediawiki.org/wiki/Manual:$wgExtensionCredits
$wgExtensionCredits['datavalues'][] = array(
    'path' => __FILE__,
    'name' => 'PrimarySources',
    'author' => array(
        'Marco Fossati',
        'Tommaso Montefusco'
    ),
    'version'  => '2.0',
    'url' => 'https://www.mediawiki.org/wiki/Extension:PrimarySources',
    'descriptionmsg' => 'PrimarySources-desc'
);

$dir = dirname( __FILE__ );
$dirbasename = basename( $dir );

// Register files
$wgAutoloadClasses['PrimarySourcesHooks'] = $dir . '/PrimarySources.hooks.php';
$wgAutoloadClasses['SpecialPrimarySources'] = $dir . '/SpecialPrimarySources.php';

$wgMessagesDirs['PrimarySources'] = __DIR__ . '/i18n';
$wgExtensionMessagesFiles['PrimarySourcesAlias'] = $dir . '/PrimarySources.i18n.alias.php';
$wgExtensionMessagesFiles['PrimarySourcesMagic'] = $dir . '/PrimarySources.i18n.magic.php';

// Register hooks
$wgHooks['BeforePageDisplay'][] = 'PrimarySourcesHooks::onBeforePageDisplay';
$wgHooks['ResourceLoaderGetConfigVars'][] = 'PrimarySourcesHooks::onResourceLoaderGetConfigVars';
$wgHooks['ParserFirstCallInit'][] = 'PrimarySourcesHooks::onParserFirstCallInit';
$wgHooks['ParserGetVariableValueSwitch'][] = 'PrimarySourcesHooks::onParserGetVariableValueSwitch';
$wgHooks['LoadExtensionSchemaUpdates'][] = 'PrimarySourcesHooks::onLoadExtensionSchemaUpdates';
$wgHooks['OutputPageParserOutput'] [] = 'PrimarySourcesHooks::onOutputPageParserOutput';
$wgHooks['ResourceLoaderTestModules'][] = 'PrimarySourcesHooks::onResourceLoaderTestModules';

// Register special pages
// See http://www.mediawiki.org/wiki/Manual:Special_pages
$wgSpecialPages['PrimarySources'] = 'SpecialPrimarySources';

// Register JavaScript modules
// See http://www.mediawiki.org/wiki/Manual:$wgResourceModules
$wgResourceModules['ext.PrimarySources.globals'] = array(
    'scripts' => '/modules/ext.PrimarySources.globals.js',
    'localBasePath' => $dir,
    'remoteExtPath' => $dirbasename
);
$wgResourceModules['ext.PrimarySources.commons'] = array(
    'scripts' => '/modules/ext.PrimarySources.commons.js',
    'dependencies' => 'ext.PrimarySources.globals',
    'localBasePath' => $dir,
    'remoteExtPath' => $dirbasename
);
$wgResourceModules['ext.PrimarySources.templates'] = array(
    'scripts' => '/modules/ext.PrimarySources.templates.js',
    'localBasePath' => $dir,
    'remoteExtPath' => $dirbasename
);
$wgResourceModules['ext.PrimarySources.itemCuration'] = array(
    'scripts' => '/modules/ext.PrimarySources.itemCuration.js',
    'styles' => '/modules/ext.PrimarySources.itemCuration.css',
    'dependencies' => array(
        'ext.PrimarySources.globals',
        'ext.PrimarySources.commons',
        'ext.PrimarySources.templates',
        'ext.PrimarySources.referencePreview'
    ),
    'localBasePath' => $dir,
    'remoteExtPath' => $dirbasename
);
$wgResourceModules['ext.PrimarySources.filter'] = array(
    'scripts' => '/modules/ext.PrimarySources.filter.js',
    'dependencies' => array(
        'ext.PrimarySources.globals',
        'ext.PrimarySources.commons',
        'ext.PrimarySources.referencePreview'
    ),
    'localBasePath' => $dir,
    'remoteExtPath' => $dirbasename
);
$wgResourceModules['ext.PrimarySources.sidebar'] = array(
    'scripts' => '/modules/ext.PrimarySources.sidebar.js',
    'styles' => '/modules/ext.PrimarySources.sidebar.css',
    'dependencies' => array(
        'ext.PrimarySources.globals',
        'ext.PrimarySources.commons',
        'ext.PrimarySources.filter'
    ),
    'localBasePath' => $dir,
    'remoteExtPath' => $dirbasename
);
