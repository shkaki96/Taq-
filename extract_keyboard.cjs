const fs = require('fs');
const content = fs.readFileSync('src/components/PhysicsEquationKeyboard.tsx', 'utf8');

const getArray = (name) => {
  const start = content.indexOf(`const ${name} = [`);
  const end = content.indexOf('];', start) + 2;
  const str = content.substring(start, end);
  return eval(str.replace(`const ${name} = `, ''));
};

const greekLetters = getArray('greekLetters');
const physicsVariables = getArray('physicsVariables');
const siUnits = getArray('siUnits');

const output = {
  greek: greekLetters,
  variables: physicsVariables,
  units: siUnits
};

fs.writeFileSync('keyboard_data.json', JSON.stringify(output, null, 2));
