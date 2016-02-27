/// <reference path="../typings/main.d.ts"/>
import Promise = require("bluebird");
import { ICache } from "./cache";
import { PathMatcher, MatchResult, IMatcher } from "./matcher";
import { Model } from "./model";
import { Route } from "./route";
import { Dispatcher } from "./dispatcher";

export class Domain {
    private _routes: Route[] = [];
    constructor(public dispatcher: Dispatcher, public matcher: IMatcher, public defaultCache: ICache) {}
    get<Data>(id: string): Model<Data> {
        let matchResult = this.matchRoute(id);
        if (matchResult) {
            if (matchResult.owner.getHandler) {
                return matchResult.owner.getHandler(matchResult);
            } else {
                throw Error("Route matched, but no get handler found for: " + id);
            }
        } else {
            throw Error("Domain matched, but no route matched for: " + id);
        }
    }
    matchRoute(id: string): MatchResult<Route> {
        for (const route of this._routes) {
            let matchParams = route.matcher.match(id);
            if (matchParams) {
                return new MatchResult(route, id, matchParams);
            }
        }
    }
    addRoute(pattern: string, cache?: ICache): Route {
        let route = new Route(this, new PathMatcher(pattern), cache || this.defaultCache);
        this._routes.push(route);
        return route;
    }
}