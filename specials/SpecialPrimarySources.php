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
     */
    public function execute( $sub ) {
        $BASE_URI = 'https://pst.wmflabs.org/pst/';
        $DATASETS_SERVICE = $BASE_URI . 'datasets';
        $UPLOAD_SERVICE = $BASE_URI . 'upload';
        $UPDATE_SERVICE = $BASE_URI . 'update';

        $out = $this->getOutput();
        $user = $this->getUser();

        $out->setPageTitle( 'Upload or update dataset' ); 

        if($user->isLoggedIn()){
            $datasets = json_decode(file_get_contents($DATASETS_SERVICE));
            $keyUser = "user";
            $keyDataset = "dataset";
            $userDatasets = [];
            for($i = 0; $i < count($datasets); $i++){
                preg_match('/User:([^\/]+)/', $datasets[$i]->$keyUser, $re);
                if($re[1] == $user->getName()){
                    array_push($userDatasets, $datasets[$i]->$keyDataset);
                }
            }
            // Enable update only if the user has uploaded at least a dataset
            if(count($userDatasets) > 0){
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
                                
                $out->addHTML('<button id="swap" onClick="swap()">I want to update a dataset</button><br /><br />');
                
                $updateHtml= '<form id="updateForm" action="' . $UPDATE_SERVICE . '" method="post" enctype="multipart/form-data" style="display:none">
                    <input type="hidden" name="user" value="' . $user->getName() . '">
                    <fieldset>
                    <legend>Update</legend>
                    <table><tbody>
                    <tr class="mw-htmlform-field-"><td class="mw-label"><label for="datasetToUpdate">Dataset name to update:</label></td><td class="mw-input"><select id="datasetToUpdate" name="name">';

                for($i = 0; $i < count($userDatasets); $i++){
                    $updateHtml.= '<option value="' . $userDatasets[$i] . '">' . explode('/', $userDatasets[$i])[2] . '</option>';
                }

                $updateHtml.='</select></td></tr>
                    <tr class="mw-htmlform-field-UpdateSourceField"><td class="mw-label"><label for="datasetToRemove">Dataset file to remove:</label></td><td class="mw-input"><input id="datasetToRemove" name="remove" type="file"></td></tr>
                    <tr class="mw-htmlform-field-UpdateSourceField"><td class="mw-label"><label for="datasetToAdd">Dataset file to add:</label></td><td class="mw-input"><input id="datasetToAdd" name="add" type="file"></td></tr>
                    </tbody></table>
                    </fieldset>
                    <input type="button" onclick="if($(\'#remove\').get(0).files.length === 0 || $(\'#add\').get(0).files.length === 0 ){alert(\'Please select a file for both inputs\')}else{submit()}" value="Submit">
                    </form>';
                $out->addHTML($updateHtml);
            }

            $out->addHTML('<form id="uploadForm" action="' . $UPLOAD_SERVICE . '" method="post" enctype="multipart/form-data">
                <input type="hidden" name="user" value="' . $user->getName() . '">
                <fieldset>
                <legend>Upload</legend>
                <table><tbody>
                <tr class="mw-htmlform-field-HTMLTextField"><td class="mw-label"><label for="datasetName">Dataset name:</label></td><td class="mw-input"><input id="datasetName" type="text" name="name" value=""></td></tr>
                <tr class="mw-htmlform-field-UploadSourceField"><td class="mw-label"><label for="datasetFiles">Dataset files:</label></td><td class="mw-input"><input id="datasetFiles" type="file" name="dataset" multiple></td></tr>
                <tr><td colspan="2" class="htmlform-tip">Maximum file size: 250 MB</td></tr>
                <tr><td colspan="2" class="htmlform-tip">File format allowed: RDF</td></tr>
                </tbody></table>
                </fieldset>
                <input type="button" onclick="if($(\'#dataset\').get(0).files.length === 0){alert(\'Please select a file\')}else{submit()}" value="Submit">
                </form>');

        }
        else{
            $out->addWikiText( strtoupper('please log in to use this feature') );
        }
    }

    protected function getGroupName() {
        return 'other';
    }
}
