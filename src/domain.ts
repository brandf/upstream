/// <reference path="../typings/main.d.ts"/>
import Promise = require("bluebird");
import { ICache, NullCache } from "./cache";
import { IMatcher, RegExpMatcher, MatcherPattern } from "./matcher";
import { Model } from "./model";

type MaybePromise<Data>  = Data | Promise<Data>;
type DependencyMap       = {[name: string]: string};
type DependencyData      = {[name: string]: any};

function mapProps(obj: {[index:string]: any}, transform: (value: any) => any): {[index:string]: any} {
    var result: {[index:string]: any} = {};
    for (var prop in  obj) {
        result[prop] = transform(obj[prop]);
    }
    return result;
}

export class DomainConfig {
    constructor(
        public cache?: ICache
    ) {
        this.cache = this.cache || new NullCache();
    }
}

export class Route {
    constructor(public domain: Domain, public matcher: IMatcher) {}
    
    getHandler: (matchResult: MatchResult) => Model<any>
    get<Data>(handler: (matchResult?: MatchResult) => MaybePromise<Data>): Route {
        this.getHandler = (matchResult) => {
            let id = matchResult.id;
            let model = <Model<Data>>this.domain.cache.get(id);
            if (model) {
                return model;
            }
            
            model = new Model<Data>(id, this.domain, () => {
                return Promise.attempt<Data>(() => {
                    return <Data>handler(matchResult);
                }); 
            });
            
            this.domain.cache.set(model);
            return model;
        }
        return this;
    }
    
    getDependent<Data>(
        mapDependents: (matchResult?: MatchResult) => MaybePromise<DependencyMap>, 
        transform: (dependencyData: DependencyData, matchResult?: MatchResult) => MaybePromise<Data>
    ): Route {
        return this.get((matchResult) => {
            return Promise.attempt<DependencyMap>(() => {
                return <DependencyMap>mapDependents(matchResult);
            }).then((dependencyMap) => {
                return Promise.props(
                    mapProps(
                        mapProps(dependencyMap, (id) => this.domain.get(id)),
                        (model) => model.resolve()
                    )
                );
            }).then((dependencyData) => {
                return transform(dependencyData, matchResult);
            });
        });
    }
}

export class MatchResult {
    constructor(public route: Route, public id: string, public matchInfo: {}) {};
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