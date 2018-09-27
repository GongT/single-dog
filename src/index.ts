///<reference types="node"/>
import 'source-map-support/register';

import { Filesystem } from './filesystem';
import { basename, posix, resolve } from 'path';
import { readFileSync } from 'fs-extra';
import { gitName, gitUsername } from './gitName';
import { devPackages, prodPackages } from './constants';

declare const CONTENT_ROOT: string;
declare const TEMPLATE_ROOT: string;

const fs = new Filesystem(CONTENT_ROOT);

const myJson = {
	name           : fs.getProjectName(),
	scripts        : {
		watch: 'adaptor rollup -w -c build/rollup.config.js',
		build: 'rollup -c build/rollup.config.js',
		lint : 'tslint -c build/tslint.json \'src/**/*.ts\'',
	},
	main           : './dist/index.js',
	module         : './dist/index.module.js',
	dependencies   : {
		'source-map-support': '*',
	} as any,
	devDependencies: {} as any,
};

if (!myJson.name) {
	console.error('please add name to your package.json');
	process.exit(1);
}
const projectBase = basename(myJson.name);

// base config
fs.mergeIgnore('.gitignore', readTemplate('.gitignore'));
fs.overwrite('.editorconfig', readTemplate('.editorconfig'));
fs.placeFile('LICENSE', license());
fs.placeFile('README.md', `# ${projectBase}`);

// package
prodPackages.forEach((item) => {
	myJson.dependencies[item] = 'latest';
});
devPackages.forEach((item) => {
	myJson.devDependencies[item] = 'latest';
});
fs.rmergeJson('package.json', myJson);

// extra config
fs.linkFile('build/tslint.json', locateTemplate('tslint.json'));
fs.placeFile('build/rollup.config.js', readTemplate('rollup.config.js'));
fs.placeFile('build/loader.js', readTemplate('loader.js'));

// typescript
fs.mergeJson('src/tsconfig.json', {
	extends        : locateTemplateRelativeTo('tsconfig.json', resolve(CONTENT_ROOT, 'src')),
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
fs.placeFile('.idea/modules.xml', readTemplate('idea/modules.xml').replace(/{NAME}/g, basename(CONTENT_ROOT)));

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

function locateTemplateRelativeTo(file: string, folder: string) {
	return posix.relative(folder, locateTemplate(file));
}

function license() {
	const content = readTemplate('LICENSE');
	return content.replace('{WHO}', gitName);
}