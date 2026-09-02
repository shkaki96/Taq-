const fs = require('fs');
const path = require('path');
const localesDir = path.join(process.cwd(), 'public', 'locales');
const data = {};

function flatten(obj, prefix = '', res = {}) {
    for (let k in obj) {
        let key = prefix ? prefix + '.' + k : k;
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            flatten(obj[k], key, res);
        } else {
            res[key] = obj[k];
        }
    }
    return res;
}

['ar', 'ku', 'kmr', 'en'].forEach(l => {
    const file = path.join(localesDir, l, 'translation.json');
    data[l] = flatten(JSON.parse(fs.readFileSync(file, 'utf8')));
});

const checkKmr = [];
const allKeys = Object.keys(data['en']);
allKeys.forEach(k => {
    if (k.startsWith('formulas.') || k.startsWith('constants.') || k.endsWith('.color') || k.startsWith('quiz.') || k.endsWith('.unit') || k.endsWith('.symbol')) return;
    const val = data['kmr'][k];
    const enVal = data['en'][k];
    if (typeof val === 'string' && val.length > 2 && val === enVal && !val.match(/^[0-9\.\-\s]+$/) && val.match(/[a-zA-Z]/)) {
        checkKmr.push({key: k, val});
    }
});

console.log("KMR Untranslated Text Strings:", checkKmr.length);
console.log(JSON.stringify(checkKmr, null, 2));
