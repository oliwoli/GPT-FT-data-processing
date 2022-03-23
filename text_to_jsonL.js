// iterate over files -------------------------------------------- //

const fs = require('fs');
const path = require('path');
const DATA_DIR = "./++DATA";
const cleanText = require('./text-clean');
const colors = require('./colors');

function flatten(lists) {
    return lists.reduce((a, b) => a.concat(b), []);
}

let allFiles = getDirectoriesRecursive(DATA_DIR);

function getDirectories(srcpath) {
    return fs.readdirSync(srcpath)
        .map(file => path.join(srcpath, file))
        .filter(path => fs.statSync(path).isDirectory());
}

function getDirectoriesRecursive(srcpath) {
    return [srcpath, ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive))];
}

allFiles.forEach(folder => {
    fs.readdir(folder, (err, files) => {
        files.forEach(file => {
            if (!fs.lstatSync(path.resolve(folder, file)).isDirectory() && !file.includes(".gitignore")) {
                let filePath = `${folder}\\${file}`;
                let createProcFile = createProcessedFile([filePath, file, folder]);
                if (createProcFile) {
                    let text = fs.readFileSync(filePath, 'utf-8');
                    text = cleanText.clean(text);
                    split_by_customSeperator(text, [filePath, file, folder]);
                    //splitBySeperators(text, [".", "?"], [filePath, file, folder])
                }
            }
        });
    });
});

// ______________________________________________________________________________________//

const { encode, decode } = require('gpt-3-encoder');
const { text } = require('stream/consumers');
const MAX_CHARACTERS = 2400;
const PROCESS_DIR = "++PROCESSED"
const PROCESS_PREFIX = "proc_";

function gpt_encode(str, start, end) {
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
        let deleteContent = deleteFileContent(pathToFile);
        if (deleteContent == true) return true;
        else return false
    }
}

function writeToProcessedFile(textStr, fileInfo) {
    textBlock = textStr.replace(/\\n\\n\\n/gm, '\\n\\n');
    let textStart = 2;
    while (textBlock.slice(0, 2) == '\\"') {
        textBlock = textBlock.substring(textStart, textBlock.length)
        textStart++
    }
    let = paragraphIntoPromptJsonL = `{"prompt": "", "completion": "${textBlock}"}` + "\n";
    let newFileName = fileName(fileInfo);
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

function deleteFileContent(file) {
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

function split_by_customSeperator(textStr, fileInfo) {
    let customSeparator = "\\n\\n\\n\\n";
    let customSeparatorIndices = getIndicesOf(customSeparator, textStr);
    customSeparatorIndices.push(textStr.length);
    for (let i = 0, startPoint; i < customSeparatorIndices.length; i++) {
        let splitText;
        let endPoint = customSeparatorIndices[i];
        if (i == 0) {
            startPoint = 0;
            while (textStr.slice(startPoint, startPoint + 2).includes("\\n")) {
                startPoint += 2
            }
            while (textStr.slice(endPoint - 2, endPoint).includes("\\n")) {
                endPoint -= 2
            }
            splitText = textStr.slice(startPoint, endPoint);
        }
        else {
            startPoint = customSeparatorIndices[i - 1] + customSeparator.length;
            while (textStr.slice(startPoint, startPoint + 2).includes("\\n")) {
                startPoint += 2
            }
            while (textStr.slice(endPoint - 2, endPoint).includes("\\n")) {
                endPoint -= 2
            }
            if (i < customSeparatorIndices.length) splitText = textStr.slice(startPoint, endPoint);
            else splitText = textStr.slice(startPoint, textStr[textStr.length - 1]);
        }
        splitText = splitText.trim();
        if (splitText == "") continue;
        if (gpt_encode(splitText).length < 2000 && splitText.length > 1) {
            writeToProcessedFile(splitText, fileInfo);
        }
        else {
            let consoleTextPreview = splitText.slice(0, 50);
            console.log(`Block: ${colors.green}"${consoleTextPreview}..."${colors.default} of file ${colors.blue}${fileInfo[1]}${colors.default} has >2000 tokens. Splitting by punctuation.`);
            splitBySeperators(splitText, [". ", "...\\n", ".\\n", "? ", "?\\n"], fileInfo)
            continue;
        }
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

    for (let i = 0, startPoint; i < splitPoints.length; i++) {
        let splitText;
        let endPoint = splitPoints[i];
        if (i == 0) {
            startPoint = 0;
            while (textStr.slice(startPoint, startPoint + 2).includes("\\n")) {
                startPoint += 2
            }
            while (textStr.slice(endPoint - 2, endPoint).includes("\\n")) {
                endPoint -= 2
            }
            splitText = textStr.slice(startPoint, endPoint)
        }
        else {
            startPoint = splitPoints[i - 1];
            while (textStr.slice(startPoint, startPoint + 2).includes("\\n")) {
                startPoint += 2
            }
            while (textStr.slice(endPoint - 2, endPoint).includes("\\n")) {
                endPoint -= 2
            }
            splitText = textStr.slice(startPoint, endPoint);
        }
        splitText = splitText.trim();
        let tokenCount = gpt_encode(splitText).length;
        if (tokenCount < 2000 && splitText.length !== 0) {
            writeToProcessedFile(splitText, fileInfo);
        }
        else {
            let consoleTextPreview = splitText.slice(0, 50);
            console.log(`Could not write textblock: ${consoleTextPreview} of file ${fileInfo[1]}. Tokencount: ${tokenCount} `);
        }

    }

}



