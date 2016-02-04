/// <reference path="../typings/main.d.ts"/>
import Promise = require("bluebird");
import { Domain } from "./domain";
import { IAsyncCollection, AsyncCollection } from "./collection";

var domain = new Domain();

domain.addRoute("/foo/1", () => {
    return { baz: "1" };
});

domain.addRoute("/foo/2", () => {
    return Promise.resolve({ baz: "2" });
});

domain.addDependentRoute("/bar/1", () => {
        return  {
            foo1: "/foo/1", 
            foo2: "/foo/2"
        }
    }, (deps) => {
        return { 
            baz1: deps["foo1"].baz, 
            baz2: deps["foo2"].baz
        }; 
    }
);

domain.addDependentRoute("/bar/2", () => {
        return  Promise.resolve<{[name:string]:string}>({
            bar1: "/bar/1"
        });
    }, (deps) => {
        return Promise.resolve({ 
            baz: new AsyncCollection<string>([deps["bar1"].baz1, deps["bar1"].baz2])
        }); 
    }
);

domain.addDependentRoute("/bar/3", () => {
        return  Promise.resolve<{[name:string]:string}>({
            bar2: "/bar/2"
        });
    }, (deps) => {
        return (<AsyncCollection<string>>(deps["bar2"].baz))
            .map((s) => "baz=" + s)
            .reduce((p, c) => p + ", " + c)
            .then((baz) => {
                return {
                    baz: baz
                };
            });
    }
);

domain.locate("/bar/3").resolve().then((bar) => {
    console.dir(bar);
});