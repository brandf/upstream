#!/bin/bash
tsc -p .
tslint src/**.ts
eslint dist/**.js