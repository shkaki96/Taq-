const fs = require('fs');
const path = require('path');

const localesDir = './public/locales';
const languages = ['en', 'ar', 'ku', 'kmr'];
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

console.log('--- Untranslated Values (Value == Key) ---');
languages.forEach(lang => {
    Object.entries(flattenedData[lang]).forEach(([key, value]) => {
        const lastPart = key.split('.').pop();
        if (value === lastPart && value.length > 3) { // Ignore short things like "id" or "t"
            console.log(`[${lang}] Potential untranslated key: "${key}" (Value: "${value}")`);
        }
    });
});

console.log('\n--- Cross-Language Identity Check (Non-Symbol) ---');
// Check if EN and AR have identical values for keys that should be translated
const ignoreKeys = ['unit', 'formula', 'symbol', 'physical_law', 'equation'];
Object.entries(flattenedData['en']).forEach(([key, enVal]) => {
    const arVal = flattenedData['ar'][key];
    if (arVal && enVal === arVal) {
        const isTechnical = ignoreKeys.some(ik => key.toLowerCase().includes(ik)) || /^[A-Z0-9._\(\) \/\*+\-=^√πθλμ₀₁₂₃₄₅₆₇₈₉°ΔΣτ]+$/i.test(enVal);
        if (!isTechnical && enVal.length > 2) {
             console.log(`Key "${key}" has identical value in EN and AR: "${enVal}"`);
        }
    }
});

console.log('\n--- Long String Analysis (Potential UI breaking) ---');
languages.forEach(lang => {
    Object.entries(flattenedData[lang]).forEach(([key, value]) => {
        if (typeof value === 'string' && value.length > 200) {
             console.log(`[${lang}] Very long string for key "${key}" (${value.length} chars)`);
        }
    });
});
