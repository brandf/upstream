/// <reference path="../typings/main.d.ts"/>
import Promise = require("bluebird");
import { MaybePromise } from "./promise";
import { ICachable } from "./cache";
import { Route } from "./route";

export class Model<Data> implements ICachable {
    expiration: number;
    private _dataFetcher: (id: string) => MaybePromise<Data>;
    private _fetchedDataPromise: Promise<Data>;
    constructor(public route: Route, public id: string, dataFetcher: (id: string) => MaybePromise<Data>) {
        this.expiration          = Number.MAX_VALUE;
        this._dataFetcher        = dataFetcher;
        this._fetchedDataPromise = undefined;
    }
    get(): Promise<Data> {
        this.route.cache.set(this);
        if (this._fetchedDataPromise === undefined) {
            this._fetchedDataPromise = Promise.attempt<Data>(() => {
                return <Promise<Data>>this._dataFetcher(this.id);
            });
        }
        return this._fetchedDataPromise;
    }
}
