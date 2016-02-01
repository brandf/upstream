module Matcher {
    export type Matcher = string | IMatcher;
    export interface IMatcher {
        match(id: string) : boolean;
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
        
        match(id: string) : boolean {
            return this._regex.test(id);
        }
    }
}