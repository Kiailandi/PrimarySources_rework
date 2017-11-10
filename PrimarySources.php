<?php
/**
 * Example extension - based on the stripped-down extensions/BoilerPlate
 *
 * For more info see mediawiki.org/wiki/Extension:Example
 *
 * You should add a brief comment explaining what the file contains and
 * what it is for. MediaWiki core uses the doxygen documentation syntax,
 * you're recommended to use those tags to complement your comment.
 * See the online documentation at:
 * http://www.stack.nl/~dimitri/doxygen/manual.html
 *
 * Here are commonly used tags, most of them are optional, though:
 *
 * First we tag this document block as describing the entire file (as opposed
 * to a variable, class or function):
 * @file
 *
 * We regroup all extensions documentation in the group named "Extensions":
 * @ingroup Extensions
 *
 * The author would let everyone know who wrote the code, if there is more
 * than one author, add multiple author annotations:
 * @author Jane Doe
 * @author George Foo
 *
 * To mention the file version in the documentation:
 * @version 1.0
 *
 * The license governing the extension code:
 * @license GNU General Public Licence 2.0 or later
 */

/**
 * MediaWiki has several global variables which can be reused or even altered
 * by your extension. The very first one is the $wgExtensionCredits which will
 * expose to MediaWiki metadata about your extension. For additional
 * documentation, see its documentation block in includes/DefaultSettings.php
 */
$wgExtensionCredits['other'][] = array(
    'path' => __FILE__,

    // Name of your Extension:
    'name' => 'PrimarySources',

    // Sometime other patches contributors and minor authors are not worth
    // mentionning, you can use the special case '...' to output a localised
    // message 'and others...'.
    'author' => array(
        'Tommaso Montefusco'
    ),

    'version'  => '0.1.0',

    // The extension homepage. www.mediawiki.org will be happy to host
    // your extension homepage.
    'url' => 'https://www.mediawiki.org/wiki/Extension:PrimarySources',


    # Key name of the message containing the description.
    'descriptionmsg' => 'PrimarySources-desc',
);

/* Setup */

// Initialize an easy to use shortcut:
$dir = dirname( __FILE__ );
$dirbasename = basename( $dir );

// Register files
// MediaWiki need to know which PHP files contains your class. It has a
// registering mecanism to append to the internal autoloader. Simply use
// $wgAutoLoadClasses as below:
$wgAutoloadClasses['PrimarySourcesHooks'] = $dir . '/PrimarySources.hooks.php';
$wgAutoloadClasses['SpecialPrimarySources'] = $dir . '/specials/SpecialPrimarySources.php';
$wgAutoloadClasses['ApiQueryPrimarySources'] = $dir . '/api/ApiQueryPrimarySources.php';

$wgMessagesDirs['PrimarySources'] = __DIR__ . '/i18n';
$wgExtensionMessagesFiles['PrimarySourcesAlias'] = $dir . '/PrimarySources.i18n.alias.php';
$wgExtensionMessagesFiles['PrimarySourcesMagic'] = $dir . '/PrimarySources.i18n.magic.php';

$wgAPIListModules['PrimarySources'] = 'ApiQueryPrimarySources';

// Register hooks
// See also http://www.mediawiki.org/wiki/Manual:Hooks
$wgHooks['BeforePageDisplay'][] = 'PrimarySourcesHooks::onBeforePageDisplay';
$wgHooks['ResourceLoaderGetConfigVars'][] = 'PrimarySourcesHooks::onResourceLoaderGetConfigVars';
$wgHooks['ParserFirstCallInit'][] = 'PrimarySourcesHooks::onParserFirstCallInit';
# --- #
#$wgHooks['MagicWordwgVariableIDs'][] = 'PrimarySourcesHooks::onRegisterMagicWords';
# --- #
$wgHooks['ParserGetVariableValueSwitch'][] = 'PrimarySourcesHooks::onParserGetVariableValueSwitch';
$wgHooks['LoadExtensionSchemaUpdates'][] = 'PrimarySourcesHooks::onLoadExtensionSchemaUpdates';
$wgHooks['OutputPageParserOutput'] [] = 'PrimarySourcesHooks::onOutputPageParserOutput';
$wgHooks['ResourceLoaderTestModules'][] = 'PrimarySourcesHooks::onResourceLoaderTestModules';

// Register special pages
// See also http://www.mediawiki.org/wiki/Manual:Special_pages
$wgSpecialPages['HelloWorld'] = 'SpecialPrimarySources';

// Register modules
// See also http://www.mediawiki.org/wiki/Manual:$wgResourceModules
// ResourceLoader modules are the de facto standard way to easily
// load JavaScript and CSS files to the client.
$wgResourceModules['ext.PrimarySources.globals'] = array(
    'scripts' => array(
        '/modules/ext.PrimarySources.globals.js'
    ),
    'styles' => array(
    ),
    'messages' => array(
    ),
    'dependencies' => array(
    ),
    'localBasePath' => $dir,
    'remoteExtPath' => $dirbasename
);
$wgResourceModules['ext.PrimarySources.commons'] = array(
    'scripts' => array(
        '/modules/ext.PrimarySources.commons.js'
    ),
    'styles' => array(
    ),
    'messages' => array(
    ),
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
    'styles' => array(
        '/modules/ext.PrimarySources.itemCuration.css'
    ),
    'messages' => array(
    ),
    'dependencies' => array(
    ),
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
    'messages' => array(
    ),
    'dependencies' => array(
        'ext.PrimarySources.globals',
        'ext.PrimarySources.commons',
        'ext.PrimarySources.templates'
    ),
    'localBasePath' => $dir,
    'remoteExtPath' => $dirbasename
);
/* Configuration */


/** Your extension configuration settings. Since they are going to be global
 * always use a "wg" prefix + your extension name + your setting key.
 * The entire variable name should use "lowerCamelCase".
 */