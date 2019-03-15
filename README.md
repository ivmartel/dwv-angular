# dwv-angular

Medical viewer using [DWV](https://github.com/ivmartel/dwv) (DICOM Web Viewer) and [Angular](https://angular.io/).

All coding/implementation contributions and comments are welcome. Releases should be ready for deployment otherwise download the code and install dependencies with a `yarn` or `npm` `install`.

dwv-angular is not certified for diagnostic use. Released under GNU GPL-3.0 license (see [license.txt](license.txt)).

[![Build Status](https://travis-ci.org/ivmartel/dwv-angular.svg?branch=master)](https://travis-ci.org/ivmartel/dwv-angular)

## Steps to run the viewer from scratch

Get the code:
```sh
git clone https://github.com/ivmartel/dwv-angular.git
```

Move to its folder:
```sh
cd dwv-angular
```

Install dependencies (using `yarn`, replace with `npm` if you prefer):
```sh
yarn install
```

Call the start script to launch the viewer on a local server:
```sh
yarn run start
```

You can now open a browser at http://localhost:4200 and enjoy!

## Available Scripts

``` bash
# install dependencies
yarn install

# serve with hot reload at localhost:4200
ng run start

# run linting
yarn run lint

# run unit tests with hot reload
yarn run test

# run e2e tests
yarn run e2e

# build (add --prod for production)
yarn run build
```

Unit tests use [Karma](https://karma-runner.github.io) and e2e tests use [Protractor](http://www.protractortest.org/).

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.7.3.

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
