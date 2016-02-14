/// <reference path="../typings/main.d.ts"/>
import chai = require('chai');
var expect = chai.expect;
import { ICache, ICachable, NullCache } from "../src/cache";
describe("cache.ts", function () {
    class Cachable implements ICachable {
        id: string;
        expiration: number;
    }
    
    describe("NullCache", function () {
        describe("get", function () {
            it("returns undefined", function () {
                const cache = <ICache>(new NullCache());
                expect(cache.get("foo")).to.be.undefined;
            });
        });
        describe("set", function () {
            it("returns undefined", function () {
                const cache = <ICache>(new NullCache());
                const cachable = new Cachable();
                expect(cache.set(cachable)).to.be.undefined;
            });
        });
        describe("reset", function () {
            it("returns undefined", function () {
                const cache = <ICache>(new NullCache());
                expect(cache.reset()).to.be.undefined;
            });
        });
    });
});