const fs = require('fs');

const bad = JSON.parse(fs.readFileSync('public/locales/bad/translation.json', 'utf-8'));
const ar = JSON.parse(fs.readFileSync('public/locales/ar/translation.json', 'utf-8'));
const en = JSON.parse(fs.readFileSync('public/locales/en/translation.json', 'utf-8'));

console.log('BAD translation keys:', Object.keys(bad));
console.log('Number of catalog entries in BAD:', Object.keys(bad.catalog || {}).length);
console.log('Number of catalog entries in AR:', Object.keys(ar.catalog || {}).length);

// Let us inspect catalog items and inputs/outputs in bad
for (const [key, val] of Object.entries(bad.catalog)) {
  if (!val.inputs || !val.outputs || !val.title || !val.theoryBackground) {
    console.log('Incomplete catalog item:', key, {
      hasTitle: !!val.title,
      hasInputs: !!val.inputs,
      hasOutputs: !!val.outputs,
      hasTheory: !!val.theoryBackground
    });
  }
}
