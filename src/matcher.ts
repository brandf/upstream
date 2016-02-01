export type MatcherPattern = string | IMatcher;

export interface IMatcher {
    match(pattern: string) : boolean;
}

export class RegExpMatcher implements IMatcher {
    private _regex: RegExp;
    constructor(pattern: string|RegExp) {
        if (typeof pattern === "string") {
            this._regex = new RegExp(pattern);
        } else {
            this._regex = pattern;
        }
    }
    
    match(pattern: string) : boolean {
        return this._regex.test(pattern);
    }
}