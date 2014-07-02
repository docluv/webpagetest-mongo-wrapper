# webpagetest-wrapper

Node wrapper for webpage test to handle running tests and pushing to mongo through mongoose

## Getting Started

### Codebase ###

Clone down the webpagetest repo
```
$ git clone git@bitbucket.org:hxshortbreaks/webpagetest-wrappe.git
```

Get all the built-in dependencies:
```
$ npm install
```

Fill in config.json with API Key, server url, database url & sites you want to test

### If you are running locally ###

Download monogdb (http://www.mongodb.org/) & run the following command from inside the directory

```
$ mongod --dbpath /PATH/TO/webpagetest-wrapper.git
```

In another window, in the same directory, run the following command.

```
$ mongo
```

### Otherwise ###

Make sure your mongo server is up and running

### Now lets make it go ###

```
$ node index.js
```

Will run through and individually run each test one at a time and close down the connection after its finished

## Working on The Works

### Notes on coding style

Code is linted by ".jshintrc" and checked against the coding style guide "shortbreaks.jscs.json" when you run the default grunt task:
```
$ grunt
```

### Tests

There are currently no tests

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2014 Shortbreaks
Licensed under the MIT license.