const fs = require('fs');
const path = require('path');

function checkDir(dir) {
    let files = fs.readdirSync(dir);
    for (let f of files) {
        let fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            checkDir(fullPath);
        } else if (fullPath.endsWith('.controller.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let lines = content.split('\n');
            let controllerRole = '';
            
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('export class')) {
                    for(let j=Math.max(0, i-10); j<i; j++) {
                        if (lines[j].includes('@Roles(')) controllerRole = lines[j].trim();
                        if (lines[j].includes('@Public()')) controllerRole = 'Public';
                    }
                }
                
                let methodMatch = lines[i].match(/@(Get|Post|Patch|Put|Delete)\((.*?)\)/);
                if (methodMatch) {
                    let hasRole = false;
                    let hasPublic = false;
                    for (let j = Math.max(0, i - 10); j < i; j++) {
                        if (lines[j].includes('@Roles(')) hasRole = true;
                        if (lines[j].includes('@Public()')) hasPublic = true;
                    }
                    if (!hasRole && !controllerRole && !hasPublic) {
                        console.log(`Missing Role/Public in ${f}: ${lines[i].trim()}`);
                    }
                }
            }
        }
    }
}
checkDir('backend/src');
console.log('Done checking endpoints.');
