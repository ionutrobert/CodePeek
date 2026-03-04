#!/usr/bin/env node
/**
 * Fix malformed JavaScript in source files
 */

const fs = require('fs');
const path = require('path');

const files = [
  'src/sidepanel/components/tab-overview.js',
  'src/sidepanel/components/tab-colors.js',
  'src/sidepanel/components/tab-typography.js',
  'src/sidepanel/components/tab-assets.js',
  'src/sidepanel/utils/formatters.js',
  'src/sidepanel/utils/messaging.js',
  'src/content/bundle.es5.js',
  'src/sidepanel/components/tab-overview.es5.js',
  'src/sidepanel/components/tab-colors.es5.js',
  'src/sidepanel/components/tab-typography.es5.js',
  'src/sidepanel/components/tab-assets.es5.js',
  'src/sidepanel/utils/formatters.es5.js',
  'src/sidepanel/utils/messaging.es5.js'
];

function fixMalformedJS(code) {
  let result = code;
  
  // Fix: .filter(sheet  { return {  →  .filter(function(sheet) { return {
  result = result.replace(/\.filter\(\s*(\w+)\s+\{\s*return\s*\{/g, '.filter(function($1) { return ');
  
  // Fix: .forEach(sheet  { return {  →  .forEach(function(sheet) { return {
  result = result.replace(/\.forEach\(\s*(\w+)\s+\{\s*return\s*\{/g, '.forEach(function($1) { return ');
  
  // Fix: .map(c  { return {  →  .map(function(c) { return {
  result = result.replace(/\.map\(\s*(\w+)\s+\{\s*return\s*\{/g, '.map(function($1) { return ');
  
  // Fix: .forEachfunction(  →  .forEach(function(
  result = result.replace(/\.forEachfunction\(/g, '.forEach(function(');
  
  // Fix: .mapfunction(  →  .map(function(
  result = result.replace(/\.mapfunction\(/g, '.map(function(');
  
  // Fix: .sortfunction(  →  .sort(function(
  result = result.replace(/\.sortfunction\(/g, '.sort(function(');
  
  // Fix arrow functions that weren't converted: param  { return { → function(param) { return {
  result = result.replace(/(\w+)\s+\{\s*return\s*\{/g, 'function($1) { return ');
  
  // Fix template literals that weren't converted: ${var} → ' + var + '
  // This is complex, so we'll be careful
  
  return result;
}

let fixedCount = 0;
files.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (!fs.existsSync(fullPath)) {
    console.log('⚠️  Missing:', file);
    return;
  }
  
  let code = fs.readFileSync(fullPath, 'utf8');
  const original = code;
  
  code = fixMalformedJS(code);
  
  if (code !== original) {
    fs.writeFileSync(fullPath, code);
    console.log('✅ Fixed:', file);
    fixedCount++;
  }
});

console.log('\n🎉 Fixed', fixedCount, 'files');
