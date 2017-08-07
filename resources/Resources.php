<?php

use Wikibase\RepoAccessModule;
use Wikibase\SitesModule;

/**
 * @license GPL-2.0+
 * @author Daniel Werner
 * @author H. Snater < mediawiki@snater.com >
 *
 * @codeCoverageIgnoreStart
 */
return call_user_func( function() {
    preg_match( '+' . preg_quote( DIRECTORY_SEPARATOR ) . '(?:vendor|extensions)'
        . preg_quote( DIRECTORY_SEPARATOR ) . '.*+', __DIR__, $remoteExtPath );

    $moduleTemplate = array(
        'localBasePath' => __DIR__,
        'remoteExtPath' => '..' . $remoteExtPath[0],
    );

    $modules = array(

        'mw.config.values.wbSiteDetails' => $moduleTemplate + array(
                'class' => SitesModule::class,
            ),

        'mw.config.values.wbRepo' => $moduleTemplate + array(
                'class' => RepoAccessModule::class,
            ),

        'wikibase' => $moduleTemplate + array(
                'scripts' => array(
                    'wikibase.js',
                ),
            ),

        'wikibase.buildErrorOutput' => $moduleTemplate + array(
                'scripts' => array(
                    'wikibase.buildErrorOutput.js',
                ),
                'dependencies' => array(
                    'wikibase',
                ),
            ),

        'wikibase.sites' => $moduleTemplate + array(
                'scripts' => array(
                    'wikibase.sites.js',
                ),
                'dependencies' => array(
                    'mw.config.values.wbSiteDetails',
                    'wikibase',
                    'wikibase.Site',
                ),
            ),

    );

    $modules = array_merge(
        $modules,
        include __DIR__ . '/jquery.wikibase/resources.php',
        include __DIR__ . '/WikibaseDataModelJavascript/resources.php',
	    include __DIR__ . '/WikibaseDataModel/resources.php'
    );

    return $modules;
} );
