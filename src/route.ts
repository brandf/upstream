/// <reference path="../typings/main.d.ts"/>
import Promise = require("bluebird");
import { MaybePromise } from "./promise";
import { Domain } from "./domain";
import { IMatcher, MatchResult } from "./matcher";
import { Model } from "./model";
import { ICache } from "./cache";

type DependencyMap       = {[name: string]: string};
type DependencyData      = {[name: string]: any};
function mapProps(obj: {[index: string]: any}, transform: (value: any) => any): {[index: string]: any} {
    let result: {[index: string]: any} = {};
    for (let prop in obj) {
        result[prop] = transform(obj[prop]);
    }
    return result;
}
export class Route {
    constructor(public domain: Domain, public matcher: IMatcher, public cache: ICache) {}
    getHandler: (matchResult: MatchResult<Route>) => Model<any>;
    get<Data>(handler: (matchResult?: MatchResult<Route>) => MaybePromise<Data>): Route {
        this.getHandler = (matchResult) => {
            let id = matchResult.id;
            let model = <Model<Data>>this.cache.get(id);
            if (model) {
                return model;
            }

            model = new Model<Data>(this, id, () => {
                return Promise.attempt<Data>(() => {
                    return <Data>handler(matchResult);
                });
            });

            this.cache.set(model);
            return model;
        };
        return this;
    }
    getDependent<Data>(
        mapDependents: (matchResult?: MatchResult<Route>) => MaybePromise<DependencyMap>,
        transform: (dependencyData: DependencyData, matchResult?: MatchResult<Route>) => MaybePromise<Data>): Route {
        return this.get((matchResult) => {
            return Promise.attempt<DependencyMap>(() => {
                return <DependencyMap>mapDependents(matchResult);
            }).then((dependencyMap) => {
                return Promise.props(
                    mapProps(
                        mapProps(dependencyMap, (id) => this.domain.dispatcher.get(id)),
                        (model) => model.resolve()
                    )
                );
            }).then((dependencyData) => {
                return transform(dependencyData, matchResult);
            });
        });
    }
}