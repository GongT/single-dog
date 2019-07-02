///<reference types="node"/>
import * as deepmerge from 'deepmerge';
import { readFileSync } from 'fs-extra';
import { basename, posix, resolve } from 'path';
import 'source-map-support/register';
import { devPackages, prodPackages } from './constants';
import { Filesystem, uniqueArray } from './filesystem';
import { gitName, gitUsername } from './gitName';

const { manifest } = require('pacote');

declare const CONTENT_ROOT: string;
declare const TEMPLATE_ROOT: string;

const fs = new Filesystem(CONTENT_ROOT);

const myJson = {
	name: fs.getProjectName(),
	scripts: {
		watch: 'tsc -w -p src',
		build: 'tsc -p src',
		upgrade: 'ncu --upgrade --packageFile ./package.json',
	},
	main: './lib/index.js',
	module: './lib/index.module.js',
	dependencies: {} as any,
	devDependencies: {} as any,
};

if (!myJson.name) {
	console.error('please add name to your package.json');
	process.exit(1);
}
const projectBase = basename(myJson.name);

(async () => {
	// base config
	fs.mergeIgnore('.gitignore', readTemplate('.gitignore'));
	fs.overwrite('.editorconfig', readTemplate('.editorconfig'));
	fs.placeFile('LICENSE', license());
	fs.placeFile('README.md', `# ${projectBase}`);

	async function resolveVersion(packageName: string) {
		console.log('Resolving package: %s', packageName);
		return '^' + (await manifest(packageName + '@latest')).version;
	}

	// package
	const packageJson = await deepmerge(
		myJson,
		JSON.parse(fs.readExists('package.json') || '{}'),
		{ arrayMerge: uniqueArray },
	);
	for (const item of prodPackages) {
		if (!packageJson.dependencies[item]) {
			packageJson.dependencies[item] = await resolveVersion(item);
		}
	}
	for (const item of devPackages) {
		if (!packageJson.devDependencies[item]) {
			packageJson.devDependencies[item] = await resolveVersion(item);
		}
	}
	fs.writeJson('package.json', packageJson);

	// typescript
	fs.mergeJson('src/tsconfig.json', {
		extends: locateTemplateRelativeTo('tsconfig.json', resolve(CONTENT_ROOT, 'src')),
		compilerOptions: {
			baseUrl: '.',
			outDir: '../lib',
		},
	});

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
})().catch((e) => {
	setImmediate(() => {
		throw e;
	});
});

function readTemplate(what: string) {
	return readFileSync(resolve(TEMPLATE_ROOT, what), 'utf8');
}

function locateTemplate(file: string) {
	return resolve(CONTENT_ROOT, 'node_modules/@gongt/single-dog/package', file);
}

function locateTemplateRelativeTo(file: string, folder: string) {
	return posix.relative(posix.normalize(folder), locateTemplate(file));
}

function license() {
	const content = readTemplate('LICENSE');
	return content.replace('{WHO}', gitName);
}
