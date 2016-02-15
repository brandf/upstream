/// <reference path="../typings/main.d.ts"/>
import pathToRegexp = require("path-to-regexp");

export type MatchParams = {[key: string]: string};

export interface IMatcher {
    match(id: string): MatchParams;
}
export class PathMatcher implements IMatcher {
    private _regex: RegExp;
    private _keys: any[];
    constructor(pattern: string) {
        this._keys = [];
        this._regex = pathToRegexp(pattern, this._keys);
    }
    match(id: string): MatchParams {
        var result = this._regex.exec(id);
	    if (result) {
            var params: MatchParams = {};
            for (var i = 0; i < this._keys.length; i++) {
                params[this._keys[i].name] = result[i+1];
            }
            return params;
        }
    }
}
export class MatchResult<Owner> {
    constructor(public owner: Owner, public id: string, public params: MatchParams) {}
}
export class DomainMatcher implements IMatcher {
    constructor(public prefix: string) {}
    match(id: string): MatchParams {
        if (id.indexOf(this.prefix) === 0) {
            return {
                path: id.slice(this.prefix.length)
            };
        }
    }
}