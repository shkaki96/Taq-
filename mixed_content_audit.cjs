const fs = require('fs');
const path = require('path');

const localesDir = './public/locales';
const languages = ['ar', 'ku']; // Arabic script languages
const flattenedData = {};

function flatten(obj, prefix = '') {
    let result = {};
    for (let key in obj) {
        let newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            Object.assign(result, flatten(obj[key], newKey));
        } else {
            result[newKey] = obj[key];
        }
    }
    return result;
}

languages.forEach(lang => {
    const content = fs.readFileSync(path.join(localesDir, lang, 'translation.json'), 'utf8');
    flattenedData[lang] = flatten(JSON.parse(content));
});

console.log('--- Mixed Content Check (Latin characters in Arabic/Kurdish strings) ---');
const latinRegex = /[a-zA-Z]/;
const ignoreKeys = ['unit', 'formula', 'symbol', 'physical_law', 'equation', 'url', 'id', 'color', 'value', 'parameters'];

languages.forEach(lang => {
    Object.entries(flattenedData[lang]).forEach(([key, value]) => {
        if (typeof value !== 'string') return;
        
        // Skip keys that are supposed to have latin chars
        const isTechnical = ignoreKeys.some(ik => key.toLowerCase().includes(ik));
        if (isTechnical) return;

        // Skip placeholders
        const sanitizedValue = value.replace(/\{\{[^}]+\}\}/g, '');
        
        if (latinRegex.test(sanitizedValue)) {
            // Check if it's mostly latin (likely untranslated) or just mixed
            const latinCount = (sanitizedValue.match(/[a-zA-Z]/g) || []).length;
            const totalCount = sanitizedValue.length;
            const ratio = latinCount / totalCount;
            
            if (ratio > 0.5) {
                console.log(`[${lang}] Potential untranslated string (mostly Latin): "${key}" -> "${value}"`);
            } else if (latinCount > 3) {
                 console.log(`[${lang}] Mixed content (Latin in Arabic/Kurdish): "${key}" -> "${value}"`);
            }
        }
    });
});
