/// <reference path="../typings/main.d.ts"/>
import Promise = require("bluebird");
import { Dispatcher } from "./dispatcher";
import { IAsyncCollection, AsyncArray } from "./collection";

const dispatcher = new Dispatcher();
const example = dispatcher.addDomain("example");

example.addRoute("/foo/:id").get((match) => {
    return { baz: match.params["id"] };
});

example.addRoute("/bar/1").getDependent(() => {
        return  {
            foo1: "example/foo/1",
            foo2: "example/foo/2"
        };
    }, (deps) => {
        return {
            baz1: deps["foo1"].baz,
            baz2: deps["foo2"].baz
        };
    }
);
example.addRoute("/bar/2").getDependent(() => {
        return  {
            bar1: "example/bar/1"
        };
    }, (deps) => {
        return Promise.resolve({
            baz: new AsyncArray<string>([deps["bar1"].baz1, deps["bar1"].baz2, "3"])
        });
    }
);
example.addRoute("/bar/3").getDependent(() => {
        return  {
            bar2: "example/bar/2"
        };
    }, (deps) => {
        return (<IAsyncCollection<string>>(deps["bar2"].baz)).map((s) => "val=" + s).slice(1).reduce((p, c) => p + ", " + c).then((baz) => {
            return {
                baz: baz
            };
        });
    }
);
dispatcher.get("example/bar/3").resolve().then((bar) => {
    /* eslint-disable no-console */
    console.dir(bar);
    /* eslint-enable no-console */
});