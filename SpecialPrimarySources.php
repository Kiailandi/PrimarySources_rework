<?php
/**
 * PrimarySources special page.
 * Lets a data provider upload and/or update one or more datasets to the tool back end.
 *
 * @file
 * @ingroup Extensions
 * @author Marco Fossati - User:Hjfocs
 * @author Tommaso Montefusco - User:Kiailandi
 * @version 2.0
 * @license GPL-3.0-or-later
 */

class SpecialPrimarySources extends SpecialPage {

	/**
	 * Initialize this special page.
	 */
	public function __construct() {
		parent::__construct( 'PrimarySources' );
	}

	/**
	 * Show this special page to the user.
	 *
	 * @param string $sub The subpage string argument (if any).
	 */
	public function execute( $sub ) {
		$BASE_URI = 'https://pst.wmflabs.org/pst/';
		$DATASETS_SERVICE = $BASE_URI . 'datasets';
		$UPLOAD_SERVICE = $BASE_URI . 'upload';
		$UPDATE_SERVICE = $BASE_URI . 'update';

		$out = $this->getOutput();
		$user = $this->getUser();
		$out->setPageTitle( 'Upload or update dataset' );

		if ( $user->isLoggedIn() ) {
			$datasets = json_decode( file_get_contents( $DATASETS_SERVICE ) );
			$keyUser = "user";
			$keyDataset = "dataset";
			$userDatasets = [];
			$datasetCount = count( $datasets );
			$userDatasetCount = count( $userDatasets );

			for ( $i = 0; $i < $datasetCount; $i++ ) {
				preg_match( '/User:([^\/]+)/', $datasets[$i]->$keyUser, $re );
				if ( $re[1] == $user->getName() ) {
					array_push( $userDatasets, $datasets[$i]->$keyDataset );
				}
			}

			// Enable update only if the user has uploaded at least a dataset
			if ( $userDatasetCount > 0 ) {
				$out->addHTML( '<script>
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
								</script>'
				);

				$out->addHTML(
					'<button id="swap" onClick="swap()">I want to update a dataset</button>
					<br /><br />'
				);

				$updateHtml =
					'<form id="updateForm" action="' . $UPDATE_SERVICE . '"
					method="post" enctype="multipart/form-data" style="display:none">
						<input type="hidden" name="user" value="' . $user->getName() . '">
						<fieldset>
							<legend>Update</legend>
							<table><tbody>
								<tr class="mw-htmlform-field-">
									<td class="mw-label">
										<label for="datasetToUpdate">Dataset name to update:</label>
									</td>
									<td class="mw-input">
										<select id="datasetToUpdate" name="dataset">';

				for ( $i = 0; $i < $userDatasetCount; $i++ ) {
					$updateHtml .=
						'<option value="' . $userDatasets[$i] . '">'
							. explode( '/', $userDatasets[$i] )[2] .
						'</option>';
				}

				$updateHtml .=
										'</select>
									</td>
								</tr>
								<tr class="mw-htmlform-field-UpdateSourceField">
									<td class="mw-label">
										<label for="datasetToRemove">Dataset file to remove:</label>
									</td>
									<td class="mw-input">
										<input id="datasetToRemove" name="remove" type="file">
									</td>
								</tr>
								<tr class="mw-htmlform-field-UpdateSourceField">
									<td class="mw-label">
										<label for="datasetToAdd">Dataset file to add:</label>
									</td>
									<td class="mw-input">
										<input id="datasetToAdd" name="add" type="file">
									</td>
								</tr>
								<tr>
									<td colspan="2" class="htmlform-tip">Maximum file size: 250 MB</td>
								</tr>
								<tr>
									<td colspan="2" class="htmlform-tip">File format allowed: RDF</td>
								</tr>
							</tbody></table>
						</fieldset>
						<span class="mw-htmlform-submit-buttons">
							<input type="button" onclick="
								if (
									$(\'#datasetToRemove\').get(0).files.length === 0 ||
									$(\'#datasetToAdd\').get(0).files.length === 0
								) {
									alert(\'Please select a file for both inputs\')
								} else {
									submit()
								}"
							title="Update your dataset" value="Submit">
						</span>
					</form>';
				$out->addHTML( $updateHtml );
			}

			$out->addHTML(
				'<form id="uploadForm" action="' . $UPLOAD_SERVICE . '"
				method="post" enctype="multipart/form-data">
					<input type="hidden" name="user" value="' . $user->getName() . '">
					<fieldset>
					<legend>Upload</legend>
					<table><tbody>
						<tr class="mw-htmlform-field-HTMLTextField">
							<td class="mw-label">
								<label for="datasetName">Dataset name:</label>
							</td>
							<td class="mw-input">
								<input id="datasetName" type="text" name="name" value="">
							</td>
						</tr>
						<tr class="mw-htmlform-field-UploadSourceField">
							<td class="mw-label">
								<label for="datasetFiles">Dataset files:</label>
							</td>
							<td class="mw-input">
								<input id="datasetFiles" type="file" name="dataset" multiple>
							</td>
						</tr>
						<tr>
							<td colspan="2" class="htmlform-tip">Maximum file size: 250 MB</td>
						</tr>
						<tr>
							<td colspan="2" class="htmlform-tip">File format allowed: RDF</td>
						</tr>
					</tbody></table>
					</fieldset>
					<span class="mw-htmlform-submit-buttons">
						<input type="button" onclick="
							if ( $( \'#datasetFiles\' ).get( 0 ).files.length === 0 ) {
								alert( \'Please select a file\' )
							} else {
								submit()
							}"
						title="Upload your dataset" value="Submit">
					</span>
				</form>'
			);

		} else {
			$out->addWikiText( "'''Please log in to use this feature'''" );
		}
	}

	/**
	 * Make this special page appear on Special:SpecialPages under the Wikibase section.
	 *
	 * @return string
	 */
	protected function getGroupName() {
		return 'wikibase';
	}
}
