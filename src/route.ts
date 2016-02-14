/// <reference path="../typings/main.d.ts"/>
import Promise = require("bluebird");
import { Domain } from "./domain";
import { IMatcher} from "./matcher";
import { Model } from "./model";

type MaybePromise<Data>  = Data | Promise<Data>;
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
    constructor(public domain: Domain, public matcher: IMatcher) {}

    getHandler: (matchResult: MatchResult) => Model<any>;
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
        };
        return this;
    }

    getDependent<Data>(
        mapDependents: (matchResult?: MatchResult) => MaybePromise<DependencyMap>,
        transform: (dependencyData: DependencyData, matchResult?: MatchResult) => MaybePromise<Data>): Route {
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
    constructor(public route: Route, public id: string, public matchInfo: {}) {}
}