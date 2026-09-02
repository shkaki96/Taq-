import fs from 'fs';

const components = fs.readdirSync('src/components').filter(f => f.endsWith('.tsx'));

for (const file of components) {
  let content = fs.readFileSync(`src/components/${file}`, 'utf8');
  
  // Find all lucide-react imports
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/g;
  let match;
  const importedIcons = new Set();
  
  while ((match = importRegex.exec(content)) !== null) {
    const icons = match[1].split(',').map(s => s.trim()).filter(Boolean);
    icons.forEach(icon => importedIcons.add(icon));
  }
  
  if (importedIcons.size > 0) {
    // Remove all existing lucide-react imports
    content = content.replace(importRegex, '');
    
    // Add a single consolidated import at the top
    const newImport = `import { ${Array.from(importedIcons).join(', ')} } from 'lucide-react';\n`;
    content = newImport + content.trim();
    
    fs.writeFileSync(`src/components/${file}`, content, 'utf8');
  }
}
console.log('Fixed imports');
