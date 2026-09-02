const fs = require('fs');
const path = require('path');

const localesDir = path.join(process.cwd(), 'public', 'locales');
let langs = [];
if (fs.existsSync(localesDir)) {
    langs = fs.readdirSync(localesDir).filter(f => fs.statSync(path.join(localesDir, f)).isDirectory());
}

const data = {};
const stats = {};

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
    if (fs.existsSync(file)) {
        const stat = fs.statSync(file);
        try {
            const content = JSON.parse(fs.readFileSync(file, 'utf8'));
            const flat = flatten(content);
            data[l] = flat;
            stats[l] = { file: `public/locales/${l}/translation.json`, size: stat.size, keys: Object.keys(flat).length };
        } catch (e) {
            stats[l] = { file: `public/locales/${l}/translation.json`, size: stat.size, error: e.message };
        }
    }
});

const allKeys = new Set();
Object.values(data).forEach(flat => Object.keys(flat).forEach(k => allKeys.add(k)));

const report = {
    stats,
    totalUniqueKeys: allKeys.size,
    missing: {},
    empty: {},
    placeholders: {},
};

const getPlaceholders = (str) => {
    if (typeof str !== 'string') return [];
    // i18next format {{var}} or {var} sometimes, but let's stick to {{var}} for now
    const matches = str.match(/\{\{([^}]+)\}\}/g) || [];
    return matches.map(m => m.replace(/[{}]/g, '').trim()).sort();
};

allKeys.forEach(k => {
    const phMap = {};
    let hasTranslation = false;
    
    langs.forEach(l => {
        if (data[l] && !(k in data[l])) {
            if (!report.missing[l]) report.missing[l] = [];
            report.missing[l].push(k);
        } else if (data[l]) {
            const val = data[l][k];
            if (val === "" || val === null) {
                if (!report.empty[l]) report.empty[l] = [];
                report.empty[l].push(k);
            } else {
                hasTranslation = true;
            }
            const ph = getPlaceholders(val);
            if (ph.length > 0 || hasTranslation) {
                 phMap[l] = ph.join(',');
            }
        }
    });
    
    // check placeholder mismatches (only among languages that have a translation for this key)
    const activePhs = Object.keys(phMap).map(l => phMap[l]);
    const uniquePhs = new Set(activePhs);
    // If there's more than one unique placeholder combination, it's a mismatch
    if (uniquePhs.size > 1) {
        report.placeholders[k] = phMap;
    }
});

fs.writeFileSync('audit_report.json', JSON.stringify(report, null, 2));
console.log("Audit complete. Read audit_report.json for details.");
