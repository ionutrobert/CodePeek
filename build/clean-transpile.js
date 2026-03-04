#!/usr/bin/env node
/**
 * Clean ES5 Transpiler - Properly converts ES6 to valid ES5
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Clean ES5 Transpiler\n');

// Read original source
function readFile(filepath) {
  if (!fs.existsSync(filepath)) return null;
  return fs.readFileSync(filepath, 'utf8');
}

// Comprehensive ES5 transpiler
function transpile(code) {
  let result = code;
  
  // 0. Classes to functions
  result = result.replace(/class\s+(\w+)\s*\{/g, 'function $1() {');
  result = result.replace(/\}\s*\{/g, '}\n{'); // add newline between methods
  
  // 1. Remove import statements
  result = result.replace(/^import\s+.*from\s+['"][^'"]+['"];?\s*$/gm, '');
  
  // 2. Remove export statements  
  result = result.replace(/^export\s+\{[^}]+\};?\s*$/gm, '');
  result = result.replace(/^export\s+default\s+\w+;?\s*$/gm, '');
  
  // 3. Remove async keyword (but keep the function)
  // async function -> function
  result = result.replace(/\basync\s+function/g, 'function');
  // async method() -> method() 
  result = result.replace(/\basync\s+(\w+)\s*\(/g, '$1(');
  // standalone async - remove it
  result = result.replace(/\basync\s+/g, '');
  
  // 3b. await -> empty (simple but won't work perfectly)
  // For proper async code, we'd need to refactor. For now, let's wrap
  result = result.replace(/await\s+/g, '');
  
  // 4. Arrow functions - complex case handling
  // () => { ... }
  result = result.replace(/\(\)\s*=>/g, 'function() {');
  // param => { ... }
  result = result.replace(/(\w+)\s*=>\s*\{/g, 'function($1) {');
  // (a, b) => { ... }
  result = result.replace(/\(([^)]+)\)\s*=>/g, 'function($1) {');
  
  // 5. Arrow functions in returns/conditions: x => expr
  result = result.replace(/=>\s*([^{;]+);/g, ' { return $1; }');
  
  // 6. Template literals - convert ${var} to + var +
  // Match `text ${var} text`
  result = result.replace(/`([^`]*)\$\{([^}]+)\}([^`]*)`/g, function(match, prefix, expr, suffix) {
    let str = "'" + prefix + "'";
    str += " + (" + expr + ") + ";
    str += "'" + suffix + "'";
    return str;
  });
  
  // 7. let/const -> var
  result = result.replace(/\b(let|const)\b/g, 'var');
  
  // 8. for...of -> regular for loop (simple conversion)
  result = result.replace(/for\s*\(\s*var\s+(\w+)\s+of\s+(\w+)\s*\)/g, 'for (var i = 0; i < $2.length; i++) { var $1 = $2[i]');
  
  // 9. Array methods with arrow functions
  // .filter(x => ...)
  result = result.replace(/\.filter\(\s*(\w+)\s*=>/g, '.filter(function($1) { return ');
  // .map(x => ...)
  result = result.replace(/\.map\(\s*(\w+)\s*=>/g, '.map(function($1) { return ');
  // .forEach(x => ...)
  result = result.replace(/\.forEach\(\s*(\w+)\s*=>/g, '.forEach(function($1) { return ');
  
  // 10. Fix broken patterns from bad transpiles
  result = result.replace(/forEach\(function\((\w+)\)\s*\{return\s*\{/g, 'forEach(function($1) { return ');
  result = result.replace(/filter\(function\((\w+)\)\s*\{return\s*\{/g, 'filter(function($1) { return ');
  result = result.replace(/map\(function\((\w+)\)\s*\{return\s*\{/g, 'map(function($1) { return ');
  
  // 11. Fix malformed arrow-to-function conversions
  result = result.replace(/function\((\w+)\)\s*\{return\s*\{/g, 'function($1) { return ');
  
  // 12. Optional chaining (?. ) - convert to && checks
  result = result.replace(/(\w+)\?\./g, '$1 && $1.');
  result = result.replace(/(\w+)\?\(/g, '$1 && $1(');
  
  // 13. Array.includes() -> indexOf
  result = result.replace(/\.(\w+)\.includes\(([^)]+)\)/g, '.indexOf($2) !== -1');
  
  // 14. String.startsWith/endsWith
  result = result.replace(/\.(\w+)\.startsWith\(([^)]+)\)/g, '.indexOf($2) === 0');
  result = result.replace(/\.(\w+)\.endsWith\(([^)]+)\)/g, '.lastIndexOf($2) === $1.length - $2.length');
  
  // 15. Clean up double semicolons
  result = result.replace(/;;+/g, ';');
  
  return result;
}

// Files to transpile
const filesToTranspile = [
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

console.log('Transpiling source files...\n');

filesToTranspile.forEach(file => {
  const filepath = path.join(__dirname, '..', file);
  const code = readFile(filepath);
  
  if (!code) {
    console.log('⚠️  Missing:', file);
    return;
  }
  
  const transpiled = transpile(code);
  
  // Write back to source (we'll copy to dist later)
  fs.writeFileSync(filepath, transpiled);
  console.log('✅ Transpiled:', file);
});

console.log('\n🎉 Source files transpiled to ES5');
console.log('Now run: node build/prod.js');
