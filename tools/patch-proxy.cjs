const fs = require('fs');
const path = require('path');

const pluginDir = path.join(__dirname, '../scripts/plugins');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(pluginDir);
let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if it imports Kernel
    if (content.includes('import { Kernel }')) {
        // Remove the import
        content = content.replace(/import\s+\{\s*Kernel\s*\}\s+from\s+['"].*?Kernel\.js['"];?\s*/g, '');

        // Determine context accessor based on file type
        const isCommand = file.includes('Command.js') || file.includes('bootloader.js');
        const ctxStr = isCommand ? 'this.context' : 'this._context';

        // Replace Kernel usage
        content = content.replace(/Kernel\.world/g, `${ctxStr}.world`);
        content = content.replace(/Kernel\.system/g, `${ctxStr}.system`);
        content = content.replace(/Kernel\.get\(/g, `${ctxStr}.getService(`);

        fs.writeFileSync(file, content, 'utf8');
        console.log(`Patched ${file}`);
        changedCount++;
    }
});

console.log(`Patched ${changedCount} files.`);
