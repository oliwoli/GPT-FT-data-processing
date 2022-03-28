const prompt = require('prompt');
const dir = require('./getDirectories');
const fs = require('fs');

let listFiles = fs.readdirSync("++DATA")

console.log(listFiles)

prompt.start();

prompt.get(['file select'], function (err, result) {
  if (err) {
    return onErr(err);
  }
  console.log('Command-line input received:');
  console.log('  Username: ' + result.username);
  console.log('  Email: ' + result.email);
});

function onErr(err) {
  console.log(err);
  return 1;
}