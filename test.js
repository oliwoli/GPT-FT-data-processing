const { encode, decode } = require('gpt-3-encoder');
let fs = require('fs');
let text = fs.readFileSync("a-test-sentence.txt", 'utf-8');


function gpt_encode(str, start, end) {
  switch (arguments.length) {
    case 1: start = 0;
    case 2: end = str.length;
    case 3: break;
    default: throw new Error('illegal argument count')
  }
  return encode(str).slice(start, end)
}

function gpt_decode(array, start, end) {
  switch (arguments.length) {
    case 1: start = 0;
    case 2: end = array.length;
    case 3: break;
    default: throw new Error('illegal argument count')
  }
  return decode(array.slice(start, end))
}

function fix_line_breaks(text){
  let output = text.replace(/(?:\r\n|\r|\n)/g, '\\n');
  return output
}

function fix_quotes(text){
  output = text.replace(/"/g, '\\"');
  return output
}


const MAX_LENGTH = 100;
let encoded = gpt_encode(text);
let decoded = gpt_decode(encoded);

//console.log(decoded);

// delete content inside processed document ( in case the script is run twice )
fs.writeFile('processed-text.jsonl', "", function (err) {
  if (err) return console.log(err);
  console.log('deleted content');
});

fs.truncate('processed-text.jsonl', 0, function () { console.log('done') })

for (let i = 1, startPoint; i < encoded.length; i++) {
  if (startPoint == undefined) { startPoint = 0 }
  let encodeSplit = gpt_encode(text, startPoint, i)

  // if start to end % max length

  if (encodeSplit.length % MAX_LENGTH === 0 || i == encoded.length - 1) {
    let e = 0;
    while (decoded[i + e] != " ") {
      console.log("e");
      e++
    }
    console.log(e)
    // if (whitespaceDistance) i = whitespaceDistance[whitespaceDistance.length - 1];
    console.log(i);
    i += e+1;
    let splitText = gpt_decode(encodeSplit);
    splitText = fix_line_breaks(splitText);
    splitText = fix_quotes(splitText);
    // console.log(splitText);
    paragraphIntoPromptJsonL = `{"prompt": "", "completion": "${splitText}"}` + "\n";
    fs.appendFile('processed-text.jsonl', paragraphIntoPromptJsonL, function (err) {
      if (err) return console.log(err);
      console.log('wrote a block from', startPoint, "to", i);
    });
    startPoint = i;

  }

}

let outputText = `{"prompt": "", "completion": "bla"}`

/* fs.writeFile('processed-text.txt', outputText, function (err) {
  if (err) return console.log(err);
  console.log('Hello World > helloworld.txt');
}); */