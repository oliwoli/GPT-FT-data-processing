// iterate over files -------------------------------------------- //

const fs = require('fs');
const path = require('path');
const DATA_DIR = "./++DATA";
const cleanText = require('./text-clean');
const colors = require('./colors');

function flatten(lists) {
    return lists.reduce((a, b) => a.concat(b), []);
}

function getDirectories(srcpath) {
    return fs.readdirSync(srcpath)
        .map(file => path.join(srcpath, file))
        .filter(path => fs.statSync(path).isDirectory());
}

function getDirectoriesRecursive(srcpath) {
    return [srcpath, ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive))];
}

let allFiles = getDirectoriesRecursive(DATA_DIR);
allFiles.forEach(folder => {
    fs.readdir(folder, (err, files) => {
        files.forEach(file => {
            if (fs.lstatSync(path.resolve(folder, file)).isDirectory() || file.includes(".gitignore")) return
            let filePath = `${folder}\\${file}`;
            let createProcFile = createProcessedFile([filePath, file, folder]);
            if (!createProcFile) return
            let text = fs.readFileSync(filePath, 'utf-8');
            text = cleanText.clean(text);
            splitByCustomSeperator(text, [filePath, file, folder]);
            //splitBySeperators(text, [".", "?"], [filePath, file, folder])
        });
    });
});

// ______________________________________________________________________________________//

const { encode, decode } = require('gpt-3-encoder');
const { text } = require('stream/consumers');
const MAX_CHARACTERS = 2400;
const TOKENLIMIT = 2030;
const PROCESS_DIR = "++PROCESSED";
const PROCESS_PREFIX = "proc_";
const SEPERATORS = [". ", "...\\n", ".\\n", "? ", "?\\n"];
const logGoodFiles = false;

function gptEncode(str, start, end) {
    switch (arguments.length) {
        case 1: start = 0;
        case 2: end = str.length;
        case 3: break;
        default: throw new Error('illegal argument count')
    }
    return encode(str).slice(start, end)
}

function fileName(fileInfo) {
    processedFileName = `${PROCESS_PREFIX}${fileInfo[1]}.jsonl`
    return processedFileName
}

function createProcessedFile(fileInfo) {
    let newFileName = fileName(fileInfo);
    // this is probably a horrible way of doing this.
    try {
        fs.writeFile(`${PROCESS_DIR}\\${newFileName}`, '', function (err) {
            if (err) throw err;
            console.log(`File "${newFileName}" created successfully.`);
        });
        return true;
    } catch (error) {
        // file already exists
        let deleteContent = clearFile(pathToFile);
        if (deleteContent == true) return true;
        else return false
    }
}

function writeToProcessedFile(textStr, fileInfo) {
    let = paragraphIntoPromptJsonL = `{"prompt": "", "completion": "${textStr}"}` + "\n";
    let newFileName = fileName(fileInfo);
    let isComment = textStr.slice(0, 4).match("[a]");
    if (isComment) return false
    try {
        fs.appendFile(`${PROCESS_DIR}\\${newFileName}`, paragraphIntoPromptJsonL, function (err) {
            if (err) return console.log(err);
        });
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
        //if (index == textStr.length - 1 && index < MAX_CHARACTERS) idealSplit.push(textStr.length / 2)
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

function splitByCustomSeperator(textStr, fileInfo) {
    let customSeparator = "\\n\\n\\n\\n";
    let customSeparatorIndices = getIndicesOf(customSeparator, textStr);
    customSeparatorIndices.push(textStr.length);
    for (let i = 0, startPoint; i < customSeparatorIndices.length; i++) {
        let splitText;
        let endPoint = customSeparatorIndices[i];
        if (i == 0) startPoint = 0
        if (startPoint == endPoint) continue
        else startPoint = customSeparatorIndices[i - 1] + customSeparator.length;
        splitText = textStr.slice(startPoint, endPoint);
        if (splitText.length < 3) continue;
        splitText = cleanText.postClean(splitText, "\\n");
        let tokenCount = gptEncode(splitText).length;
        let consoleTextPreview = splitText.slice(0, 50);
        if (tokenCount < TOKENLIMIT) {
            writeToProcessedFile(splitText, fileInfo);
            if (logGoodFiles) console.log(`Text chunk of file ${colors.blue + fileInfo[1]} ${colors.green} passed!✔️ ${colors.default}`)
            continue
        }  
        console.log(`Block: ${colors.yellow}"${consoleTextPreview}..."${colors.default} of file ${colors.blue + fileInfo[1] + colors.default} has ${colors.yellow + tokenCount + colors.default} tokens. Splitting by punctuation.`);
        splitBySeperators(splitText, SEPERATORS, fileInfo)
        continue
    }
}

function splitBySeperators(textStr, seperators, fileInfo) {
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
        let splitText;
        let endPoint = splitPoints[i];
        if (i == 0) startPoint = 0;
        else startPoint = splitPoints[i - 1];
        if (i == 0) startPoint = 0
        splitText = textStr.slice(startPoint, endPoint);
        if (splitText.length < 3) continue;
        splitText = cleanText.postClean(splitText, "\\n");
        let tokenCount = gptEncode(splitText).length;
        if (tokenCount < 2000) {
            writeToProcessedFile(splitText, fileInfo);
        }
        else {
            let consoleTextPreview = splitText.slice(0, 50);
            console.log(`Could not write textblock: ${consoleTextPreview} of file ${fileInfo[1]}. Tokencount: ${tokenCount} `);
        }
    }
}



