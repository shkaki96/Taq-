const fs = require('fs');
let content = fs.readFileSync('src/components/PhysicsEquationKeyboard.tsx', 'utf8');

const getArray = (name) => {
  const start = content.indexOf(`const ${name} = [`);
  const end = content.indexOf('];', start) + 2;
  const str = content.substring(start, end);
  return eval(str.replace(`const ${name} = `, ''));
};

const operators = getArray('operators');
const safeId = (s) => {
  let res = s;
  res = res.replace(/₀/g, '0');
  res = res.replace(/²/g, '2');
  res = res.replace(/³/g, '3');
  res = res.replace(/°/g, 'deg');
  res = res.replace(/\//g, '_per_');
  res = res.replace(/[^a-zA-Z0-9_]/g, (c) => '_' + c.charCodeAt(0) + '_');
  return res;
};

const dataEn = JSON.parse(fs.readFileSync('public/locales/en/translation.json', 'utf8'));
const dataAr = JSON.parse(fs.readFileSync('public/locales/ar/translation.json', 'utf8'));
const dataKu = JSON.parse(fs.readFileSync('public/locales/ku/translation.json', 'utf8'));
const dataKmr = JSON.parse(fs.readFileSync('public/locales/kmr/translation.json', 'utf8'));

[dataEn, dataAr, dataKu, dataKmr].forEach(d => {
  if (!d.keyboard.operators) d.keyboard.operators = {};
});

operators.forEach(item => {
  const id = safeId(item.s);
  dataEn.keyboard.operators[id] = item.label.en;
  dataAr.keyboard.operators[id] = item.label.ar;
  dataKu.keyboard.operators[id] = item.label.ku;
  dataKmr.keyboard.operators[id] = item.label.kmr;
});

fs.writeFileSync('public/locales/en/translation.json', JSON.stringify(dataEn, null, 2));
fs.writeFileSync('public/locales/ar/translation.json', JSON.stringify(dataAr, null, 2));
fs.writeFileSync('public/locales/ku/translation.json', JSON.stringify(dataKu, null, 2));
fs.writeFileSync('public/locales/kmr/translation.json', JSON.stringify(dataKmr, null, 2));

const generateArrayCode = (array, category) => {
  let code = `[\n`;
  array.forEach(item => {
    code += `    { s: '${item.s.replace(/'/g, "\\'")}', labelKey: 'keyboard.${category}.${safeId(item.s)}' },\n`;
  });
  code += `  ]`;
  return code;
};

const start = content.indexOf(`const operators = [`);
const end = content.indexOf('];', start) + 2;
const newCode = `const operators = ${generateArrayCode(operators, 'operators')};`;
content = content.substring(0, start) + newCode + content.substring(end);

content = content.replace(/op\.label\[lang\]\s*\|\|\s*op\.label\.en/g, 'tI18n(op.labelKey)');
content = content.replace(/const getLabel = [^;]+;/g, ''); // remove unused getLabel function
content = content.replace(/getLabel\(op\.label\)/g, 'tI18n(op.labelKey)');

fs.writeFileSync('src/components/PhysicsEquationKeyboard.tsx', content);
console.log("Ops patched");
