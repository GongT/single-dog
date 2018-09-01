///<reference types="node"/>
import 'source-map-support/register';

import { Filesystem } from './filesystem';
import { basename, resolve } from 'path';
import { readFileSync } from 'fs-extra';
import { gitName, gitUsername } from './gitName';
import { devPackages, prodPackages } from './constants';

declare const CONTENT_ROOT: string;
declare const TEMPLATE_ROOT: string;

const fs = new Filesystem(CONTENT_ROOT);

const myJson = {
	name   : fs.getProjectName(),
	scripts: {
		watch: 'adaptor rollup -w -c build/rollup.config.js',
		build: 'rollup -c build/rollup.config.js',
		lint : 'tslint -c build/tslint.json \'src\'',
	},
	main   : './dist/index.js',
	module : './dist/index.module.js',
};
const projectBase = basename(myJson.name);

// base config
fs.mergeIgnore('.gitignore', readTemplate('.gitignore'));
fs.overwrite('.editorconfig', readTemplate('.editorconfig'));
fs.placeFile('LICENSE', license());
fs.rmergeJson('package.json', myJson);
fs.placeFile('README.md', `# ${projectBase}`);

// yarn add
const resultPkg = JSON.parse(fs.readExists('package.json'));
const installed = [
	...Object.keys(resultPkg.dependencies || {}),
	...Object.keys(resultPkg.devDependencies || {}),
];
const prodDeps = prodPackages.filter((item) => !installed.includes(item));
const devDeps = devPackages.filter((item) => !installed.includes(item));
if (prodDeps.length) {
	fs.exec(`yarn add ` + prodDeps.join(' '));
}
if (devDeps.length) {
	fs.exec(`yarn add --dev ` + devDeps.join(' '));
}

// extra config
fs.linkFile('build/tslint.json', locateTemplate('tslint.json'));
fs.placeFile('build/rollup.config.js', readTemplate('rollup.config.js'));
fs.placeFile('build/loader.js', readTemplate('loader.js'));

// typescript
fs.mergeJson('src/tsconfig.json', {
	extends        : locateTemplate('tsconfig.json'),
	compilerOptions: {
		baseUrl: '.',
		outDir : '../dist',
	},
});
fs.placeFile('src/index.ts', `///<reference types="node"/>

console.log('hello world');
`);

// idea
fs.placeFile(`.idea/${basename(CONTENT_ROOT)}.iml`, readTemplate('idea/idea.iml'));
fs.linkFile('.idea/codeStyles', locateTemplate('idea/codeStyles'));
fs.placeFile('.idea/misc.xml', readTemplate('idea/misc.xml'));
fs.placeFile('.idea/vcs.xml', readTemplate('idea/vcs.xml'));

// create git repo
if (!fs.exists('.git')) {
	fs.exec('git init');
	fs.exec(`git remote add origin git@github.com:${gitUsername}/${projectBase}.git`);
	fs.exec('git add .');
}

function readTemplate(what: string) {
	return readFileSync(resolve(TEMPLATE_ROOT, what), 'utf8');
}

function locateTemplate(file: string) {
	return resolve(CONTENT_ROOT, 'node_modules/@gongt/single-dog/package', file);
}

function license() {
	const content = readTemplate('LICENSE');
	return content.replace('{WHO}', gitName);
}