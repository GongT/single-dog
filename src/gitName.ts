import { execSync, ExecSyncOptionsWithStringEncoding } from 'child_process';

declare const CONTENT_ROOT: string;

const opt: ExecSyncOptionsWithStringEncoding = {
	encoding: 'utf8',
	cwd     : CONTENT_ROOT,
};
export const gitUsername = execSync('git config user.name', opt).trim();
const email = execSync('git config user.email', opt).trim();

export const gitName = `${gitUsername}<${email}>`;