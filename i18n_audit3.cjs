const fs = require('fs');
const path = require('path');
const localesDir = path.join(process.cwd(), 'public', 'locales');
const langs = ['ar', 'ku', 'kmr', 'en'];
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

langs.forEach(l => {
    const file = path.join(localesDir, l, 'translation.json');
    data[l] = flatten(JSON.parse(fs.readFileSync(file, 'utf8')));
});

const isEnglish = (str) => {
    if (typeof str !== 'string') return false;
    // Check if it's mostly english letters (ignore numbers, symbols, placeholders)
    const stripped = str.replace(/\{\{[^}]+\}\}/g, '').replace(/\{[^}]+\}/g, '').replace(/[^a-zA-Z]/g, '');
    return stripped.length > 5 && str.match(/[a-zA-Z]{4,}/); // At least one 4-letter english word and 5 letters total
};

const untranslated = { ar: [], ku: [], kmr: [] };
const allKeys = Object.keys(data['en']);

allKeys.forEach(k => {
    ['ar', 'ku', 'kmr'].forEach(l => {
        const val = data[l][k];
        const enVal = data['en'][k];
        // If the value in ar/ku/kmr is identical to English, or mostly English characters
        if (typeof val === 'string' && val.length > 0) {
            if (val === enVal && !val.match(/^[0-9\.\-\s]+$/) && val.match(/[a-zA-Z]/)) {
                untranslated[l].push({ key: k, val });
            } else if (l === 'ar' && !val.match(/[\u0600-\u06FF]/) && val.match(/[a-zA-Z]/)) {
                // Arabic should have Arabic characters
                untranslated[l].push({ key: k, val });
            }
        }
    });
});

console.log(JSON.stringify({
    untranslatedCount: {
        ar: untranslated.ar.length,
        ku: untranslated.ku.length,
        kmr: untranslated.kmr.length
    },
    sample_ar: untranslated.ar.slice(0, 10),
    sample_ku: untranslated.ku.slice(0, 10),
    sample_kmr: untranslated.kmr.slice(0, 10)
}, null, 2));
