/// <reference path="../typings/tsd.d.ts"/>
import Promise = require("bluebird");
import { Domain } from "./domain";

var domain = new Domain();

// TODO: callback function should take 'matcher results'
// TODO: need a good non-regexp based matcher
// TODO: dependent routes should support both arrays and maps
domain.addRoute("/foo/1", () => {
     return { foo: "1" };
});

domain.addRoute("/foo/2", () => {
     return { foo: "2" };
});

domain.addDependentRoute("/bar/12", () => ["/foo/1", "/foo/2"], (deps) => {
    return { bar1: deps[0].foo, bar2: deps[1].foo }; 
});

domain.locate("/bar/12").resolve().then((bar) => {
    console.dir(bar);
});