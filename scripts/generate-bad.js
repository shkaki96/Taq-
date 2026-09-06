// Script to build public/locales/bad/translation.json and docs/references/bad-translation-derived-notes.md
const fs = require('fs');

const ku = JSON.parse(fs.readFileSync('public/locales/ku/translation.json', 'utf8'));
const kmr = JSON.parse(fs.readFileSync('public/locales/kmr/translation.json', 'utf8'));

console.log("Loaded KU and KMR translations.");
