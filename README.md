reattempt-promise-function
==========================

`reattempt-promise-function` allows you to easily reattempt async actions.

It does this by re-calling a function that returns a promise when that promise 
is rejected. You can specify the delay between attempts and the maximum number
of attempts.

Perfect for waiting for services to start during Gulp and Grunt build and test
tasks or attempting to reconnect to an application backend after becoming
disconnected.

## Quickstart

### Node

```sh
npm install https://github.com/beckyconning/reattempt-promise-function/tarball/master --save
```

```javascript
var reattempt = require('reattempt-promise-function');
reattempt(promiseFunction, arguments, delayBetweenAttempts, numberOfAttempts);
```

### Simple browser

```sh
bower install https://github.com/beckyconning/reattempt-promise-function/tarball/master --save
```

```html
<script src="bower_components/reattempt-promise-function/bundle.js"></script>
```

```javascript
reattempt(promiseFunction, arguments, delayBetweenAttempts, numberOfAttempts);
```

### Other options

You can also use `bundle.js` with Browserify / CommonJS / AMD.

## Example

```javascript
var reattempt = require('reattempt-promise-function');
var requestPromise = require('request-promise');
var uri = 'http://localhost:3000';
var requestOptions = { 'method': 'GET', 'uri': uri };

// Attempt http get request 10 times with a 250ms delay between attmpts
reattempt(requestPromise, [requestOptions], 250, 10)
    .then(function (response) {
        console.log('`' + uri + '` is now available.')
    })
    .catch(function (error) {
        console.log('Couldn\'t connect to `' + uri '`.');
    });
```

## Testing
Use `npm test` to run the unit tests.
