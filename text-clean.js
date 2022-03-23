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

// cleaning after text has been analyzed
function postClean(textStr) {
    let output = textStr;
    output = output.trim().replace(/\\n\\n\\n/gm, '\\n\\n').replace("[a]");
    return output
}