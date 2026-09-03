const fs = require('fs');
const path = require('path');
const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
const results = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf-8');
  if (!content.includes('requestAnimationFrame') && !content.includes('setInterval')) return;

  const rafMatches = [...content.matchAll(/requestAnimationFrame\(/g)];
  const cancelMatches = [...content.matchAll(/cancelAnimationFrame\(/g)];
  const intervalMatches = [...content.matchAll(/setInterval\(/g)];
  const clearMatches = [...content.matchAll(/clearInterval\(/g)];

  // Look for requestAnimationFrame calls that might not be assigned
  // For example: `requestAnimationFrame(animate);` instead of `animationRef.current = requestAnimationFrame(animate);`
  // A simple heuristic: check if there's any `requestAnimationFrame` not preceded by `=`
  const lines = content.split('\n');
  let unassignedRaf = false;
  let missingRef = false;
  let suspectLines = [];

  lines.forEach((line, i) => {
    if (line.includes('requestAnimationFrame(')) {
      if (!line.includes('=')) {
        unassignedRaf = true;
        suspectLines.push(i + 1);
      }
    }
  });

  // Check if they use a ref to store the ID. If they use a local variable inside useEffect, 
  // and they re-call requestAnimationFrame recursively in `animate`, it might leak if the state changes 
  // and the component re-renders (meaning the local variable is lost if it's not a ref, though closures 
  // normally capture it... wait, if `animate` is a closure, it captures the *old* variable).
  
  // The most common leak pattern in React with requestAnimationFrame is:
  // useEffect(() => {
  //   let reqId;
  //   const loop = () => {
  //       ...
  //       reqId = requestAnimationFrame(loop);
  //   };
  //   loop();
  //   return () => cancelAnimationFrame(reqId);
  // }, []);
  // This actually WORKS. 
  // BUT if they don't have dependency array, or they have state dependencies, and they don't cancel correctly.
  
  // What if it's:
  // const loop = () => { requestAnimationFrame(loop) } // inside component body
  // useEffect(() => { loop() }, [])

  // Let's just output components where rafCount > cancelCount, or there is an unassigned RAF
  
  let status = 'Yes';
  if (rafMatches.length > cancelMatches.length) status = 'No (Missing cancel)';
  if (unassignedRaf) status = 'No (Unassigned RAF)';
  if (intervalMatches.length > clearMatches.length) status = 'No (Missing clear)';

  results.push({
    file,
    type: (rafMatches.length ? 'requestAnimationFrame' : '') + (intervalMatches.length ? (rafMatches.length ? ' & ' : '') + 'setInterval' : ''),
    rafCount: rafMatches.length,
    cancelCount: cancelMatches.length,
    isCleaned: status,
    suspectLines
  });
});

console.log(JSON.stringify(results, null, 2));
