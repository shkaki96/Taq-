const fs = require('fs');
const path = require('path');
const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
const results = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf-8');
  if (!content.includes('requestAnimationFrame')) return;
  
  // Find all requestAnimationFrame
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('requestAnimationFrame')) {
      // Look upwards to find if it's inside a useEffect
      let foundUseEffect = false;
      let foundCleanup = false;
      for (let i = index; i >= 0; i--) {
        if (lines[i].includes('useEffect(')) {
          foundUseEffect = true;
          // check if there is a cleanup within this useEffect
          for (let j = i; j < lines.length; j++) {
             if (lines[j].includes('return () =>')) {
                if (lines[j].includes('cancelAnimationFrame') || lines[j+1]?.includes('cancelAnimationFrame')) {
                   foundCleanup = true;
                }
             }
             if (lines[j].includes('}, [')) break;
          }
          break;
        }
      }
      if (!foundUseEffect || !foundCleanup) {
         results.push({ file, line: index + 1, text: line.trim(), foundUseEffect, foundCleanup });
      }
    }
  });
});

console.log(JSON.stringify(results, null, 2));
