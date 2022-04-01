// iterate over files -------------------------------------------- //

const path = require('path');
const DATA_DIR = "++DATA";
const PROCESS_DIR = "++PROCESSED";
const cleanText = require('./text-clean');
const dir = require('./getDirectories');
const colors = require('./colors');
const { encode, decode } = require('gpt-3-encoder');
const { text } = require('stream/consumers');
const MAX_CHARACTERS = 2400;
const TOKENLIMIT = 2030;
const PROCESS_PREFIX = "proc_";
const SEPERATORS = [". ", "...\\n", ".\\n", "? ", "?\\n"];
const promptSeperator = "(::)";
const stopSeq = "###";
const logGoodFiles = true;

const fs = require('fs');

let allFiles = dir.getDirectoriesRecursive(DATA_DIR);
allFiles.forEach(folder => {
    fs.readdir(folder, (err, files) => {
        files.forEach(fileInstance => {
            if (fs.lstatSync(path.resolve(folder, fileInstance)).isDirectory() || fileInstance.includes(".gitignore")) return
            let filePath = `${folder}/${fileInstance}`;
            let file = {
                name: fileInstance,
                filePath,
                folder
            }
            let createProcFile = createProcessedFile(file);
            if (!createProcFile) return
            let text = fs.readFileSync(filePath, 'utf-8');
            text = cleanText.clean(text);
            splitByCustomSeperator(text, file);
        });
    });
});

// ______________________________________________________________________________________//


function gptEncode(str, start, end) {
    switch (arguments.length) {
        case 1: start = 0;
        case 2: end = str.length;
        case 3: break;
        default: throw new Error('illegal argument count')
    }
    return encode(str).slice(start, end)
}

function fileName(filename) {
    let name = path.parse(filename).name
    processedFileName = `${PROCESS_PREFIX}${name}.jsonl`
    return processedFileName
}

function createProcessedFile(file) {
    let newFileName = fileName(file.name);
    // this is probably a horrible way of doing this.
    try {
        fs.writeFile(`${PROCESS_DIR}/${newFileName}`, '', function (err) {
            if (err) throw err;
            // console.log(`${colors.green}File "${newFileName}" created successfully.${colors.default}`);
        });
        return true;
    } catch (error) {
        // file already exists
        let deleteContent = clearFile(file.filePath);
        if (deleteContent == true) return true;
        else return false
    }
}

function getPrompt(textStr) {
    let promptSearchStr = "[prompt:";
    let promptOccur = textStr.toLowerCase().indexOf(promptSearchStr)
    if (promptOccur == -1 || promptOccur === undefined) {
        return {}
    }
    let promptEnd = textStr.indexOf("]", promptOccur)

    let promptText = textStr.slice(promptOccur + promptSearchStr.length, promptEnd).trim();
    promptText = promptText + promptSeperator;
    const prompt = {
        text: promptText,
        end: promptEnd
    }
    return prompt
}


function writeToProcessedFile(textStr, file) {
    let isComment = textStr.slice(0, 4).includes("[a]");
    if (isComment) return false
    let completion = textStr.trim()
    let hasPrompt = false
    let prompt = ""
    if ("text" in file.prompt) {
        if (textStr.toLowerCase().includes("[prompt:")) completion = textStr.slice(file.prompt.end + 1, textStr.length).trim()
        completion = " " + completion + stopSeq
        prompt = file.prompt.text
        hasPrompt = true
    }
    let = paragraphIntoPromptJsonL = `{"prompt": "${prompt}", "completion": "${completion}"}` + "\n"
    if (hasPrompt) {
        let = jsonLWithNoPrompt = `{"prompt": "", "completion": "${completion.trim()}"}` + "\n"
        console.log(`for file: ${colors.blue + file.name + colors.default}`)
        console.log(`found${colors.cyan} PROMPT: "${file.prompt.text.slice(0, 25)}..."${colors.default}, completion: "${completion.slice(0, 45)}..."\n`)
    }
    let newFileName = fileName(file.name);
    try {
        fs.appendFile(`${PROCESS_DIR}/${newFileName}`, paragraphIntoPromptJsonL, function (err) {
            if (err) return console.log(err);
        });
        // if it has a prompt, write again but without prompt
        if (hasPrompt) {
            fs.appendFile(`${PROCESS_DIR}/${newFileName}`, jsonLWithNoPrompt, function (err) {
                if (err) return console.log(err);
            });
        }
        return true;
    } catch (error) {
        console.log("could not append to file.")
    }
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

function clearFile(file) {
    fs.writeFile(file, "", function (err) {
        if (err) return console.log(err);
        console.log('deleted content');
    });
}

function setIdealSplit(textStr) {
    let idealSplit = [];
    for (let index = 1; index < textStr.length; index++) {
        if (index % MAX_CHARACTERS === 0) idealSplit.push(index)
    }
    idealSplit.sort((a, b) => a - b);
    return idealSplit
}

function defineSplitPoints(arr, targetArray) {
    output = [];
    targetArray.forEach(element => {
        let closestMatch = findClosest(element, arr);
        output.push(closestMatch);
    });
    return output
}

function splitByCustomSeperator(textStr, file) {
    let customSeparator = "\\n\\n\\n\\n";
    let customSeparatorIndices = getIndicesOf(customSeparator, textStr);
    customSeparatorIndices.push(textStr.length);
    for (let i = 0, passed = true; i < customSeparatorIndices.length; i++) {
        let splitText, startPoint;
        let endPoint = customSeparatorIndices[i];
        if (i == 0) startPoint = 0
        if (startPoint == endPoint) continue
        else startPoint = customSeparatorIndices[i - 1] + customSeparator.length;
        splitText = textStr.slice(startPoint, endPoint);
        if (splitText.length < 3) continue;
        splitText = cleanText.postClean(splitText, "\\n");
        let tokenCount = gptEncode(splitText).length;
        let consoleTextPreview = splitText.slice(0, 50);
        let passedCondition = logGoodFiles && i >= customSeparatorIndices.length - 1 && passed;
        file.prompt = getPrompt(splitText);
        if (tokenCount < TOKENLIMIT) {
            writeToProcessedFile(splitText, file);
            if (passedCondition) console.log(`${colors.blue + file.name} ${colors.green} passt! ✔️ ${colors.default}`)
            continue
        }
        passed = false;
        let textBlockLocation = colors.cyan + `(${i + 1}/${customSeparatorIndices.length})` + colors.default
        console.log(`${colors.yellow + file.name + colors.default} block has ${colors.red + tokenCount + colors.default} tokens. At ${textBlockLocation}: "${consoleTextPreview}..."${colors.default}.`);
        splitBySeperators(splitText, SEPERATORS, file)
        continue
    }
}

function splitBySeperators(textStr, seperators, file) {
    let idealSplit = setIdealSplit(textStr);
    let seperatorIndices = [];

    seperators.forEach(seperator => {
        let seperatorInText = getIndicesOf(seperator, textStr);
        seperatorInText = seperatorInText.map(n => n + seperator.length)
        seperatorIndices.push(...seperatorInText)
    });

    let splitPoints = defineSplitPoints(seperatorIndices, idealSplit);
    splitPoints.sort((a, b) => a - b);
    splitPoints.push(textStr.length)

    for (let i = 0; i < splitPoints.length; i++) {
        let splitText, startPoint;
        let endPoint = splitPoints[i];
        if (i == 0) startPoint = 0;
        else startPoint = splitPoints[i - 1];
        splitText = textStr.slice(startPoint, endPoint);
        if (splitText.length < 3) continue;
        splitText = cleanText.postClean(splitText, "\\n");
        let tokenCount = gptEncode(splitText).length;
        if (tokenCount < 2000) {
            writeToProcessedFile(splitText, file);
        }
        else {
            let consoleTextPreview = splitText.slice(0, 50);
            console.log(`Could not write textblock: ${consoleTextPreview} of file ${file.name}. Tokencount: ${tokenCount} `);
        }
    }
}



