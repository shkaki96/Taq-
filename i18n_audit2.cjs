const fs = require('fs');
const path = require('path');
const localesDir = path.join(process.cwd(), 'public', 'locales');
const langs = fs.readdirSync(localesDir).filter(f => fs.statSync(path.join(localesDir, f)).isDirectory());
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

const allKeys = Object.keys(data['ar']);
const getPlaceholders = (str) => {
    if (typeof str !== 'string') return [];
    const matches1 = str.match(/\{\{([^}]+)\}\}/g) || [];
    const matches2 = str.match(/(?<!\{)\{([^}]+)\}(?!\})/g) || [];
    return [...matches1, ...matches2].sort();
};

const issues = {};
allKeys.forEach(k => {
    const phMap = {};
    langs.forEach(l => {
        const val = data[l][k];
        if (typeof val === 'string') {
            phMap[l] = getPlaceholders(val).join(',');
        }
    });
    const unique = new Set(Object.values(phMap));
    if (unique.size > 1) {
        issues[k] = phMap;
    }
});
console.log(JSON.stringify(issues, null, 2));
