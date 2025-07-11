# dwv-angular project

Medical viewer using [DWV](https://github.com/ivmartel/dwv) (DICOM Web Viewer) and [Angular](https://angular.io/):
 - [dwv-angular](./projects/dwv-angular): Angular component
 - [dwv-angular-app](./projects/dwv-angular-app): example Angular application integrating the dwv-angular compoment

All coding/implementation contributions and comments are welcome. Releases should be ready for deployment otherwise download the code and install dependencies with a `yarn` or `npm` `install`.

dwv-angular is not certified for diagnostic use. Released under GNU GPL-3.0 license (see [license.txt](license.txt)).

[![Node.js CI](https://github.com/ivmartel/dwv-angular/actions/workflows/nodejs-ci.yml/badge.svg)](https://github.com/ivmartel/dwv-angular/actions/workflows/nodejs-ci.yml)

## Available Scripts

 - `install`: install dependencies
 - `start`: serve with hot reload at localhost:4200
 - `lint`: run linting
 - `test`:  run unit tests with hot reload for the project specified as argument
 - `build`: build the project specified as argument

This project was generated with [Angular CLI](https://angular.dev/cli) version 18.2.0.

## Steps to run the viewer from scratch

```sh
# get the code
git clone https://github.com/ivmartel/dwv-angular.git

# move to its folder
cd dwv-angular

# install dependencies
yarn install

# build the library
yarn run build-lib

# call the start script to launch the viewer on a local server
yarn run start
```

You can now open a browser at http://localhost:4200 and enjoy!

## DWVs' Web workers
Web workers used in dwv need to be available in the `./assets/workers` folder (relative to the calling html). Angular copies them in the build
of the dwv-angular-app (not the lib).
