<?php

class SpecialPrimarySources extends SpecialPage {

    /**
     * Initialize the special page.
     */
    public function __construct() {
        // A special page should at least have a name.
        // We do this by calling the parent class (the SpecialPage class)
        // constructor method with the name as first and only parameter.
        parent::__construct( 'PrimarySources' );
    }

    /**
     * Shows the page to the user.
     * @param string $sub: The subpage string argument (if any).
     *  [[Special:HelloWorld/subpage]].
     */
    public function execute( $sub ) {
        $out = $this->getOutput();

        $out->setPageTitle( $this->msg( 'PrimarySources-placeholder' ) );

        // Parses message from .i18n.php as wikitext and adds it to the
        // page output.
        $out->addWikiMsg( 'PrimarySources-placeholder' );
    }

    protected function getGroupName() {
        return 'other';
    }
}
