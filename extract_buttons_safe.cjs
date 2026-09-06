const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const existingFiles = fs.readdirSync(dir).filter(f => f.endsWith('Sim.tsx'));

const knownMap = {
  freefall: 'FreeFallSim.tsx',
  circuits: 'CircuitSim.tsx',
  molecules_and_light: 'MoleculesLightSim.tsx',
  capacitor_lab: 'CapacitorSim.tsx',
  charges_and_fields: 'ChargesFieldsSim.tsx',
  resistance_in_wire: 'WireResistanceSim.tsx',
  gravity_and_orbits: 'GravityOrbitsSim.tsx',
  keplers_laws: 'KeplerLawsSim.tsx',
  fourier_making_waves: 'FourierWavesSim.tsx',
  wave_on_a_string: 'WaveOnStringSim.tsx',
  gas_diffusion: 'DiffusionSim.tsx',
  blackbody_spectrum: 'BlackbodySim.tsx',
  calorimetry_equilibrium: 'CalorimetrySim.tsx',
  gravity_force_lab: 'GravityForceSim.tsx'
};

const data = fs.readFileSync('src/experimentsData.ts', 'utf8');
const expKeys = [...data.matchAll(/expKey:\s*'([^']+)'/g)].map(m => m[1]);
function toPascal(str) {
  return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}
let expectedFiles = [];
expKeys.forEach(k => {
  let file = knownMap[k] || (toPascal(k) + 'Sim.tsx');
  expectedFiles.push(file);
});
expectedFiles = [...new Set(expectedFiles)];
if (!expectedFiles.includes('RotationalDynamicsTorqueSim.tsx')) expectedFiles.push('RotationalDynamicsTorqueSim.tsx');
if (!expectedFiles.includes('ModelsHAtomSim.tsx')) expectedFiles.push('ModelsHAtomSim.tsx');

const missingFiles = expectedFiles.filter(f => !existingFiles.includes(f));

let out = '| Experiment File | Line # | Translation Key / Text | Raw Code Snippet |\n|---|---|---|---|\n';

let totalRows = 0;
let filesScanned = 0;

existingFiles.forEach(file => {
  filesScanned++;
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.match(/<button/i) || 
      line.match(/onClick=/i) || 
      line.match(/<select/i) || 
      line.match(/type=["']checkbox["']/i) || 
      line.match(/type=["']radio["']/i) ||
      line.match(/<Switch/i)
    ) {
      let snippetStr = line.trim();
      
      let textOrKey = "N/A";
      const tMatch = snippetStr.match(/t\(['"`](.*?)['"`]\)/);
      if (tMatch) {
        textOrKey = `t('${tMatch[1]}')`;
      } else {
        const textMatch = snippetStr.match(/>([^<>]+)<\/(?:button|Button|select)>/i);
        if (textMatch && textMatch[1].trim() && !textMatch[1].includes('{')) {
          textOrKey = `"${textMatch[1].trim()}"`;
        } else if (snippetStr.match(/<[A-Z][A-Za-z]+Icon/)) {
          textOrKey = "Icon";
        }
      }
      
      let safeSnippet = snippetStr.replace(/\|/g, '\\|').replace(/`/g, '\\`');
      if (safeSnippet.length > 70) {
        safeSnippet = safeSnippet.substring(0, 67) + '...';
      }
      
      out += `| ${file} | ${i + 1} | ${textOrKey} | \`${safeSnippet}\` |\n`;
      totalRows++;
    }
  }
});

missingFiles.forEach(f => {
  out += `| ${f} | NOT FOUND | NOT FOUND | NOT FOUND |\n`;
});

out += `\nTotal row count: ${totalRows + missingFiles.length}\n`;
out += `Total file count actually scanned: ${filesScanned}\n`;

fs.writeFileSync('final_table_safe.md', out);
console.log(out.length);
