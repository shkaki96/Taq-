const fs = require('fs');

let content = fs.readFileSync('src/components/PhysicsEquationKeyboard.tsx', 'utf8');

const kbData = JSON.parse(fs.readFileSync('keyboard_data.json', 'utf8'));

const safeId = (s) => {
  let res = s;
  res = res.replace(/₀/g, '0');
  res = res.replace(/²/g, '2');
  res = res.replace(/°/g, 'deg');
  res = res.replace(/\//g, '_per_');
  return res;
};

const generateArrayCode = (array, category) => {
  let code = `[\n`;
  array.forEach(item => {
    code += `    { s: '${item.s.replace(/'/g, "\\'")}', labelKey: 'keyboard.${category}.${safeId(item.s)}' },\n`;
  });
  code += `  ]`;
  return code;
};

['greekLetters', 'physicsVariables', 'siUnits'].forEach(name => {
  const start = content.indexOf(`const ${name} = [`);
  if (start !== -1) {
    const end = content.indexOf('];', start) + 2;
    const category = name === 'greekLetters' ? 'greek' : name === 'physicsVariables' ? 'variables' : 'units';
    const newCode = `const ${name} = ${generateArrayCode(kbData[category], category)};`;
    content = content.substring(0, start) + newCode + content.substring(end);
  } else {
    console.log(`Could not find ${name}`);
  }
});

content = content.replace(/v\.label\[lang\]\s*\|\|\s*v\.label\.en/g, 'tI18n(v.labelKey)');
content = content.replace(/g\.label\[lang\]\s*\|\|\s*g\.label\.en/g, 'tI18n(g.labelKey)');
content = content.replace(/u\.label\[lang\]\s*\|\|\s*u\.label\.en/g, 'tI18n(u.labelKey)');

fs.writeFileSync('src/components/PhysicsEquationKeyboard.tsx', content);
console.log("Keyboard patched!");
