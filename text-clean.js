module.exports = { clean, postClean }

function fixLineBreaks(text) {
    let output = text.replace(/\\/gm, "\\\\")
    output = output.replace(/(?:\r\n|\r|\n)/g, '\\n');
    return output
}

function fixQuotes(text) {
    let output = text.replace(/[„“”]/g, '"');
    output = output.replace(/[‘’]/g, "'");
    output = output.replace(/"/g, '\\"');
    return output
}

function fixHTML(text) {
    let output = text.replace(/<\/?[^>]+(>|$)/g, "");
    return output
}

function clean(textStr) {
    if (textStr.length < 1) return textStr
    let output = fixLineBreaks(textStr);
    output = fixQuotes(output);
    output = fixHTML(output);
    return output
}


function trimStart(text, character) {
    let trim = 0;
    while (text.slice(trim, trim + character.length).includes(character)) {
        trim += character.length
    }
    output = text.slice(trim, text.length)
    return output
}

function trimEnd(text, character) {
    let trim = 0;
    while (text.slice(- trim + character.length).match(character)) {
        trim += character.length
    }
    let output = text.slice(0, text.length - trim)
    return output
}

// cleaning after text has been analyzed
function postClean(textStr, character) {
    let output = textStr;
    output = output.trim().replace(/\\n\\n\\n/gm, '\\n\\n');
    output = trimStart(output, character);
    output = trimEnd(output, character);
    return output
}