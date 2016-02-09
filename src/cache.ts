export interface ICachable {
    id: string;
    expiration: number;
}

export interface ICache {
    get(id: string): ICachable;
    set(cachable: ICachable): void;
    reset(): void;
}

export class NullCache implements ICache {
    get(id: string): ICachable { return undefined; }
    set(cachable: ICachable): void {}
    reset(): void {}
}