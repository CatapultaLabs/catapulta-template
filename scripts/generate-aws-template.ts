import pkg from '../package.json';
import * as fs from 'node:fs';
import path from 'node:path';

function generateAwsTemplate() {
    fs.rmSync('.templates/aws', {recursive: true, force: true});
    fs.mkdirSync('.templates/aws/src/app/fonts', {recursive: true});

    [
        'src/app/fonts/GeistMonoVF.woff',
        'src/app/fonts/GeistVF.woff',
        'src/app/favicon.ico',
        'src/app/globals.css',
        'src/app/layout.tsx',
        'src/app/page.tsx',
        '.eslintrc.json',
        '.gitignore',
        'next.config.mjs',
        'postcss.config.mjs',
        'README.md',
        'tailwind.config.ts',
        'tsconfig.json'
    ].forEach(src => fs.copyFileSync(src, path.join('.templates/aws', src)));

    fs.writeFileSync(
        path.join('.templates/aws', 'package.json'),
        JSON.stringify({
            name: 'catapulta-template',
            version: pkg.version,
            private: pkg.private,
            scripts: {
                'dev': pkg.scripts.dev,
                'lint': pkg.scripts.lint,
                'start': pkg.scripts.start,
                'build': pkg.scripts.build,
            },
            dependencies: {
                'react': pkg.dependencies['react'],
                'react-dom': pkg.dependencies['react-dom'],
                'next': pkg.dependencies['next'],
            },
            devDependencies: {
                'typescript': pkg.devDependencies['typescript'],
                '@types/node': pkg.devDependencies['@types/node'],
                '@types/react': pkg.devDependencies['@types/react'],
                '@types/react-dom': pkg.devDependencies['@types/react-dom'],
                'postcss': pkg.devDependencies['postcss'],
                'tailwindcss': pkg.devDependencies['tailwindcss'],
                'eslint': pkg.devDependencies['eslint'],
                'eslint-config-next': pkg.devDependencies['eslint-config-next'],
            }
        }, null, 2),
    );
}

generateAwsTemplate();
