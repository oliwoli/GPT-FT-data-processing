const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const { auth } = require('google-auth-library');
const async = require('async');

const CLIENT_ID = '397420440281-7q20i09okuustb09sptnpfnk2amrd9n2.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const REFRESH_TOKEN = '1//04imEpvb-gZB9CgYIARAAGAQSNwF-L9Irpr4dxrPrusVESG0HrBXS391vGUWLsGLR2Y53_Lt8piAr6LxSxsjjaK87td_Zy1IcQAI';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({
  version: 'v3',
  auth: oauth2Client
})

let pageToken = null;
// Using the NPM module 'async'
async.doWhilst(function (callback) {
  drive.files.list({
    q: "mimeType='image/jpeg'",
    fields: 'nextPageToken, files(id, name)',
    spaces: 'drive',
    pageToken: pageToken
  }, function (err, res) {
    if (err) {
      // Handle error
      console.error(err);
      callback(err)
    } else {
      res.files.forEach(function (file) {
        console.log('Found file: ', file.name, file.id);
      });
      pageToken = res.nextPageToken;
      callback();
    }
  });
}, function () {
  return !!pageToken;
}, function (err) {
  if (err) {
    // Handle error
    console.error(err);
  } else {
    // All pages fetched
  }
})