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

$wgExtensionCredits['other'][] = array(
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

/* Setup */
$dir = dirname( __FILE__ );
$dirbasename = basename( $dir );

// Register files
$wgAutoloadClasses['PrimarySourcesHooks'] = $dir . '/PrimarySources.hooks.php';
$wgAutoloadClasses['SpecialPrimarySources'] = $dir . '/specials/SpecialPrimarySources.php';

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
// See also http://www.mediawiki.org/wiki/Manual:Special_pages
$wgSpecialPages['Ingestion'] = 'SpecialPrimarySources';

// Register JavaScript modules
// See also http://www.mediawiki.org/wiki/Manual:$wgResourceModules
$wgResourceModules['ext.PrimarySources.globals'] = array(
    'scripts' => array(
        '/modules/ext.PrimarySources.globals.js'
    ),
    'styles' => array(),
    'messages' => array(),
    'dependencies' => array(),
    'localBasePath' => $dir,
    'remoteExtPath' => $dirbasename
);
$wgResourceModules['ext.PrimarySources.commons'] = array(
    'scripts' => array(
        '/modules/ext.PrimarySources.commons.js'
    ),
    'styles' => array(),
    'messages' => array(),
    'dependencies' => array(
        'ext.PrimarySources.globals'
    ),
    'localBasePath' => $dir,
    'remoteExtPath' => $dirbasename
);
$wgResourceModules['ext.PrimarySources.templates'] = array(
    'scripts' => array(
        '/modules/ext.PrimarySources.templates.js'
    ),
    'styles' => array(),
    'messages' => array(),
    'dependencies' => array(),
    'localBasePath' => $dir,
    'remoteExtPath' => $dirbasename
);
$wgResourceModules['ext.PrimarySources.itemCuration'] = array(
    'scripts' => array(
        '/modules/ext.PrimarySources.itemCuration.js'
    ),
    'styles' => array(
        '/modules/ext.PrimarySources.itemCuration.css'
    ),
    'messages' => array(),
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
    'scripts' => array(
        '/modules/ext.PrimarySources.filter.js'
    ),
    'styles' => array(),
    'messages' => array(),
    'dependencies' => array(
        'ext.PrimarySources.globals',
        'ext.PrimarySources.commons',
        'ext.PrimarySources.referencePreview'
    ),
    'localBasePath' => $dir,
    'remoteExtPath' => $dirbasename
);
$wgResourceModules['ext.PrimarySources.sidebar'] = array(
    'scripts' => array(
        '/modules/ext.PrimarySources.sidebar.js'
    ),
    'styles' => array(
        '/modules/ext.PrimarySources.sidebar.css'
    ),
    'messages' => array(),
    'dependencies' => array(
        'ext.PrimarySources.globals',
        'ext.PrimarySources.commons',
        'ext.PrimarySources.filter'
    ),
    'localBasePath' => $dir,
    'remoteExtPath' => $dirbasename
);
