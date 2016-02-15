export interface ICachable {
    id: string;
    expiration: number;
}
export interface ICache {
    get(id: string): ICachable;
    set(cachable: ICachable): void;
    remove(id: string): void;
    reset(): void;
}
export class NullCache implements ICache {
    get(/*id: string*/): ICachable { return undefined; }
    set(/*cachable: ICachable*/) {}
    remove(/*id: string*/) { }
    reset() {}
}
export class MemoryCache implements ICache {
    private _storage: {[id: string]: ICachable};

    constructor() {
        this.reset();
    }
    get(id: string): ICachable {
        if (this._storage.hasOwnProperty(id)) {
            const cachable = this._storage[id];
            const now = Date.now();
            if (cachable.expiration < now) {
                return cachable;
            } else {
                // expired
                this.remove(id);
            }
        }
    }
    set(cachable: ICachable) {
        this._storage[cachable.id] = cachable;
    }
    remove(id: string) {
        delete this._storage[id];
    }
    reset() {
        this._storage = {};
    }
}