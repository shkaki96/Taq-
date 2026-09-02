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

const untranslated = { ar: [], ku: [], kmr: [] };
const allKeys = Object.keys(data['en']);

allKeys.forEach(k => {
    // filter out keys starting with formulas since they are mostly symbols/math
    if (k.startsWith('formulas.')) return;
    
    ['ar', 'ku', 'kmr'].forEach(l => {
        const val = data[l][k];
        const enVal = data['en'][k];
        if (typeof val === 'string' && val.length > 0) {
            if (val === enVal && !val.match(/^[0-9\.\-\s]+$/) && val.match(/[a-zA-Z]/)) {
                untranslated[l].push({ key: k, val });
            } else if (l === 'ar' && !val.match(/[\u0600-\u06FF]/) && val.match(/[a-zA-Z]/)) {
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
    sample_ar: untranslated.ar,
    sample_ku: untranslated.ku,
    sample_kmr: untranslated.kmr
}, null, 2));
