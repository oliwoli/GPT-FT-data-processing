const fs = require('fs');
const path = require('path');

const MAIN_FOLDER = "++PROCESSED";

const colors = require('./colors');

function getFileWithPath(srcpath) {
    return fs.readdirSync(srcpath)
        .map(file => path.join(srcpath, file))
        .filter(path => fs.statSync(path).isFile());
}

function getFileNames(srcpath) {
    return fs.readdirSync(srcpath)
        .map(file => path.join(file))
        .filter(path => fs.statSync(path).isFile());
}

function createMergeFile(fileNames) {
    let filename = `merged_${(new Date().toJSON().slice(0, 13))}.jsonl`

    try {
        fs.writeFile(`${MAIN_FOLDER}\\merged\\${filename}`, '', function (err) {
            if (err) throw err;
            console.log(`File "${filename}" created successfully.`);
        });
        return [true, filename];
    } catch (error) {
        // file already exists
        let deleteContent = deleteFileContent(pathToFile);
        if (deleteContent == true) return true;
        else return false
    }
}

function writeToMergeFile(mainFile, content) {
    try {
        fs.appendFile(`${MAIN_FOLDER}/merged/${mainFile}`, content, function (err) {
            if (err) return console.log(err);
        });
        return true;
    } catch (error) {
        console.log(colors.red + "could not append to file." + colors.default)
    }
}

let processed_files = getFileWithPath(MAIN_FOLDER);
let mergeFile = createMergeFile(processed_files)
if (mergeFile) {
    processed_files.forEach(element => {
        if (element.includes(".gitignore")) return;
        let fileContent = fs.readFileSync(element, 'utf-8');
        let isTodo = element.includes("_todo_");
        if (!isTodo) writeToMergeFile(mergeFile[1], fileContent)
        else console.log(`skipping merging file ${colors.purple}${element}${colors.default}`)
    });
    console.log("merged.")
}
