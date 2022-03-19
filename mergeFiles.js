const fs = require('fs');
const path = require('path');

function flatten(lists) {
    return lists.reduce((a, b) => a.concat(b), []);
}

let directories = getDirectories("./++DATA/");
console.log(directories);

let directoriesRecursive = getDirectoriesRecursive("./++DATA/");
console.log(directoriesRecursive);

function getDirectories(srcpath) {
    return fs.readdirSync(srcpath)
        .map(file => path.join(srcpath, file))
        .filter(path => fs.statSync(path).isDirectory());
}

function getDirectoriesRecursive(srcpath) {
    return [srcpath, ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive))];
}

directoriesRecursive.forEach(folder => {
    fs.readdir(folder, (err, directories) => {
        directories.forEach(file => {
            if (! fs.lstatSync(path.resolve(folder, file)).isDirectory()) {
                console.log(folder);
                console.log('File: ' + file);  

                let text = fs.readFileSync(`${folder}\\${file}`, 'utf-8');
                console.log(text);
            } 
        });
    });
});
