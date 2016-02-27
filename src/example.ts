/// <reference path="../typings/main.d.ts"/>
import Promise = require("bluebird");
import { Dispatcher } from "./dispatcher";
import { IAsyncCollection, AsyncArray } from "./collection";

const dispatcher = new Dispatcher();
const storage = dispatcher.addDomain("storage");
const service = dispatcher.addDomain("service");
const viewmodel = dispatcher.addDomain("viewmodel");

storage.addRoute("/foo/:id").get((match) => {
    return { foo: Number(match.params["id"]) };
});

service.addRoute("/foo/:id").get((match) => {
    return Promise.resolve({ foo: Number(match.params["id"]) });
});

viewmodel.addRoute("/bar/:id").dependsOn((match) => {
    return  {
        foo: "storage/foo/" + match.params["id"],
    };
}).get((depData) => {
    return {
        bar: deps["foo"].foo * 2
    };
}).patch((patch) => {
    return {
        foo: { foo: patch.bar / 2 }
    };
});

viewmodel.addRoute("/baz/:id").getDependent((match) => {
        return  {
            foo: "service/foo/" + match.params["id"],
            bar: "viewmodel/bar/" + match.params["id"],
        };
    }, (deps) => {
        return Promise.resolve({
            baz: new AsyncArray<string>(["blah", deps["foo"].foo.toString(), deps["bar"].bar.toString()])
        });
    }
);
viewmodel.addRoute("/buz/:id").getDependent((match) => {
        return  {
            baz: "viewmodel/baz/" + match.params["id"]
        };
    }, (deps) => {
        return (<IAsyncCollection<string>>(deps["baz"].baz)).map((s) => "val=" + s).slice(1).reduce((p, c) => p + ", " + c).then((buz) => {
            return {
                buz: buz
            };
        });
    }
);
dispatcher.get("viewmodel/buz/3").resolve().then((data) => {
    /* eslint-disable no-console */
    console.dir(data);
    /* eslint-enable no-console */
});

dispatcher.locate("viewmodel/buz/5").get().then((data) => {
    /* eslint-disable no-console */
    console.dir(data);
    /* eslint-enable no-console */
});