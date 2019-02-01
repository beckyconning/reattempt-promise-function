var delay = function (duration) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve();
    }, duration);
  });
};

var reattempt = function (promiseFunction, args, delayDuration, attemptsLeft) {
  var nextAttempt = function () {
    return reattempt(promiseFunction, args, delayDuration, attemptsLeft - 1);
  };

  return Promise.resolve(promiseFunction.apply(null, args))
    .catch(function (rejectValue) {
        if (attemptsLeft <= 1) return Promise.reject(rejectValue);
        else return delay(delayDuration).then(nextAttempt);
    });
};

module.exports = reattempt; 
