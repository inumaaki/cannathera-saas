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
            let controllerGuards = '';
            
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('export class')) {
                    for(let j=Math.max(0, i-10); j<i; j++) {
                        if (lines[j].includes('@Roles(')) controllerGuards += 'Roles ';
                        if (lines[j].includes('@UseGuards(')) controllerGuards += 'UseGuards ';
                        if (lines[j].includes('@Public()')) controllerGuards += 'Public ';
                    }
                }
                
                let methodMatch = lines[i].match(/@(Get|Post|Patch|Put|Delete)\((.*?)\)/);
                if (methodMatch) {
                    let hasGuard = false;
                    for (let j = Math.max(0, i - 5); j <= Math.min(lines.length-1, i + 5); j++) {
                        if (lines[j].includes('@Roles(')) hasGuard = true;
                        if (lines[j].includes('@Public()')) hasGuard = true;
                        if (lines[j].includes('@UseGuards(')) hasGuard = true;
                        if (lines[j].includes('@Perms(')) hasGuard = true;
                    }
                    if (!hasGuard && !controllerGuards) {
                        console.log(`[Unprotected] ${f}: ${lines[i].trim()}`);
                    }
                }
            }
        }
    }
}
checkDir('backend/src');
console.log('Done.');
