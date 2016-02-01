/// <reference path="../typings/tsd.d.ts"/>
import Promise = require("bluebird");
import { ICache, NullCache } from "./cache";
import { IMatcher, RegExpMatcher, MatcherPattern } from "./matcher";
import { Model } from "./model";

export class DomainConfig {
    constructor(
        public cache?: ICache,
        public routeMatcherFromString?: (route: string) => IMatcher
    ) {
        this.cache = this.cache || new NullCache();
        this.routeMatcherFromString = routeMatcherFromString || ((route: string) => { return new RegExpMatcher(route);});
    }
}

export class Domain {
    private _routes: { matcher: IMatcher, handler: (id: string) => Model<any> }[] = [];
    private _routeMatcherFromString: (route: string) => IMatcher;
    private _cache: ICache;
    get cache(): ICache {
        return this._cache;
    }
    
    constructor(config?: DomainConfig) {
        config = config || new DomainConfig();
        this._cache                  = config.cache;
        this._routeMatcherFromString = config.routeMatcherFromString;
    }
    
    locate<Data>(id: string): Model<Data> {
        for(let i = 0; i < this._routes.length; ++i) {
            var route = this._routes[i];
            if (route.matcher.match(id)) {
                return route.handler(id);
            }
        }
    }
    
    addRoute<Data>(route: MatcherPattern, handler: (id: string) => (Data|Promise<Data>)) {
        this._routes.push({
            matcher: this._normalizeRouteMatcher(route), 
            handler: (id: string): Model<Data> => {
                var model = <Model<Data>>this.cache.get(id);
                if (model) {
                    return model;
                }
                
                model = new Model<Data>(id, this, handler);
                this.cache.set(model);
                return model;
            }
        });
    }
    
    addDependentRoute<Data>(route: MatcherPattern, mapDependents: (id: string) => string[], transform: (dependentModelData: any[]) => Data): void {
        this.addRoute(route, (id) => {
            return Promise.all(
                mapDependents(id)
                .map((id) => this.locate(id))
                .map((model) => model.resolve())
            ).then(transform);
        });
    }
    
    private _normalizeRouteMatcher(route: MatcherPattern): IMatcher {
        if (typeof route === "string") {
            return this._routeMatcherFromString(route);
        } else {
            return route;
        }
    }
}