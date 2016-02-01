/// <reference path="cache.ts" />
/// <reference path="matcher.ts" />
/// <reference path="../typings/tsd.d.ts"/>
import Promise = require("bluebird");

module Upstream {
    
    
    export class DomainConfig {
        constructor(
            public cache?: Cache.ICache,
            public routeMatcherFromString?: (route: string) => Matcher.IMatcher
        ) {
            this.cache = this.cache || new Cache.NullCache();
            this.routeMatcherFromString = routeMatcherFromString || ((route: string) => { return new Matcher.RegExpMatcher(route);});
        }
    }
    
    
    export class Domain {
        private _routes: { matcher: Matcher.IMatcher, handler: (id: string) => Model<any> }[] = [];
        private _routeMatcherFromString: (route: string) => Matcher.IMatcher;
        private _cache: Cache.ICache;
        get cache(): Cache.ICache {
            return this._cache;
        }
        
        constructor(config?: DomainConfig) {
            config = config || new DomainConfig();
            this._cache                  = config.cache;
            this._routeMatcherFromString = config.routeMatcherFromString;
        }
        
        resolveModel<Data>(id: string): Model<Data> {
            for(let i = 0; i < this._routes.length; ++i) {
                var route = this._routes[i];
                if (route.matcher.match(id)) {
                    return route.handler(id);
                }
            }
        }
        
        addRoute<Data>(route: Matcher.Matcher, handler: (id: string) => Promise<Data>) {
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
        
        addDependentRoute<Data>(route: Matcher.Matcher, mapDependents: (id: string) => string[], transform: (dependentModelData: any[]) => Data): void {
            this.addRoute(route, (id) => {
                return Promise.all(mapDependents(id).map((id) => this.resolveModel(id)).map((model) => model.resolve)).then(transform);
            });
        }
        
        private _normalizeRouteMatcher(route: Matcher.Matcher): Matcher.IMatcher {
            if (typeof route === "string") {
                return this._routeMatcherFromString(route);
            } else {
                return route;
            }
        }
    }

    
    
    export class Model<Data> implements Cache.ICachable {
        domain: Domain;
        id: string;
        expiration: number;
        
        private _dataFetcher: (id: string) => Promise<Data>;
        private _fetchedDataPromise: Promise<Data>;
        
        constructor(id: string, domain: Domain, dataFetcher: (id: string) => Promise<Data>) {
            this.id = id;
            this.domain = domain;
            this.expiration = 0;
            this._dataFetcher = dataFetcher;
            this._fetchedDataPromise = undefined;
        }
        
        resolve(): Promise<Data> {
            this.domain.cache.set(this);
            if (this._fetchedDataPromise === undefined) {
                this._fetchedDataPromise = Promise.attempt<Data>(() => { return this._dataFetcher(this.id) });
            }
            return this._fetchedDataPromise;
        }
    }
}
