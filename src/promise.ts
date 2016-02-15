/// <reference path="../typings/main.d.ts"/>
import Promise = require("bluebird");

export type MaybePromise<T>  = T | Promise<T>;