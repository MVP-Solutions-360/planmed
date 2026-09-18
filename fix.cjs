const fs = require('fs');
const path = require('path');

const replacements = {
    'Ã³': 'ó',
    'Ã±': 'ñ',
    'â€¢': '•',
    'vÃ¡lida': 'válida',
    'pÃ¡gina': 'página',
    'diseÃ±o': 'diseño',
    'secciÃ³n': 'sección',
    'catÃ¡logo': 'catálogo',
    'mÃ©dicos': 'médicos',
    'bÃºsqueda': 'búsqueda',
    'categorÃ­a': 'categoría',
    'CategorÃ­a': 'Categoría',
    'Â¿': '¿',
    'EstÃ¡s': 'Estás',
    'acciÃ³n': 'acción',
    'OcurriÃ³': 'Ocurrió',
    'Ãºltimas': 'últimas',
    'Ã©xito': 'éxito',
    'cirugÃ­a': 'cirugía',
    'plÃ¡stica': 'plástica',
    'mÃ¡s': 'más',
    'estǭ': 'está',
    'Diseador': 'Diseñador',
    'grǭfico': 'gráfico',
    'Medelln': 'Medellín',
    'Configuracin': 'Configuración',
    'Prximamente': 'Próximamente',
    'sesin': 'sesión',
    'iniciar sesin': 'iniciar sesión',
    'electrnico': 'electrónico',
    'Contrasea': 'Contraseña',
    'contrasea': 'contraseña',
    'vǭlida': 'válida',
    'pǭgina': 'página',
    'diseo': 'diseño',
    'Ǹxito': 'éxito',
    'artculos': 'artículos',
    'catǭlogo': 'catálogo'
};

function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (!fullPath.includes('node_modules') && !fullPath.includes('.nuxt') && !fullPath.includes('.output') && !fullPath.includes('.git')) {
                walk(fullPath);
            }
        } else {
            if (fullPath.endsWith('.vue') || fullPath.endsWith('.ts') || fullPath.endsWith('.js')) {
                let content = fs.readFileSync(fullPath, 'utf8');
                let changed = false;
                
                // Direct replacements
                for (const [bad, good] of Object.entries(replacements)) {
                    if (content.includes(bad)) {
                        content = content.split(bad).join(good);
                        changed = true;
                    }
                }
                
                // Fallback for remaining  characters in known context
                if (content.includes('')) {
                    content = content.replace(/Contrasea/g, 'Contraseña');
                    content = content.replace(/contrasea/g, 'contraseña');
                    content = content.replace(/sesin/g, 'sesión');
                    content = content.replace(/Diseador/g, 'Diseñador');
                    content = content.replace(/diseo/g, 'diseño');
                    content = content.replace(/Configuracin/g, 'Configuración');
                    content = content.replace(/Prximamente/g, 'Próximamente');
                    content = content.replace(/electrnico/g, 'electrónico');
                    content = content.replace(/Medelln/g, 'Medellín');
                    content = content.replace(/artculos/g, 'artículos');
                    content = content.replace(/Ocurri/g, 'Ocurrió');
                    content = content.replace(/accin/g, 'acción');
                    content = content.replace(/seccin/g, 'sección');
                    
                    changed = true;
                }

                if (changed) {
                    fs.writeFileSync(fullPath, content, 'utf8');
                    console.log('Fixed:', fullPath);
                }
            }
        }
    });
}
walk('.');