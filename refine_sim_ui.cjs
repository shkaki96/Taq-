const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('Sim.tsx'));

const THUMB_CLASSES = 'touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5';

let processedCount = 0;

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix all duplicate className attributes on any HTML/JSX tag across multi-lines
  // A JSX tag starts with <tagname and ends with > (handling nested quotes / braces safely)
  content = content.replace(/(<[a-zA-Z0-9_-]+)([\s\S]*?)(\/?>)/g, (fullMatch, tagStart, attrs, tagEnd) => {
    // If tag contains className
    const hasClassName = /className=/.test(attrs);
    
    // 1. If it is a range input
    const isRangeInput = (tagStart === '<input' || tagStart.startsWith('<input')) && (attrs.includes('type="range"') || attrs.includes("type='range'"));
    
    // 2. If it is a button
    const isButton = (tagStart === '<button' || tagStart.startsWith('<button'));

    // 3. If it is a label wrapping a toggle or cursor-pointer
    const isCursorLabel = (tagStart === '<label' || tagStart.startsWith('<label')) && attrs.includes('cursor-pointer');

    if (!hasClassName && !isRangeInput && !isButton && !isCursorLabel) {
      return fullMatch;
    }

    // Extract all className values from attrs
    let extractedClasses = [];
    
    // Pattern matches className="..." or className={`...`} or className={"..."}
    const classRegex = /className=(?:"([^"]*)"|\{`([^`]*)`\}|\{"([^"]*)"\}|\{([^}]+)\})/g;
    let match;
    while ((match = classRegex.exec(attrs)) !== null) {
      const val = match[1] || match[2] || match[3] || match[4] || '';
      // clean template literals or quotes
      val.split(/\s+/).forEach(c => {
        if (c && !extractedClasses.includes(c)) {
          extractedClasses.push(c);
        }
      });
    }

    // Clean attrs by removing all className declarations
    let cleanAttrs = attrs.replace(/\s*className=(?:"[^"]*"|\{`[^`]*`\}|\{"[^"]*"\}|\{[^}]+\})/g, '');

    // Transform classes based on element type
    if (isRangeInput) {
      if (!extractedClasses.includes('touch-none')) extractedClasses.push('touch-none');
      if (!extractedClasses.some(c => c.includes('[&::-webkit-slider-thumb]'))) {
        extractedClasses.push('[&::-webkit-slider-thumb]:w-5', '[&::-webkit-slider-thumb]:h-5', '[&::-moz-range-thumb]:w-5', '[&::-moz-range-thumb]:h-5');
      }
      // Replace h-1 or h-1.5 with h-2
      extractedClasses = extractedClasses.map(c => (c === 'h-1.5' || c === 'h-1') ? 'h-2' : c);
      if (!extractedClasses.includes('h-2')) extractedClasses.push('h-2');
    }

    if (isButton) {
      if (!extractedClasses.includes('min-h-[44px]')) extractedClasses.unshift('min-h-[44px]');
      if (!extractedClasses.includes('min-w-[44px]')) extractedClasses.unshift('min-w-[44px]');
    }

    if (isCursorLabel) {
      if (!extractedClasses.includes('min-h-[44px]')) extractedClasses.unshift('min-h-[44px]');
    }

    const finalClassName = extractedClasses.filter(Boolean).join(' ');
    if (finalClassName) {
      cleanAttrs += ` className="${finalClassName}"`;
    }

    return `${tagStart}${cleanAttrs}${tagEnd}`;
  });

  // Upgrade text-xs on slider labels or readouts to text-sm
  content = content.replace(/className="text-xs (text-zinc-[234]00[^"]*)"/g, 'className="text-sm $1"');
  content = content.replace(/className="text-xs (font-mono[^"]*)"/g, 'className="text-sm $1"');

  // Check controls scrollability (if >= 4 sliders)
  const rangeCount = (content.match(/type="range"/g) || []).length + (content.match(/type='range'/g) || []).length;
  if (rangeCount >= 4) {
    if (content.includes('space-y-4') && !content.includes('max-h-[50vh]')) {
      content = content.replace(/className="([^"]*space-y-4[^"]*)"/, (m, c) => {
        if (c.includes('max-h')) return m;
        return `className="${c.trim()} max-h-[50vh] overflow-y-auto pr-1"`;
      });
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  processedCount++;
});

console.log(`Processed ${processedCount} files cleanly.`);
