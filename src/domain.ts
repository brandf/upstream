/// <reference path="../typings/main.d.ts"/>
import Promise = require("bluebird");
import { ICache, NullCache } from "./cache";
import { IMatcher, RegExpMatcher, MatcherPattern } from "./matcher";
import { Model } from "./model";

type MaybePromise<Data>  = Data | Promise<Data>;
type DependencyMap       = {[name: string]: string};
type DependencyData      = {[name: string]: any};
type MatchResult         = {};

function mapProps(obj: {[index:string]: any}, transform: (value: any) => any): {[index:string]: any} {
    var result: {[index:string]: any} = {};
    for (var prop in  obj) {
        result[prop] = transform(obj[prop]);
    }
    return result;
}

export class DomainConfig {
    constructor(
        public cache?: ICache,
        public matcherFromString?: (pattern: string) => IMatcher
    ) {
        this.cache = this.cache || 
            new NullCache();
        this.matcherFromString = matcherFromString || 
            ((pattern: string) => { return new RegExpMatcher(pattern);});
    }
}

export class Domain {
    private _routes: { 
        matcher: IMatcher, 
        handler: (matchResult: MatchResult, id: string) => Model<any> 
    }[] = [];
    private _matcherFromString: (pattern: string) => IMatcher;
    private _cache: ICache;
    get cache(): ICache {
        return this._cache;
    }
    
    constructor(config?: DomainConfig) {
        config = config || new DomainConfig();
        this._cache             = config.cache;
        this._matcherFromString = config.matcherFromString;
    }
    
    locate<Data>(id: string): Model<Data> {
        for(let i = 0; i < this._routes.length; ++i) {
            var route = this._routes[i];
            var matchResult = route.matcher.match(id);
            if (matchResult) {
                return route.handler(matchResult, id);
            }
        }
    }
    
    addRoute<Data>(
        pattern: MatcherPattern, 
        handler: (matchResult?: MatchResult, id?: string) => MaybePromise<Data>
    ) {
        this._routes.push({
            matcher: this._normalizeMatcher(pattern), 
            handler: (matchResult, id) => {
                var model = <Model<Data>>this.cache.get(id);
                if (model) {
                    return model;
                }
                
                model = new Model<Data>(id, this, () => {
                    return Promise.attempt<Data>(() => {
                        return <Data>handler(matchResult, id);
                    }); 
                });
                
                this.cache.set(model);
                return model;
            }
        });
    }
    
    addDependentRoute<Data>(
        pattern: MatcherPattern, 
        mapDependents: (matchResult?: MatchResult, id?: string) => MaybePromise<DependencyMap>, 
        transform: (dependencyData: DependencyData, matchResult?: MatchResult, id?: string) => MaybePromise<Data>
    ): void {
        this.addRoute(pattern, (matchResult, id) => {
            return Promise.attempt<DependencyMap>(() => {
                return <DependencyMap>mapDependents(matchResult, id);
            }).then((dependencyMap) => {
                return Promise.props(
                    mapProps(
                        mapProps(dependencyMap, (id) => this.locate(id)),
                        (model) => model.resolve()
                    )
                );
            }).then((dependencyData) => {
                return transform(dependencyData, matchResult, id);
            });
        });
    }
    
    private _normalizeMatcher(pattern: MatcherPattern): IMatcher {
        if (typeof pattern === "string") {
            return this._matcherFromString(pattern);
        } else {
            return pattern;
        }
    }
}