const fs = require('fs');
const path = require('path');

const localesDir = './public/locales';
const languages = ['en', 'ar', 'ku', 'kmr'];
const files = languages.reduce((acc, lang) => {
    acc[lang] = path.join(localesDir, lang, 'translation.json');
    return acc;
}, {});

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

const data = {};
const flattenedData = {};
const allKeys = new Set();

languages.forEach(lang => {
    try {
        const content = fs.readFileSync(files[lang], 'utf8');
        data[lang] = JSON.parse(content);
        flattenedData[lang] = flatten(data[lang]);
        Object.keys(flattenedData[lang]).forEach(key => allKeys.add(key));
    } catch (e) {
        console.error(`Error reading ${lang}: ${e.message}`);
    }
});

console.log('--- Key Statistics ---');
languages.forEach(lang => {
    console.log(`${lang}: ${Object.keys(flattenedData[lang] || {}).length} keys`);
});

console.log('\n--- Missing Keys Analysis ---');
allKeys.forEach(key => {
    const missingIn = languages.filter(lang => !flattenedData[lang].hasOwnProperty(key));
    if (missingIn.length > 0) {
        console.log(`Key "${key}" is missing in: ${missingIn.join(', ')}`);
    }
});

console.log('\n--- Empty/Null Values Analysis ---');
languages.forEach(lang => {
    Object.entries(flattenedData[lang] || {}).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) {
            console.log(`[${lang}] Key "${key}" has an empty/null value.`);
        }
    });
});

console.log('\n--- Placeholder Consistency Analysis ---');
const placeholderRegex = /\{\{([^}]+)\}\}/g;
allKeys.forEach(key => {
    const placeholders = {};
    languages.forEach(lang => {
        if (flattenedData[lang].hasOwnProperty(key)) {
            const val = String(flattenedData[lang][key]);
            const matches = [...val.matchAll(placeholderRegex)].map(m => m[1].trim());
            placeholders[lang] = matches.sort();
        }
    });

    const firstLang = Object.keys(placeholders)[0];
    const firstPlaceholders = JSON.stringify(placeholders[firstLang]);
    
    for (let i = 1; i < Object.keys(placeholders).length; i++) {
        const lang = Object.keys(placeholders)[i];
        if (JSON.stringify(placeholders[lang]) !== firstPlaceholders) {
            console.log(`Placeholder mismatch for key "${key}":`);
            languages.forEach(l => {
                if (placeholders[l]) {
                    console.log(`  ${l}: [${placeholders[l].join(', ')}]`);
                }
            });
            break;
        }
    }
});
