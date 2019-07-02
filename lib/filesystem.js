"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const deepmerge = require("deepmerge");
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const gitName_1 = require("./gitName");
function uniqueArray(target, source) {
    return target.concat(source).filter((value, index, self) => {
        return self.indexOf(value) === index;
    });
}
exports.uniqueArray = uniqueArray;
class Filesystem {
    constructor(targetBase) {
        this.targetBase = targetBase;
    }
    overwrite(file, content) {
        const abs = path_1.resolve(this.targetBase, file);
        fs_extra_1.ensureDirSync(path_1.resolve(abs, '..'));
        console.log('writeFile(%s, FileContent<%s>)', abs, content.length);
        fs_extra_1.writeFileSync(abs, content, 'utf8');
    }
    writeJson(file, value) {
        this.overwrite(file, this.stringifyJSON(value));
    }
    mergeJson(file, value) {
        const original = JSON.parse(this.readExists(file) || '{}');
        const result = deepmerge(original, value, { arrayMerge: uniqueArray });
        this.overwrite(file, this.stringifyJSON(result));
    }
    rmergeJson(file, value) {
        const original = JSON.parse(this.readExists(file) || '{}');
        const result = deepmerge(value, original, { arrayMerge: uniqueArray });
        this.overwrite(file, this.stringifyJSON(result));
    }
    stringifyJSON(data) {
        return JSON.stringify(data, null, 8).replace(/^\s+/gm, (m0) => {
            return new Array(Math.floor(m0.length / 8)).fill('\t').join('');
        });
    }
    mergeIgnore(file, content) {
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
    linkFile(file, target) {
        const abs = path_1.resolve(this.targetBase, file);
        fs_extra_1.ensureDirSync(path_1.resolve(abs, '..'));
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
        const t = partsTarget.join('/');
        if (fs_extra_1.existsSync(abs)) {
            if (fs_1.lstatSync(abs).isSymbolicLink() && fs_1.readlinkSync(abs) === t) {
                return;
            }
        }
        fs_extra_1.removeSync(abs);
        fs_1.symlinkSync(t, abs);
    }
    placeFile(file, content) {
        if (!this.exists(file)) {
            this.overwrite(file, content);
        }
    }
    getProjectName() {
        const pkg = this.readExists('package.json');
        if (pkg) {
            return JSON.parse(pkg).name;
        }
        else {
            return '@' + gitName_1.gitUsername + '/' + path_1.basename(this.targetBase);
        }
    }
    readExists(file) {
        const abs = path_1.resolve(this.targetBase, file);
        if (fs_extra_1.existsSync(abs)) {
            return fs_extra_1.readFileSync(abs, 'utf8');
        }
        else {
            return '';
        }
    }
    resolve(file) {
        return path_1.resolve(this.targetBase, file);
    }
    exists(file) {
        const abs = path_1.resolve(this.targetBase, file);
        return fs_extra_1.existsSync(abs);
    }
    exec(command) {
        console.error(command);
        const opt = {
            encoding: 'utf8',
            cwd: CONTENT_ROOT,
            windowsHide: true,
        };
        return child_process_1.execSync(command, opt).trim();
    }
}
exports.Filesystem = Filesystem;
//# sourceMappingURL=filesystem.js.map