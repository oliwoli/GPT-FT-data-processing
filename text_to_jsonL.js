
// dependencies
const path = require('path');
const fs = require('fs');
const cleanText = require('./text-clean');
const dir = require('./getDirectories');
const colors = require('./colors');
const { encode, decode } = require('gpt-3-encoder');
const { text } = require('stream/consumers');


// Settings
const DATA_DIR = "++DATA";
const PROCESS_DIR = "++PROCESSED";
const PROCESS_PREFIX = "proc_";
const CUSTOM_SEPARATOR = "\\n\\n\\n\\n";
const MAX_CHARACTERS = 2400;
const SEPARATORS = [". ", "...\\n", ".\\n", "? ", "?\\n"];
const TOKENLIMIT = 2030;
const STOP_SEQ = "###";
const logGoodFiles = true;
const skipCertainFiles = true;
const skipFilePrefix = "todo_";


// iterate over files -------------------------------------------- //

let allFiles = dir.getDirectoriesRecursive(DATA_DIR)
//allFiles = allFiles.filter(f => !
console.log(allFiles)
allFiles.forEach(folder => {
    fs.readdir(folder, (err, files) => {
        files.filter(files => !files.includes(".gitignore")).forEach(fileInstance => {
            if (fs.lstatSync(path.resolve(folder, fileInstance)).isDirectory()) return
            let filePath = `${folder}/${fileInstance}`;
            let file = {
                name: fileInstance,
                filePath,
                folder
            }
            if (file.name.includes(skipFilePrefix) && skipCertainFiles) return
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
    const prompt = {
        text: promptText,
        end: promptEnd
    }
    return prompt
}


function writeToProcessedFile(textStr, file) {
    let isComment = textStr.slice(0, 4).includes("[a]");
    if (isComment) return false
    let completion = textStr.trim();
    let hasPrompt = false
    let prompt = ""
    
    if ("text" in file.prompt) {
        if (textStr.toLowerCase().includes("[prompt:")) completion = completion.slice(file.prompt.end + 1, textStr.length).trim()
        completion = cleanText.postClean(completion, "\\n")
        completion = " " + completion
        prompt = file.prompt.text
        hasPrompt = true
    }
    completion = completion + STOP_SEQ
    let = paragraphIntoPromptJsonL = `{"prompt": "${prompt}", "completion": "${completion}"}` + "\n"
    if (hasPrompt) {
        let = jsonLWithNoPrompt = `{"prompt": "", "completion": "${completion.trim()}"}` + "\n"
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
        console.log("could not append to file:")
        console.log(error)
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
    let customSeparatorIndices = getIndicesOf(CUSTOM_SEPARATOR, textStr);
    customSeparatorIndices.push(textStr.length);
    for (let i = 0, passed = true; i < customSeparatorIndices.length; i++) {
        let splitText, startPoint;
        let endPoint = customSeparatorIndices[i];
        if (i == 0) startPoint = 0
        if (startPoint == endPoint) continue
        else startPoint = customSeparatorIndices[i - 1] + CUSTOM_SEPARATOR.length;
        splitText = textStr.slice(startPoint, endPoint);
        if (splitText.length < 3) continue;
        splitText = cleanText.postClean(splitText, "\\n");
        let tokenCount = gptEncode(splitText).length;
        let consoleTextPreview = splitText.slice(0, 50);
        let passedCondition = logGoodFiles && i >= customSeparatorIndices.length - 1 && passed;
        file.prompt = getPrompt(splitText);
        if (tokenCount < TOKENLIMIT) {
            writeToProcessedFile(splitText, file);
            if (passedCondition) console.log(`${colors.blue + file.name} ${colors.green} passed! ✔️ ${colors.default}`)
            continue
        }
        passed = false;
        let textBlockLocation = colors.cyan + `(${i + 1}/${customSeparatorIndices.length})` + colors.default
        console.log(`${colors.yellow + file.name + colors.default} block has ${colors.red + tokenCount + colors.default} tokens. At ${textBlockLocation}: "${consoleTextPreview}..."${colors.default}.`);
        splitBySeperators(splitText, SEPARATORS, file)
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



