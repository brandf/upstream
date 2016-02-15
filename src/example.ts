/// <reference path="../typings/main.d.ts"/>
import Promise = require("bluebird");
import { Dispatcher } from "./dispatcher";
import { IAsyncCollection, AsyncArray } from "./collection";

const dispatcher = new Dispatcher();
const example = dispatcher.addDomain("example");

example.addRoute("/foo/:id").get((match) => {
    return { foo: Number(match.params["id"]) };
});

example.addRoute("/bar/:id").getDependent((match) => {
        return  {
            foo: "example/foo/" + match.params["id"],
        };
    }, (deps) => {
        return {
            bar: deps["foo"].foo * 2
        };
    }
);
example.addRoute("/baz/:id").getDependent((match) => {
        return  {
            foo: "example/foo/" + match.params["id"],
            bar: "example/bar/" + match.params["id"],
        };
    }, (deps) => {
        return Promise.resolve({
            baz: new AsyncArray<string>(["blah", deps["foo"].foo.toString(), deps["bar"].bar.toString()])
        });
    }
);
example.addRoute("/buz/:id").getDependent((match) => {
        return  {
            baz: "example/baz/" + match.params["id"]
        };
    }, (deps) => {
        return (<IAsyncCollection<string>>(deps["baz"].baz)).map((s) => "val=" + s).slice(1).reduce((p, c) => p + ", " + c).then((buz) => {
            return {
                buz: buz
            };
        });
    }
);
dispatcher.get("example/buz/3").resolve().then((bar) => {
    /* eslint-disable no-console */
    console.dir(bar);
    /* eslint-enable no-console */
});