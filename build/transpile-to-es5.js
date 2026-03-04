#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Transpiling JavaScript to ES5 for Chrome extension compatibility...');

const files = [
  'src/sidepanel/app.js',
  'src/sidepanel/components/tab-overview.js',
  'src/sidepanel/components/tab-colors.js',
  'src/sidepanel/components/tab-typography.js',
  'src/sidepanel/components/tab-assets.js',
  'src/sidepanel/components/element-inspector.js',
  'src/sidepanel/utils/messaging.js',
  'src/sidepanel/utils/formatters.js',
  'src/sidepanel/error-handler.js'
];

// ES6 to ES5 transformations
function transpileToES5(code) {
  let result = code;
  
  // 1. Arrow functions => regular functions
  result = result.replace(/\(([^)]*)\)\s*=>\s*{/g, 'function($1) {');
  result = result.replace(/=>\s*([^;]+);/g, ' { return $1; }');
  
  // 2. Remove optional chaining
  result = result.replace(/(\w+)\?\./g, '$1 && $1.');
  result = result.replace(/(\w+)\?\(/g, '$1 && $1(');
  
  // 3. Convert template literals to string concatenation
  result = result.replace(/`([^`]+)\$\{([^}]+)\}([^`]*)`/g, function(match, prefix, expression, suffix) {
    if (suffix && suffix.includes('${')) {
      // Multi-variable templates - convert to string concat
      return "'" + prefix + "' + (" + expression + ") + '" + suffix + "'";
    }
    return "'" + prefix + "' + (" + expression + ") + '" + suffix + "'";
  });
  
  // 4. Convert let/const to var (for older engines)
  result = result.replace(/\b(let|const)\b/g, 'var');
  
  // 5. Convert includes() to indexOf()
  result = result.replace(/(\w+)\.includes\(([^)]+)\)/g, '$1.indexOf($2) !== -1');
  
  // 6. Convert startsWith/endsWith
  result = result.replace(/(\w+)\.startsWith\(([^)]+)\)/g, '$1.indexOf($2) === 0');
  result = result.replace(/(\w+)\.endsWith\(([^)]+)\)/g, '$1.indexOf($2) === $1.length - $2.length');
  
  return result;
}

// Process each file
files.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping: ${file} (not found)`);
    return;
  }
  
  const code = fs.readFileSync(fullPath, 'utf8');
  const transpiled = transpileToES5(code);
  
  // Write ES5 version with .es5.js suffix
  const es5Path = fullPath.replace('.js', '.es5.js');
  fs.writeFileSync(es5Path, transpiled);
  
  console.log(`✅ Transpiled: ${file} -> ${path.basename(es5Path)}`);
});

// Create bundle for content scripts still using ES6
const contentBundle = fs.readFileSync('src/content/bundle.js', 'utf8');
const es5Bundle = transpileToES5(contentBundle);
fs.writeFileSync('src/content/bundle.es5.js', es5Bundle);
console.log(`✅ Transpiled: src/content/bundle.js -> bundle.es5.js`);

console.log('\n🎉 All JavaScript transpiled to ES5!');
console.log('Now run: npx tailwindcss -i src/sidepanel/styles/input.css -o src/sidepanel/styles/generated.css --minify');
console.log('Then reload extension in Chrome');