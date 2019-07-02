"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const opt = {
    encoding: 'utf8',
    cwd: CONTENT_ROOT,
};
exports.gitUsername = child_process_1.execSync('git config user.name', opt).trim();
const email = child_process_1.execSync('git config user.email', opt).trim();
exports.gitName = `${exports.gitUsername}<${email}>`;
//# sourceMappingURL=gitName.js.map