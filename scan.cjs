const fs = require('fs');
const path = require('path');
const validChars = new Set(['á','é','í','ó','ú','Á','É','Í','Ó','Ú','ñ','Ñ','ü','Ü','¿','¡','«','»','“','”','‘','’','—','–','°','®','©','™','\u00A0']);

function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.nuxt') && !file.includes('.output') && !file.includes('.git') && !file.includes('public')) {
                walk(file);
            }
        } else {
            if (file.endsWith('.vue') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.md')) {
                const content = fs.readFileSync(file, 'utf8');
                let badChars = new Set();
                for (let i = 0; i < content.length; i++) {
                    const code = content.charCodeAt(i);
                    if (code > 127) {
                        const char = content[i];
                        if (!validChars.has(char)) {
                            badChars.add(char);
                        }
                    }
                }
                if (badChars.size > 0) {
                    console.log(file + ': ' + Array.from(badChars).join(' '));
                }
            }
        }
    });
}
walk('.');