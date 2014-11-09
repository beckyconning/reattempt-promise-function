describe('reattempt-promise-function', function () {
    var Promise   = require('bluebird');
    var reattempt = require('../src/reattempt-promise-function');

    var delay    = 5;
    var attempts = 3;
    var args     = [ 'a', 'b', 'c' ];

    var getPromiseFunctionSpy = function (callNumberToResolveOn) {
        var fake = function fake() {
            fake.callNumber = fake.callNumber + 1;

            if (fake.callNumber === callNumberToResolveOn) {
                return Promise.resolve();
            } else {
                return Promise.reject();
            }
        };
        fake.callNumber = 0;

        return jasmine.createSpy('promiseFunction').and.callFake(fake);
    };

    var getExpectCorrectCalls = function (spy, expectedArgs) {
        return function () { expect(spy.calls.allArgs()).toEqual(expectedArgs); };
    };

    describe('when the promise returned by the provided function is always rejected', function () {
        it('should call the provided function with provided args the provided number of attempts', function (done) {
            var promiseFunctionSpy = getPromiseFunctionSpy(-1);

            reattempt(promiseFunctionSpy, args, delay, attempts)
                .catch(getExpectCorrectCalls(promiseFunctionSpy, [args, args, args]))
                .then(done);
        });
    });

    describe('when the promise returned by the provided function resolves on the third attempt', function () {
        it('should call the provided function with provided args three times', function (done) {
            var promiseFunctionSpy = getPromiseFunctionSpy(3);

            reattempt(promiseFunctionSpy, args, delay, attempts)
                .then(getExpectCorrectCalls(promiseFunctionSpy, [args, args, args]))
                .then(done);
        });
    });

    describe('when the promise returned by the provided function resolves on the second attempt', function () {
        it('should call the provided function with provided args twice', function (done) {
            var promiseFunctionSpy = getPromiseFunctionSpy(2);

            reattempt(promiseFunctionSpy, args, delay, attempts)
                .then(getExpectCorrectCalls(promiseFunctionSpy, [args, args]))
                .then(done);
        });
    });

    describe('when the promise returned by the provided function resolves on the first attempt', function () {
        it('should call the provided function once', function (done) {
            var promiseFunctionSpy = getPromiseFunctionSpy(1);

            reattempt(promiseFunctionSpy, args, delay, attempts)
                .then(getExpectCorrectCalls(promiseFunctionSpy, [args]))
                .then(done);
        });
    });

    it('it should wait the supplied delay between attempts', function (done) {
        var timeBefore = new Date().getTime();
        var expectedDuration = delay * (attempts - 1);

        reattempt(getPromiseFunctionSpy(-1), args, delay, attempts)
            .catch(function () {
                var timeAfter = new Date().getTime();
                var duration = timeAfter - timeBefore;
                expect(duration).toBeGreaterThan(expectedDuration - 1);
                expect(duration).toBeLessThan(expectedDuration + 5);
                done();
            });
    });
});
