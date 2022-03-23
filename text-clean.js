module.exports = { clean }

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

function clean(textStr) {
    let output = fixLineBreaks(textStr);
    output = fixQuotes(output);
    try {
        let output_withNoHTML = output.replace(/<\/?[^>]+(>|$)/g, "");
        return output_withNoHTML
    } catch (error) {
        console.log("error while trying to remove HTML tags.")
        return output
    }
}