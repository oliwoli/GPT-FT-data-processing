
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
        if (gpt_encode(splitText).length < 2000) {
            fs.appendFile('processed-text.jsonl', paragraphIntoPromptJsonL, function (err) {
                if (err) return console.log(err);
                console.log('wrote a block from', startPoint, "to", customSeparatorIndices[i]);
            });
        }
        else {
            console.log("yo that shiits more than 2000 tokens");
            split_by_spacesAndBreaks(textStr)
        }

        //otherwise split again
    }
}

split_by_customSeperator(text);

function split_by_spacesAndBreaks(textStr) {
    let spaceIndices = getIndicesOf(" ", textStr);
    let linebreakIndices = getIndicesOf("\\n", textStr);
    let spacesAndBreaks = [...spaceIndices, ...linebreakIndices];
    spacesAndBreaks.sort((a, b) => a - b);
    let splitPoints_spacesAndBreaks = defineSplitPoints(spacesAndBreaks, idealSplit);
    let guessTimateTokens = textStr.length / 4;

    for (let i = 0, startPoint; i < splitPoints_spacesAndBreaks.length; i++) {
        let splitText;
        let endPoint = splitPoints_spacesAndBreaks[i];
        if (i == 0) {
            startPoint = 0;
            splitText = textStr.slice(startPoint, endPoint)
        }
        else {
            startPoint = splitPoints_spacesAndBreaks[i - 1];
            if (i < splitPoints_spacesAndBreaks.length) splitText = textStr.slice(startPoint, endPoint);
            else splitText = textStr.slice(startPoint, text[text.length - 1]);
        }

        while (textStr.slice(startPoint, startPoint + 2) == "\\n") {
            startPoint += 2
        }
        while (textStr.slice(endPoint - 2, endPoint) == "\\n") {
            endPoint -= 2
        }
        splitText = splitText.trim();

        let = paragraphIntoPromptJsonL = `{"prompt": "", "completion": "${splitText}"}` + "\n";

        if (gpt_encode(splitText).length < 2000) {
            fs.appendFile('processed-text.jsonl', paragraphIntoPromptJsonL, function (err) {
                if (err) return console.log(err);
                console.log('wrote a block from', startPoint, "to", splitPoints_spacesAndBreaks[i], "tokencount: ", gpt_encode(splitText).length);
            });
        }
        else {
            console.log("completion bigger than 2000 tokens!");
            continue
        }
    }
}

function pick(arg, def) {
    return (typeof arg == 'undefined' ? def : arg);
 }

getSplitText(text, ".", "...")

function getSplitText(textStr, separator1, separator2) {
    textStr = pick(textStr, '');
    separator1 = pick(separator1, ' ');

    let indices1 = getIndicesOf(separator1, textStr);
    let indices;
    let indices2;
    if (separator2 = typeof separator2 !== 'undefined') {
        indices2 = getIndicesOf(separator1, textStr);
        indices = [...indices1, ...indices2];
        indices.sort((a, b) => a - b);
    }
    else indices = indices1;

    console.log("i guess, spaces are here: ", indices2);

    let splitPoints = defineSplitPoints(indices, idealSplit);

    for (let i = 0, startPoint; i < splitPoints.length; i++) {
        let splitText;
        let endPoint = splitPoints[i];
        if (i == 0) {
            startPoint = 0;
            splitText = textStr.slice(startPoint, endPoint)
        }
        else {
            startPoint = splitPoints[i - 1];
            if (i < splitPoints.length) splitText = textStr.slice(startPoint, endPoint);
            else splitText = textStr.slice(startPoint, text[text.length - 1]);
        }

        while (textStr.slice(startPoint, startPoint + 2) == "\\n") {
            startPoint += 2
        }
        while (textStr.slice(endPoint - 2, endPoint) == "\\n") {
            endPoint -= 2
        }
        splitText = splitText.trim();
        return splitText
    }
}



