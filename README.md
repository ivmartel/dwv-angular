# dwv-angular

Medical viewer using [DWV](https://github.com/ivmartel/dwv) (DICOM Web Viewer) and [Angular](https://angular.io/).

All coding/implementation contributions and comments are welcome. Releases should be ready for deployment otherwise download the code and install dependencies with a `yarn` or `npm` `install`.

dwv-angular is not certified for diagnostic use. Released under GNU GPL-3.0 license (see [license.txt](license.txt)).

[![Node.js CI](https://github.com/ivmartel/dwv-angular/actions/workflows/nodejs-ci.yml/badge.svg)](https://github.com/ivmartel/dwv-angular/actions/workflows/nodejs-ci.yml)

## Available Scripts

 - `install`: install dependencies
 - `start`: serve with hot reload at localhost:4200
 - `lint`: run linting
 - `test`:  run unit tests with hot reload
 - `e2e`: run e2e tests
 - `build`: build (add --prod for production)

Unit tests use [Karma](https://karma-runner.github.io) and e2e tests use [Protractor](http://www.protractortest.org/).

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.7.3.

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Steps to run the viewer from scratch

```sh
# get the code
git clone https://github.com/ivmartel/dwv-angular.git

# move to its folder
cd dwv-angular

# install dependencies
yarn install

# call the start script to launch the viewer on a local server
yarn run start
```

You can now open a browser at http://localhost:4200 and enjoy!
