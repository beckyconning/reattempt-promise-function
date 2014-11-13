var Promise = require('bluebird');
var T       = require('tcomb');

var PromiseType = T.subtype(T.Obj, function (o) { return o instanceof Promise; });

var reattempt = T.func([ T.Func, T.Arr, T.Num, T.Num ], PromiseType)
    .of(function (promiseFunction, args, delay, attemptsLeft) {
        var nextAttempt = function () {
            return reattempt(promiseFunction, args, delay, attemptsLeft - 1);
        };

        return Promise.resolve(promiseFunction.apply(null, args))
            .catch(function (rejectValue) {
                if (attemptsLeft <= 1) return Promise.reject(rejectValue);
                else return Promise.delay(delay).then(nextAttempt);
            });
    });

module.exports = reattempt;
