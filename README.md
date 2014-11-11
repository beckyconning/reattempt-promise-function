reattempt-promise-function
==========================

`reattempt-promise-function` allows you to easily reattempt async actions.

It does this by re-calling a function that returns a promise when that promise 
is rejected. You can specify the delay between attempts and the maximum number
of attempts.

Perfect for waiting for services to start during Gulp and Grunt build and test
task.

## Quickstart

```javascript
reattempt(promiseFunction, arguments, delayBetweenAttempts, numberOfAttempts);
```

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
