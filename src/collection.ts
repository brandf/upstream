/// <reference path="../typings/main.d.ts"/>
import Promise = require("bluebird");

export interface IAsyncCollection<T> {
    concat(other: IAsyncCollection<T>): IAsyncCollection<T>;
    map<R>(callback: (value: T, index?: number) => R): IAsyncCollection<R>;
    reduce(callback: (previous: T, current: T, index?: number) => T, initialValue?: T): Promise<T>;
    slice(begin?: number, end?: number): IAsyncCollection<T>;
    
    getLength(): Promise<number>;
    toArray(begin?: number, end?: number): Promise<T[]>;
}


export class AsyncCollectionBase<T> implements IAsyncCollection<T> {
    concat(that: IAsyncCollection<T>): IAsyncCollection<T> {
        return new ConcatAsyncCollection<T>(this, that);
    }
    
    map<R>(callback: (value: T, index?: number) => R): IAsyncCollection<R> {
        return new MapAsyncCollection<T, R>(this, callback);
    }
    
    reduce(callback: (previous: T, current: T, index?: number) => T, initialValue?: T): Promise<T> {
        return this.toArray().then((array) => array.reduce<T>(callback, initialValue));
    }
    
    slice(begin?: number, end?: number): IAsyncCollection<T> {
        return new SliceAsyncCollection<T>(this, begin, end);
    }
    
    getLength(): Promise<number> { return Promise.resolve(0); }
    
    toArray(begin?: number, end?: number): Promise<T[]> { return Promise.resolve([]); }
}

export class AsyncCollection<T> extends AsyncCollectionBase<T> {
    constructor(public wrapped: T[]) {
        super();
    }
    
    getLength(): Promise<number> { return Promise.resolve(this.wrapped.length); }
    
    toArray(begin?: number, end?: number): Promise<T[]> { return Promise.resolve(this.wrapped.slice(begin, end)); }
}

class ConcatAsyncCollection<T> extends AsyncCollectionBase<T> {
    constructor(public first: IAsyncCollection<T>, public second: IAsyncCollection<T>) {
        super();
    }
    
    getLength(): Promise<number> {
        return Promise.all([
            this.first.getLength(), 
            this.second.getLength()
        ]).then((lengths: number[]) =>  {
            return lengths[0] + lengths[1];
        });
    }
    
    toArray(begin?: number, end?: number): Promise<T[]> { 
        begin = begin || 0;
        if (begin === 0 && end === undefined) {
            // special (common) case where we just grab it all.
            return Promise.all([
                this.first.toArray(), 
                this.second.toArray()
            ]).then((arrays) =>  {
                return arrays[0].concat(arrays[1]);
            });
        }
        
        return this.first.getLength().then((firstLength) => {
            if (end !== undefined && end <= firstLength) {
                // only need first
                return this.first.toArray(begin, end);
            } else if (begin >= firstLength) {
                // only need the second
                begin -= firstLength;
                end === undefined ? undefined : end - firstLength;
                return this.second.toArray(begin, end);
            } else {
                // need all of first and at least some of second
                end === undefined ? undefined : end - firstLength;
                return Promise.all([
                    this.first.toArray(begin), 
                    this.second.toArray(0, end)
                ]).then((arrays) =>  {
                    return arrays[0].concat(arrays[1]);
                });
            }
        });
    }
}

class MapAsyncCollection<T1, T2> extends AsyncCollectionBase<T2> {
    constructor(public wrapped: IAsyncCollection<T1>, public callback: (value: T1, index?: number) => T2) {
        super();
    }
    
    getLength(): Promise<number> {
        return this.wrapped.getLength();
    }
    
    toArray(begin?: number, end?: number): Promise<T2[]> { 
        return this.wrapped.toArray(begin, end)
            .then((array) => {
                return array.map<T2>(this.callback);
            });
    }
}

class SliceAsyncCollection<T> extends AsyncCollectionBase<T> {
    constructor(public wrapped: IAsyncCollection<T>, public begin?: number, public end?: number) {
        super();
    }
    
    getLength(): Promise<number> {
        return this.wrapped.getLength().then((length) => {
            let begin = this.begin || 0;
            let end = this.end || length;
            return Math.min(length, end - begin);
        });
    }
    
    toArray(begin?: number, end?: number): Promise<T[]> {
        begin = begin || 0;
        let thisBegin = this.begin || 0;
        let wrappedBegin = begin + thisBegin;
        
        if (end === undefined) {
            let wrappedEnd = this.end;
            return this.wrapped.toArray(wrappedBegin, wrappedEnd);    
        } else {
            return this.wrapped.getLength().then((length) => {
                let wrappedEnd = Math.min(length, end + thisBegin);
                return this.wrapped.toArray(wrappedBegin, wrappedEnd);
            });
        }
    }
}