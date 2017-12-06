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
        $user = $this->getUser();

        $out->setPageTitle( 'Data Curation' ); 

        if($user->isLoggedIn() || $sub == "alohomora"){
            // Parses message from .i18n.php as wikitext and adds it to the
            // page output.

            $out->addHTML('<script>
                            function swap(){
                                if($("#swap").text() == "I want to update a dataset"){
                                    $("#uploadForm").hide();
                                    $("#updateForm").show();
                                    $("#swap").text("I want to upload a dataset");
                                }
                                else{
                                    $("#updateForm").hide();
                                    $("#uploadForm").show();
                                    $("#swap").text("I want to update a dataset");
                                }
                            }
                            </script>');
                            
            $out->addHTML('<button id="swap" onClick="swap()">I want to update a dataset</button><br><br>');
            
            $out->addHTML('<form id="uploadForm" action="http://it.dbpedia.org/pst/upload" method="post" enctype="multipart/form-data">
                          <label>Upload Dataset</label><br><br>
                          <input type="hidden" name="user" value="' . $user->getName() . '">
                          Dataset name: <input type="text" name="name" value="dataset name"><br>
                          Dataset file: <input type="file" name="dataset" id="dataset" multiple><br><br>
                          <input type="button" onclick="if($(\'#dataset\').get(0).files.length == 0){alert(\'Please select a file\')}else{submit()}" value="Submit">
                          </form>');

            $out->addHTML('<form id="updateForm" action="http://it.dbpedia.org/pst/update" method="post" enctype="multipart/form-data" style="display:none">
                          <label>Update Dataset</label><br><br>
                          <input type="hidden" name="user" value="' . $user->getName() . '">
                          Dataset URI: <input type="text" name="dataset" value="dataset URI"><br>
                          Dataset file to remove: <input type="file" name="remove" id="remove"><br>
                          Dataset file to add: <input type="file" name="add" id="add"><br><br>
                          <input type="button" onclick="if($(\'#remove\').get(0).files.length == 0 || $(\'#add\').get(0).files.length == 0 ){alert(\'Please select a file for both inputs\')}else{submit()}" value="Submit">
                          </form>');
        }
        else{
            $out->addWikiText( strtoupper('Please log in to use this feature') );
        }
    }

    protected function getGroupName() {
        return 'other';
    }
}
