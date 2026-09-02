import fs from 'fs';
const components = fs.readdirSync('src/components').filter(f => f.endsWith('.tsx'));

for (const file of components) {
  let content = fs.readFileSync(`src/components/${file}`, 'utf8');
  if (content.includes('export default function ({}: ) {')) {
    const componentName = file.replace('.tsx', '');
    content = content.replace('export default function ({}: ) {', `export default function ${componentName}({ lang, onLogMeasurement }: Props) {`);
    fs.writeFileSync(`src/components/${file}`, content, 'utf8');
  }
}
console.log('done');
