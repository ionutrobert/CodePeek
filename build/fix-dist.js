#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Comprehensive JavaScript Fix...');

// Fix all malformed patterns in dist
function fixDistFiles(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    
    if (fs.statSync(fullPath).isDirectory()) {
      fixDistFiles(fullPath);
      return;
    }
    
    if (!file.endsWith('.js')) return;
    
    let code = fs.readFileSync(fullPath, 'utf8');
    let original = code;
    
    // Fix .filter(function(x) { ... })
    code = code.replace(/\.filter\(\s*(\w+)\s+\{\s*return\s*\{/g, '.filter(function($1) { return ');
    
    // Fix .forEach(function(x) { ... })
    code = code.replace(/\.forEach\(\s*(\w+)\s+\{\s*return\s*\{/g, '.forEach(function($1) { return ');
    
    // Fix .map(function(x) { ... })
    code = code.replace(/\.map\(\s*(\w+)\s+\{\s*return\s*\{/g, '.map(function($1) { return ');
    
    // Fix forEachfunction -> forEach function
    code = code.replace(/\.forEachfunction\(/g, '.forEach(function(');
    code = code.replace(/\.mapfunction\(/g, '.map(function(');
    code = code.replace(/\.sortfunction\(/g, '.sort(function(');
    
    // Fix arrow functions that weren't converted: param => { ... }
    // But avoid breaking valid syntax
    
    // Fix: return functionName(param) { return { 
    code = code.replace(/return\s+(\w+)\((\w+)\)\s*\{\s*return\s*\{/g, 'return $1($2) { return ');
    
    // Fix: return if (...) 
    code = code.replace(/return\s+if\s*\(/g, 'if (');
    
    // Fix template literals: ${var} -> var (basic)
    // This is complex - we'll do a simpler approach
    
    if (code !== original) {
      fs.writeFileSync(fullPath, code);
      console.log('✅ Fixed:', fullPath);
    }
  });
}

// Apply to dist folder
if (fs.existsSync('dist')) {
  fixDistFiles('dist');
}

console.log('\n🎉 Done fixing dist folder');
