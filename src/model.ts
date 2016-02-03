/// <reference path="../typings/main.d.ts"/>
import Promise = require("bluebird");
import { ICachable } from "./cache";
import { Domain } from "./domain";

export class Model<Data> implements ICachable {
    domain: Domain;
    id: string;
    expiration: number;
    
    private _dataFetcher: (id: string) => (Data|Promise<Data>);
    private _fetchedDataPromise: Promise<Data>;
    
    constructor(id: string, domain: Domain, dataFetcher: (id: string) => (Data|Promise<Data>)) {
        this.id = id;
        this.domain = domain;
        this.expiration = 0;
        this._dataFetcher = dataFetcher;
        this._fetchedDataPromise = undefined;
    }
    
    resolve(): Promise<Data> {
        this.domain.cache.set(this);
        if (this._fetchedDataPromise === undefined) {
            this._fetchedDataPromise = Promise.attempt<Data>(() => { 
                return <Promise<Data>>this._dataFetcher(this.id);
            });
        }
        return this._fetchedDataPromise;
    }
}
