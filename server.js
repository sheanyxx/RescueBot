const express = require('express');
const docusign = require('docusign-esign');
const path = require('path');
const apiClient = new docusign.ApiClient();
const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';
var fs = require('fs');
const upload = multer({
  dest: 'uploads/' // this saves your file into a directory called "uploads"
}); 

//On execution an envelope is sent to the provided email address, one signHere
//tab is added, the document supplied in workingdirectory\fileName is used.
//Open a new browser pointed at http://localhost:3000 to execute. 
//-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------

//Fill in Variables Here

//Obtain an OAuth token from https://developers.docusign.com/oauth-token-generator
//Obtain your accountId from account-d.docusign.com > Go To Admin > API and Keys

const OAuthToken = 'eyJ0eXAiOiJNVCIsImFsZyI6IlJTMjU2Iiwia2lkIjoiNjgxODVmZjEtNGU1MS00Y2U5LWFmMWMtNjg5ODEyMjAzMzE3In0.AQkAAAABAAUABwAAatxnthvWSAgAAKr_dfkb1kgCAK18LWgY1X9HhpOz4eibNUAVAAEAAAAYAAEAAAAFAAAADQAkAAAAZjBmMjdmMGUtODU3ZC00YTcxLWE0ZGEtMzJjZWNhZTNhOTc4EgABAAAACwAAAGludGVyYWN0aXZlMAAAPatmthvWSA.valkO-3q3rc_6nwzHzW6NSWXXZiaU4_sWO3zNl9PAjvKKe1M6y671LuwhL8vbWCEvXpe1Lym95rvhzLpNp7hEXtCh5s1UzCTynuh0YQpDQ-IpgjSCS2pI-zj3IBX89mUFQU6iShWpY89GdSbRDl4-n_v1QBPJKKTXZ8LIEXQFW11evKD5c-ZN6suPlRFmrsWgQiMMZv-PHXW7vVeLsCUAnAnuY5UqJlmer0WP6i3Xbxc1cC1C66FVey-2URc3VBtIBrAOGqSgcjfhXVrFuaGN-dygfmNbv3QgDrxfmCvgK5dQSEjlI8lYE9uZpyaoDZ1ZGCDeAi7mw7RZpnJ1_A5qw';
const accountId = '6550627';


//Recipient Information goes here
const recipientName = 'Claudia';
const recipientEmail = 'claudiamb@zoho.com';

//Point this to the document you wish to send's location on the local machine. Default location is __workingDir\fileName
const fileName = 'hackmit.pdf'; //IE: test.pdf
//-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------

app.use('/vendor', express.static(path.join(__dirname, '/vendor')))
app.use('/js', express.static(path.join(__dirname, '/js')))
app.use('/css', express.static(path.join(__dirname, '/css')))
app.use('/img', express.static(path.join(__dirname, '/img')))

app.get('/', function(req, res) {
	return res.sendFile(__dirname + '/index.html')
});

app.get('/admin', function(req, res) {
	return res.sendFile(__dirname + '/admin.html')
});

app.post('post', upload.single('file'), function (req, res) {

  apiClient.setBasePath('https://demo.docusign.net/restapi');
  apiClient.addDefaultHeader('Authorization', 'Bearer ' + OAuthToken);

  // Envelope Code goes here

  //Read the file you wish to send from the local machine.
  fileStream = process.argv[2];
  pdfBytes = fs.readFileSync(path.resolve(__dirname, fileName));
  pdfBase64 = pdfBytes.toString('base64');

  docusign.Configuration.default.setDefaultApiClient(apiClient);

  var envDef = new docusign.EnvelopeDefinition();

  //Set the Email Subject line and email message
  envDef.emailSubject = 'Please sign this document sent from Node SDK';
  envDef.emailBlurb = 'Please sign this document sent from the DocuSign Node.JS SDK.'

  //Read the file from the document and convert it to a Base64String
  var doc = new docusign.Document();
  doc.documentBase64 = pdfBase64;
  doc.fileExtension = 'pdf';
  doc.name = 'Node Doc Send Sample';
  doc.documentId = '1';

  //Push the doc to the documents array.
  var docs = [];
  docs.push(doc);
  envDef.documents = docs;

  //Create the signer with the previously provided name / email address
  var signer = new docusign.Signer();
  signer.name = recipientName;
  signer.email = recipientEmail;
  signer.routingOrder = '1';
  signer.recipientId = '1';

  //Create a tabs object and a signHere tab to be placed on the envelope
  var tabs = new docusign.Tabs();

  var signHere = new docusign.SignHere();
  signHere.documentId = '1';
  signHere.pageNumber = '1';
  signHere.recipientId = '1';
  signHere.tabLabel = 'SignHereTab';
  signHere.xPosition = '50';
  signHere.yPosition = '300';

  //Create the array for SignHere tabs, then add it to the general tab array
  signHereTabArray = [];
  signHereTabArray.push(signHere);

  tabs.signHereTabs = signHereTabArray;

  //Then set the recipient, named signer, tabs to the previously created tab array
  signer.tabs = tabs;

  //Add the signer to the signers array
  var signers = [];
  signers.push(signer);

  //Envelope status for drafts is created, set to sent if wanting to send the envelope right away
  envDef.status = 'sent';

  //Create the general recipients object, then set the signers to the signer array just created
  var recipients = new docusign.Recipients();
  recipients.signers = signers;

  //Then add the recipients object to the enevelope definitions
  envDef.recipients = recipients;

  //Send the envelope
  var envelopesApi = new docusign.EnvelopesApi();
  envelopesApi.createEnvelope(accountId, { 'envelopeDefinition': envDef }, function (err, envelopeSummary, response) {

    if (err)
      console.log(err);

    res.send(envelopeSummary);

  });
});

app.listen(port, host, function (err) {
  if (err)
    throw err;

  console.log('Your server is running on http://' + host + ':' + port + '.');
});