const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('Sim.tsx'));

const SLIDER_CLASSES = 'touch-none h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5';

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');

  // First clean up any corrupted className strings from previous regex pass
  // E.g. className="... ${ ... }" -> restore to template literal className={`... ${ ... }`}
  content = content.replace(/className="([^"]*\$\{[^"]*)"/g, (m, inner) => {
    return `className={\`${inner}\`}`;
  });

  // Also fix any double className attributes like className="a" className="b"
  // If an element tag has multiple className="..." or className={`...`}
  content = content.replace(/(<[a-zA-Z0-9_-]+[\s\S]*?>)/g, (tagMatch) => {
    // Count classNames in this tag
    const matches = tagMatch.match(/className=(?:"[^"]*"|\{`[^`]*`\}|\{[^}]+\})/g);
    if (matches && matches.length > 1) {
      // Remove all classNames except the first one or combine them
      let first = true;
      let newTag = tagMatch.replace(/\s*className=(?:"[^"]*"|\{`[^`]*`\}|\{[^}]+\})/g, (m) => {
        if (first) {
          first = false;
          return m;
        }
        return '';
      });
      return newTag;
    }
    return tagMatch;
  });

  // Safe Button Touch Target Upgrade
  // Find <button ... > tags
  content = content.replace(/(<button[\s\S]*?>)/g, (btnTag) => {
    if (btnTag.includes('min-h-[44px]') || btnTag.includes('min-h-11') || btnTag.includes('h-11') || btnTag.includes('h-12')) {
      return btnTag;
    }
    if (btnTag.includes('className="')) {
      return btnTag.replace('className="', 'className="min-h-[44px] min-w-[44px] ');
    } else if (btnTag.includes('className={`')) {
      return btnTag.replace('className={`', 'className={`min-h-[44px] min-w-[44px] ');
    } else if (btnTag.includes('className={')) {
      return btnTag.replace('className={', 'className={"min-h-[44px] min-w-[44px] " + ');
    } else {
      return btnTag.replace('<button', '<button className="min-h-[44px] min-w-[44px]"');
    }
  });

  // Safe Range Input Slider Upgrade
  // Find <input ... type="range" ... > tags
  content = content.replace(/(<input[\s\S]*?>)/g, (inputTag) => {
    if (!inputTag.includes('type="range"') && !inputTag.includes("type='range'")) {
      return inputTag;
    }

    let updated = inputTag;

    // Check if slider thumb class is present
    if (!updated.includes('[&::-webkit-slider-thumb]')) {
      if (updated.includes('className="')) {
        updated = updated.replace('className="', `className="${SLIDER_CLASSES} `);
      } else if (updated.includes('className={`')) {
        updated = updated.replace('className={`', `className={\`${SLIDER_CLASSES} `);
      } else {
        updated = updated.replace('<input', `<input className="${SLIDER_CLASSES}"`);
      }
    } else {
      // Ensure touch-none is present
      if (!updated.includes('touch-none')) {
        if (updated.includes('className="')) updated = updated.replace('className="', 'className="touch-none ');
        if (updated.includes('className={`')) updated = updated.replace('className={`', 'className={`touch-none ');
      }
    }

    // Replace h-1.5 or h-1 with h-2
    updated = updated.replace(/\bh-1\.5\b/g, 'h-2').replace(/\bh-1\b/g, 'h-2');

    return updated;
  });

  // Safe Checkbox/Toggle Label upgrade
  content = content.replace(/(<label[\s\S]*?>)/g, (lblTag) => {
    if (lblTag.includes('cursor-pointer') && !lblTag.includes('min-h-[44px]')) {
      if (lblTag.includes('className="')) {
        return lblTag.replace('className="', 'className="min-h-[44px] flex items-center ');
      } else if (lblTag.includes('className={`')) {
        return lblTag.replace('className={`', 'className={`min-h-[44px] flex items-center ');
      }
    }
    return lblTag;
  });

  // Upgrade text-xs on slider labels or readouts to text-sm
  content = content.replace(/className="text-xs (text-zinc-[234]00[^"]*)"/g, 'className="text-sm $1"');
  content = content.replace(/className="text-xs (font-mono[^"]*)"/g, 'className="text-sm $1"');

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Applied safe UI transformations to all simulation components.');
