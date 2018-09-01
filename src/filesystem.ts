import { basename, resolve } from 'path';
import { ensureDirSync, ensureSymlinkSync, existsSync, readFileSync, writeFileSync } from 'fs-extra';
import * as deepmerge from 'deepmerge';
import { execSync, ExecSyncOptionsWithStringEncoding } from 'child_process';
import { gitUsername } from './gitName';

declare const CONTENT_ROOT: string;

function uniqueArray(target: any[], source: any[]) {
	return target.concat(source).filter((value, index, self) => {
		return self.indexOf(value) === index;
	});
}

export class Filesystem {
	constructor(private readonly targetBase: string) {}

	overwrite(file: string, content: string) {
		const abs = resolve(this.targetBase, file);
		ensureDirSync(resolve(abs, '..'));
		console.log('writeFile(%s, FileContent<%s>)', abs, content.length);
		writeFileSync(abs, content, 'utf8');
	}

	mergeJson(file: string, value: any) {
		const original = JSON.parse(this.readExists(file) || '{}');
		const result = deepmerge(original, value, { arrayMerge: uniqueArray });
		this.overwrite(file, this.stringifyJSON(result));
	}

	rmergeJson(file: string, value: any) {
		const original = JSON.parse(this.readExists(file) || '{}');
		const result = deepmerge(value, original, { arrayMerge: uniqueArray });
		this.overwrite(file, this.stringifyJSON(result));
	}

	private stringifyJSON(data: any) {
		return JSON.stringify(data, null, 8).replace(/^\s+/gm, (m0) => {
			return new Array(Math.floor(m0.length / 8)).fill('\t').join('');
		});
	}

	mergeIgnore(file: string, content: string) {
		let original = this.readExists(file).trimRight() + '\n';
		const exists = original.split(/\n/).map(e => e.trim()).filter(e => !!e);
		const lines = content.split(/\n/).map(e => e.trim()).filter(e => !!e);

		for (const line of lines) {
			if (exists.includes(line)) {
				continue;
			}

			original += `${line}\n`;
		}

		this.overwrite(file, content);
	}

	linkFile(file: string, target: string) {
		const abs = resolve(this.targetBase, file);
		ensureDirSync(resolve(abs, '..'));

		const partsTarget = target.split(/[\/\\]/g);
		const partsFile = abs.split(/[\/\\]/g);
		while (partsTarget[0] === partsFile[0]) {
			partsTarget.shift();
			partsFile.shift();
			if (partsTarget.length === 0 || partsFile.length === 0) {
				throw new Error(`cannot resolve relative path of ${file} and ${target}`);
			}
		}
		const upFolders = partsFile.length - 1;
		partsTarget.unshift(...new Array(upFolders).fill('..'));

		console.log('linkFile(%s, %s)', abs, partsTarget.join('/'));
		ensureSymlinkSync(partsTarget.join('/'), abs);
	}

	placeFile(file: string, content: string) {
		if (!this.exists(file)) {
			this.overwrite(file, content);
		}
	}

	getProjectName() {
		const pkg = this.readExists('package.json');
		if (pkg) {
			return JSON.parse(pkg).name;
		} else {
			return '@' + gitUsername + '/' + basename(this.targetBase);
		}
	}

	readExists(file: string): string {
		const abs = resolve(this.targetBase, file);
		if (existsSync(abs)) {
			return readFileSync(abs, 'utf8');
		} else {
			return '';
		}
	}

	resolve(file: string) {
		return resolve(this.targetBase, file);
	}

	exists(file: string) {
		const abs = resolve(this.targetBase, file);
		return existsSync(abs);
	}

	exec(command: string) {
		console.error(command);
		const opt: ExecSyncOptionsWithStringEncoding = {
			encoding   : 'utf8',
			cwd        : CONTENT_ROOT,
			windowsHide: true,
		};
		return execSync(command, opt).trim();
	}
}