import fs from 'fs';
const components = fs.readdirSync('src/components').filter(f => f.endsWith('.tsx'));

for (const file of components) {
  let content = fs.readFileSync(`src/components/${file}`, 'utf8');
  
  const matches = content.matchAll(/<([A-Z][a-zA-Z0-9_]+)[^>]*>/g);
  const usedIcons = new Set();
  
  for (const match of matches) {
    const tagName = match[1];
    if (tagName !== 'Fragment' && !tagName.includes('Sim') && tagName !== 'PhysicsEquationKeyboard') {
        usedIcons.add(tagName);
    }
  }

  if (usedIcons.size > 0) {
    let missingIcons = [];
    for (const icon of usedIcons) {
       const isDeclared = content.includes(`function ${icon}`) || content.includes(`const ${icon}`) || content.includes(`class ${icon}`);
       
       if (!isDeclared && !['PhysicsEquationKeyboard', 'MeasurementRecord', 'HTMLCanvasElement', 'OscillatorNode', 'GainNode', 'PointMass', 'MaterialType', 'GeometryType', 'TargetMetal', 'LiquidType', 'SphereMaterialType', 'SurfaceType', 'MagneticMode', 'Props', 'TabType', 'Record'].includes(icon) && !icon.endsWith('Props') && !icon.endsWith('Type')) {
           missingIcons.push(icon);
       }
    }
    
    if (missingIcons.length > 0) {
      if (content.match(/import\s*\{\s*\}\s*from\s*['"]lucide-react['"];?/)) {
         content = content.replace(/import\s*\{\s*\}\s*from\s*['"]lucide-react['"];?/, `import { ${missingIcons.join(', ')} } from 'lucide-react';`);
      } else {
         content = `import { ${missingIcons.join(', ')} } from 'lucide-react';\n` + content;
      }
      fs.writeFileSync(`src/components/${file}`, content, 'utf8');
      console.log(`Fixed ${file} with ${missingIcons.join(', ')}`);
    }
  }
}
console.log('Done');
