
const { encode, decode } = require('gpt-3-encoder');
let fs = require('fs');
const { start } = require('repl');
let text = fs.readFileSync("a-test-sentence.txt", 'utf-8');
text = clean_text(text);
let processedFileExists;
try {
    let processedText = fs.readFileSync("processed-text.jsonl", 'utf-8');
    processedFileExists = true;
} catch (error) {
    processedFileExists = false;
    console.log("no corresponding Jsonl file found. Will create!")
}

let encoded = encode(text);
let decoded = decode(encoded);
const MAX_CHARACTERS = 4200;

let date = new Date().toJSON();

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

function clean_text(text) {
    let output = fix_line_breaks(text);
    output = fix_quotes(output);
    try {
        let output_withNoHTML = output.replace(/<\/?[^>]+(>|$)/g, "");
        return output_withNoHTML
    } catch (error) {
        console.log("error while trying to remove HTML tags.")
        return output
    }
}

function fix_line_breaks(text) {
    let output = text.replace(/(?:\r\n|\r|\n)/g, '\\n');
    return output
}

function fix_quotes(text) {
    output = text.replace(/"/g, '\\"');
    return output
}

function getIndicesOf(searchStr, str, caseSensitive) {
    let searchStrLen = searchStr.length;
    if (searchStrLen == 0) {
        return [];
    }
    let startIndex = 0, index, indices = [];
    if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
    }
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

function findClosest(num, arr) {
    current = arr[0];
    arr.forEach(val => {
        if (Math.abs(num - val) < (num - current)) current = val;
    });
    return current
}

function deleteFileContent(file) {
    fs.writeFile(file, "", function (err) {
        if (err) return console.log(err);
        console.log('deleted content');
    });
}


let customSeparator = "\\n\\n\\n";
let customSeparatorIndices = getIndicesOf(customSeparator, text);
customSeparatorIndices.push(text.length);
console.log("separatorIndices", customSeparatorIndices);

let idealSplit = [];

for (let index = 1; index < text.length; index++) {
    if (index % MAX_CHARACTERS === 0) idealSplit.push(index)
    if (index == text.length - 1 && index < MAX_CHARACTERS) idealSplit.push(text.length / 2)
}

console.log("ideal split: ", idealSplit);


function defineSplitPoints(arr, targetArray) {
    output = [];
    targetArray.forEach(element => {
        let closestMatch = findClosest(element, arr);
        output.push(closestMatch);
    });
    return output
}

if (processedFileExists) deleteFileContent('processed-text.jsonl')
// delete content inside processed document ( in case the script is run twice )

console.log("text length: ", text.length)

function split_by_customSeperator(textStr) {
    for (let i = 0, startPoint; i < customSeparatorIndices.length; i++) {
        let splitText;
        let endPoint = customSeparatorIndices[i];
        if (i == 0) {
            startPoint = 0;
            splitText = textStr.slice(startPoint, endPoint);
        }
        else {
            startPoint = customSeparatorIndices[i - 1] + customSeparator.length;

            while (textStr.slice(startPoint, startPoint + 2) == "\\n") {
                startPoint += 2
            }
            while (textStr.slice(endPoint - 2, endPoint) == "\\n") {
                endPoint -= 2
            }
            
            if (i < customSeparatorIndices.length) splitText = textStr.slice(startPoint, endPoint);
            else splitText = textStr.slice(startPoint, textStr[textStr.length - 1]);
        }
        splitText = splitText.trim();
        let = paragraphIntoPromptJsonL = `{"prompt": "", "completion": "${splitText}"}` + "\n";
        if (splitText == "") continue;

        console.log(gpt_encode(splitText).length);
        let writeFile = checkTokenCountAndWrite(splitText);

        if (writeFile == false) {
            console.log("yo that shiits more than 2000 tokens");
            let textSplitByPunctuation = splitTextBySeperator(splitText, [". ", "! ", "? ", "\\n"]);
            textSplitByPunctuation.forEach(element => {
                let writeToFile = checkTokenCountAndWrite(element);
                // console.log(`might've wrote something: ${element}`)

                if (writeToFile == false) {
                    let textSplitBySpace = splitTextBySeperator(splitText, [" "]);
                    textSplitBySpace.forEach(element => {
                        let writeToFile2 = checkTokenCountAndWrite(element);
                        if (writeToFile2 == false) {
                            console.log("script too dumb to split this properly. skipping...");
                        }
                    });
                }
            });
        }
    }
}

function checkTokenCountAndWrite(textStr) {
    let = paragraphIntoPromptJsonL = `{"prompt": "", "completion": "${textStr}"}` + "\n";

    if (gpt_encode(textStr).length < 2000 && gpt_encode(textStr).length !== 0) {
        fs.appendFile('processed-text.jsonl', paragraphIntoPromptJsonL, function (err) {
            if (err) return console.log(err);
        });
        console.log(`wrote something. token count: ${gpt_encode(textStr).length}`)
        return true;
    }
    else {
        console.log(`Too many tokens. counted: ${gpt_encode(textStr).length}`)
        return false;
    }

}

split_by_customSeperator(text);

function pick(arg, def) {
    return (typeof arg == 'undefined' ? def : arg);
}

function splitTextBySeperator(textStr, seperatorsAsArray) {
    textStr = pick(textStr, []);
    let indices = [];

    seperatorsAsArray.forEach(element => {
        IndicesInText = getIndicesOf(element, textStr);
        IndicesInText.forEach(element => indices.push(element));
    });
    //sort and remove duplicates
    indices.sort((a, b) => a - b);
    indices = [...new Set(indices)];

    let splitPoints = defineSplitPoints(indices, idealSplit);
    // add length of text to ensure last chunk gets written. might be stupid.
    splitPoints.push(textStr.length);
    let outputText = [];
    for (let i = 0, startPoint; i < splitPoints.length; i++) {
        let endPoint = splitPoints[i];
        if (i == 0) {
            startPoint = 0;
            splitText = textStr.slice(startPoint, endPoint)
        }
        else {
            // + 2 because separators are 2 characters long and this removes them. This might be dumb, lead to errors.
            startPoint = splitPoints[i - 1] + 2;

            while (textStr.slice(startPoint, startPoint + 2) == "\\n") {
                startPoint += 2
            }
            while (textStr.slice(endPoint - 2, endPoint) == "\\n") {
                endPoint -= 2
            }

            if (i < splitPoints.length) splitText = textStr.slice(startPoint, endPoint);
            else splitText = textStr.slice(startPoint, text[text.length - 1]);
        }


        splitText = splitText.trim();
        outputText.push(splitText)
    }
    return outputText
}



