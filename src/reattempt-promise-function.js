var Promise = require('bluebird');
var T       = require('tcomb');

var PromiseType = T.subtype(T.Obj, function (o) { return o instanceof Promise; });

var reattempt = T.func([ T.Func, T.Arr, T.Num, T.Num ], PromiseType)
    .of(function (promiseFunction, args, delay, attemptsLeft) {
        return Promise.resolve(promiseFunction.apply(promiseFunction, args))
            .catch(function (rejectValue) {
                if (attemptsLeft <= 1)
                    return Promise.reject(rejectValue);
                else
                    return Promise.delay(delay)
                        .then(function () {
                                return reattempt(promiseFunction, args, delay, attemptsLeft - 1);
                        });
            });
    });

module.exports = reattempt;
