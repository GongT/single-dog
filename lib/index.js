"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
///<reference types="node"/>
const deepmerge = require("deepmerge");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
require("source-map-support/register");
const constants_1 = require("./constants");
const filesystem_1 = require("./filesystem");
const gitName_1 = require("./gitName");
const { manifest } = require('pacote');
const fs = new filesystem_1.Filesystem(CONTENT_ROOT);
const myJson = {
    name: fs.getProjectName(),
    scripts: {
        watch: 'tsc -w -p src',
        build: 'tsc -p src',
        upgrade: 'ncu --upgrade --packageFile ./package.json',
    },
    main: './lib/index.js',
    module: './lib/index.module.js',
    dependencies: {},
    devDependencies: {},
};
if (!myJson.name) {
    console.error('please add name to your package.json');
    process.exit(1);
}
const projectBase = path_1.basename(myJson.name);
(async () => {
    // base config
    fs.mergeIgnore('.gitignore', readTemplate('.gitignore'));
    fs.overwrite('.editorconfig', readTemplate('.editorconfig'));
    fs.placeFile('LICENSE', license());
    fs.placeFile('README.md', `# ${projectBase}`);
    async function resolveVersion(packageName) {
        console.log('Resolving package: %s', packageName);
        return '^' + (await manifest(packageName + '@latest')).version;
    }
    // package
    const packageJson = await deepmerge(myJson, JSON.parse(fs.readExists('package.json') || '{}'), { arrayMerge: filesystem_1.uniqueArray });
    for (const item of constants_1.prodPackages) {
        if (!packageJson.dependencies[item]) {
            packageJson.dependencies[item] = await resolveVersion(item);
        }
    }
    for (const item of constants_1.devPackages) {
        if (!packageJson.devDependencies[item]) {
            packageJson.devDependencies[item] = await resolveVersion(item);
        }
    }
    fs.writeJson('package.json', packageJson);
    // typescript
    fs.mergeJson('src/tsconfig.json', {
        extends: locateTemplateRelativeTo('tsconfig.json', path_1.resolve(CONTENT_ROOT, 'src')),
        compilerOptions: {
            baseUrl: '.',
            outDir: '../lib',
        },
    });
    // idea
    fs.placeFile(`.idea/${path_1.basename(CONTENT_ROOT)}.iml`, readTemplate('idea/idea.iml'));
    fs.linkFile('.idea/codeStyles', locateTemplate('idea/codeStyles'));
    fs.placeFile('.idea/misc.xml', readTemplate('idea/misc.xml'));
    fs.placeFile('.idea/vcs.xml', readTemplate('idea/vcs.xml'));
    fs.placeFile('.idea/modules.xml', readTemplate('idea/modules.xml').replace(/{NAME}/g, path_1.basename(CONTENT_ROOT)));
    // create git repo
    if (!fs.exists('.git')) {
        fs.exec('git init');
        fs.exec(`git remote add origin git@github.com:${gitName_1.gitUsername}/${projectBase}.git`);
        fs.exec('git add .');
    }
})().catch((e) => {
    setImmediate(() => {
        throw e;
    });
});
function readTemplate(what) {
    return fs_extra_1.readFileSync(path_1.resolve(TEMPLATE_ROOT, what), 'utf8');
}
function locateTemplate(file) {
    return path_1.resolve(CONTENT_ROOT, 'node_modules/@gongt/single-dog/package', file);
}
function locateTemplateRelativeTo(file, folder) {
    return path_1.posix.relative(path_1.posix.normalize(folder), locateTemplate(file));
}
function license() {
    const content = readTemplate('LICENSE');
    return content.replace('{WHO}', gitName_1.gitName);
}
//# sourceMappingURL=index.js.map