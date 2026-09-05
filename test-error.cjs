const fs = require('fs');
// Let's modify index.html or main.tsx to intercept console.error!
const mainTsxPath = 'src/main.tsx';
let mainTsx = fs.readFileSync(mainTsxPath, 'utf8');
if (!mainTsx.includes('console.error = ')) {
  const injection = `
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('two children with the same key')) {
    originalError('KEY ERROR CAUGHT:', args);
  }
  originalError(...args);
};
`;
  // Prepend to mainTsx
  mainTsx = injection + mainTsx;
  fs.writeFileSync(mainTsxPath, mainTsx);
}
