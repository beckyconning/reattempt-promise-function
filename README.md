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

## Caveats

If the function you want to reattempt contains references to `this` make sure you
bind the required value of `this` to it before passing it to `reattempt`.

```javascript
var Food = function (name, sodium) { 
    this.name = name; 
    this.sodium = sodium;
};

Food.prototype.getSummary = function () {
    if (typeof this.name !== 'undefined' && typeof this.sodium !== undefined) {
        var summary = this.name + ' contains ' + this.sodium + 'g of sodium per 100g.'
        return Promise.resolve(summary);
    } else {
        return Promise.reject('Sorry there was nothing to summarise.'); 
    }
};

var strawberryJam = new Food('Stawberry jam', 0.2);

// The following is attempted 10 times with a 250ms delay between each attempt before
// being rejected.
reattempt(strawberryJam.getSummary, [], 250, 10).then(function (summary) {
    console.log(summary);
}).catch(function (error) {
    console.log(error);
});

var getStrawberryJamSummary = strawberryJam.getSummary.bind(strawberryJam);

// The following resolves immediately.
reattempt(getStrawberryJamSummary, [], 250, 10).then(function (summary) {
    console.log(summary);
}).catch(function (error) {
    console.log(error);
});
```

For more information on `Function.prototype.bind()` please see [the MDN documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)

## Testing
Use `npm test` to run the unit tests.

## Building
Use `npm run build` to build the `bundle.js` which can be used with CommonJS, AMD or a normal browser.
