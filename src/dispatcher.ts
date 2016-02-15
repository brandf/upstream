import { Domain } from "./domain";
import { DomainMatcher, MatchResult } from "./matcher";
import { Model } from "./model";
import { ICache, NullCache } from "./cache";

export class Dispatcher {
    private _domains: Domain[];
    private _defaultCache: ICache;
    constructor(defaultCache?: ICache) {
        this._domains = [];
        this._defaultCache = defaultCache || new NullCache();
    }
    get<Data>(id: string): Model<Data> {
        let matchResult = this.matchDomain(id);
        if (matchResult) {
            return matchResult.owner.get<Data>(matchResult.params["path"]);
        }
        throw Error("No domain matched: " + id);
    }
    addDomain(prefix: string, cache?: ICache) {
        let domain = new Domain(this, new DomainMatcher(prefix), cache || this._defaultCache);
        this._domains.push(domain);
        return domain;
    }
    matchDomain(id: string): MatchResult<Domain> {
        for (const domain of this._domains) {
            let matchParams = domain.matcher.match(id);
            if (matchParams) {
                return new MatchResult(domain, id, matchParams);
            }
        }
    }
}