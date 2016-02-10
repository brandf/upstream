/// <reference path="../typings/main.d.ts"/>
import Promise = require("bluebird");
import { Domain } from "./domain";
import { IAsyncCollection, AsyncArray } from "./collection";

let domain = new Domain();

domain.addRoute("/foo/1").get(() => {
    return { baz: "1" };
});

domain.addRoute("/foo/2").get(() => {
    return Promise.resolve({ baz: "2" });
});

domain.addRoute("/bar/1").getDependent(() => {
        return  {
            foo1: "/foo/1",
            foo2: "/foo/2"
        };
    }, (deps) => {
        return {
            baz1: deps["foo1"].baz,
            baz2: deps["foo2"].baz
        };
    }
);

domain.addRoute("/bar/2").getDependent(() => {
        return  Promise.resolve<{[name: string]: string}>({
            bar1: "/bar/1"
        });
    }, (deps) => {
        return Promise.resolve({
            baz: new AsyncArray<string>([deps["bar1"].baz1, deps["bar1"].baz2, "3"])
        });
    }
);

domain.addRoute("/bar/3").getDependent(() => {
        return  Promise.resolve<{[name: string]: string}>({
            bar2: "/bar/2"
        });
    }, (deps) => {
        return (<IAsyncCollection<string>>(deps["bar2"].baz)).map((s) => "val=" + s).slice(1).reduce((p, c) => p + ", " + c).then((baz) => {
            return {
                baz: baz
            };
        });
    }
);

domain.get("/bar/3").resolve().then((bar) => {
    /* eslint-disable no-console */
    console.dir(bar);
    /* eslint-enable no-console */
});