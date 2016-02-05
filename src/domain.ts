/// <reference path="../typings/main.d.ts"/>
import Promise = require("bluebird");
import { ICache, NullCache } from "./cache";
import { IMatcher, RegExpMatcher, MatcherPattern } from "./matcher";
import { Model } from "./model";
import { Route, MatchResult } from "./route";

export class DomainConfig {
    constructor(
        public cache?: ICache
    ) {
        this.cache = this.cache || new NullCache();
    }
}

export class Domain {
    private _routes: Route[] = [];
    private _cache: ICache;
    get cache(): ICache {
        return this._cache;
    }
    
    constructor(config?: DomainConfig) {
        config = config || new DomainConfig();
        this._cache             = config.cache;
    }
    
    get<Data>(id: string): Model<Data> {
        var matchResult = this.matchRoute(id);
        if (matchResult && matchResult.route.getHandler) {
            return matchResult.route.getHandler(matchResult);
        }
    }
    
    matchRoute(id: string): MatchResult {
        for(let i = 0; i < this._routes.length; ++i) {
            var route = this._routes[i];
            var matchInfo = route.matcher.match(id);
            if (matchInfo) {
                return new MatchResult(route, id, matchInfo);
            }
        }
    }
    
    addRoute(pattern: MatcherPattern) {
        var route = new Route(this, this._normalizeMatcher(pattern));
        this._routes.push(route);
        return route;
    }
    
    private _normalizeMatcher(pattern: MatcherPattern): IMatcher {
        if (typeof pattern === "string" || pattern instanceof RegExp) {
            return new RegExpMatcher(pattern);
        } else {
            return <IMatcher>pattern;
        }
    }
}