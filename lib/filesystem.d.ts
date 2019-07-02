export declare function uniqueArray(target: any[], source: any[]): any[];
export declare class Filesystem {
    private readonly targetBase;
    constructor(targetBase: string);
    overwrite(file: string, content: string): void;
    writeJson(file: string, value: any): void;
    mergeJson(file: string, value: any): void;
    rmergeJson(file: string, value: any): void;
    private stringifyJSON;
    mergeIgnore(file: string, content: string): void;
    linkFile(file: string, target: string): void;
    placeFile(file: string, content: string): void;
    getProjectName(): any;
    readExists(file: string): string;
    resolve(file: string): string;
    exists(file: string): boolean;
    exec(command: string): string;
}
//# sourceMappingURL=filesystem.d.ts.map