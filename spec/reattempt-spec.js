describe('reattempt-promise-function', function () {
    var reattempt = require('../src/reattempt-promise-function');

    var delay    = 5;
    var attempts = 3;
    var args     = [ 'a', 'b', 'c' ];
    var resolveValue = 'Resolved';
    var rejectValue = 'Rejected';

    var getPromiseFunctionSpy = function (callNumberToResolveOn) {
        var fake = function fake() {
            fake.callNumber = fake.callNumber + 1;

            if (fake.callNumber === callNumberToResolveOn) {
                return Promise.resolve(resolveValue);
            } else {
                return Promise.reject(rejectValue);
            }
        };
        fake.callNumber = 0;

        return jasmine.createSpy('promiseFunction').and.callFake(fake);
    };

    var getExpectCorrectCalls = function (spy, expectedArgs) {
        return function () { expect(spy.calls.allArgs()).toEqual(expectedArgs); };
    };

    var expectCorrectResolveValueWhenResolveOnAttempt = function (resolveAttempt) {
        var promiseFunctionSpy = getPromiseFunctionSpy(resolveAttempt);
        var expectCorrectResolveValue = function (value) {
            expect(value).toEqual(resolveValue);
        };

        return reattempt(promiseFunctionSpy, args, delay, attempts)
            .then(expectCorrectResolveValue)
    };

    describe('when the promise returned by the provided function is always rejected', function () {
        it('should call the provided function with provided args the provided number of attempts', function (done) {
            var promiseFunctionSpy = getPromiseFunctionSpy(-1);

            reattempt(promiseFunctionSpy, args, delay, attempts)
                .catch(getExpectCorrectCalls(promiseFunctionSpy, [args, args, args]))
                .then(done);
        });

        describe('returned promise', function () {
            it('should be rejected with the reject value of the promise function', function (done) {
                var promiseFunctionSpy = getPromiseFunctionSpy(-1);
                var expectCorrectRejectValue = function (value) {
                    expect(value).toEqual(rejectValue);
                };

                reattempt(promiseFunctionSpy, args, delay, attempts)
                    .catch(expectCorrectRejectValue)
                    .then(done);
            });
        });
    });

    describe('when the promise returned by the provided function resolves on the third attempt', function () {
        it('should call the provided function with provided args three times', function (done) {
            var promiseFunctionSpy = getPromiseFunctionSpy(3);

            reattempt(promiseFunctionSpy, args, delay, attempts)
                .then(getExpectCorrectCalls(promiseFunctionSpy, [args, args, args]))
                .then(done);
        });

        describe('returned promise', function () {
            it('should be resolved with the resolve value of the promise function', function (done) {
                expectCorrectResolveValueWhenResolveOnAttempt(3).then(done);
            });
        });
    });

    describe('when the promise returned by the provided function resolves on the second attempt', function () {
        it('should call the provided function with provided args twice', function (done) {
            var promiseFunctionSpy = getPromiseFunctionSpy(2);

            reattempt(promiseFunctionSpy, args, delay, attempts)
                .then(getExpectCorrectCalls(promiseFunctionSpy, [args, args]))
                .then(done);
        });

        describe('returned promise', function () {
            it('should be resolved with the resolve value of the promise function', function (done) {
                expectCorrectResolveValueWhenResolveOnAttempt(2).then(done);
            });
        });
    });

    describe('when the promise returned by the provided function resolves on the first attempt', function () {
        it('should call the provided function once', function (done) {
            var promiseFunctionSpy = getPromiseFunctionSpy(1);

            reattempt(promiseFunctionSpy, args, delay, attempts)
                .then(getExpectCorrectCalls(promiseFunctionSpy, [args]))
                .then(done);
        });

        describe('returned promise', function () {
            it('should be resolved with the resolve value of the promise function', function (done) {
                expectCorrectResolveValueWhenResolveOnAttempt(1).then(done);
            });
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
