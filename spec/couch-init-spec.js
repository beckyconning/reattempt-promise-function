describe('couch-init', function() {
    var couchInit;
    var requestPromise;
    var requestDeferreds;
    var requestPromises;
    var resolveRequestsInstantly;
    var rejectRequestsInstantly;
    var Promise = require('bluebird');
    var proxyquire = require('proxyquire');
    var _ = require('underscore');
    var couchUrl = "http://example.com";

    // create and spy on request-promise mock
    beforeEach(function() {
        var mock = {};
        requestDeferreds = [];
        requestPromises = [];
	resolveRequestsInstantly = false;
	rejectRequestsInstantly = false;

        // mock requestPromise
        mock.requestPromise = function() {
            requestDeferred = Promise.defer();

	    if (resolveRequestsInstantly) requestDeferred.resolve();
	    else if (rejectRequestsInstantly) requestDeferred.reject();

            requestDeferreds.push(requestDeferred);
            requestPromises.push(requestDeferred.promise);
            return requestDeferred.promise;
        }; 

        // spy on mock requestPromise
        spyOn(mock, 'requestPromise').and.callThrough();
        requestPromise = mock.requestPromise;

        // instantiate a couch-init with overridden dependencies
        couchInit = proxyquire('../lib/couch-init', {
            'request-promise': requestPromise 
        });
    });

    describe('configure', function() {
        it('should return a promise', function() {
            var configuration = {};
            var promise = couchInit.configure(couchUrl, configuration);
            expect(promise.then).toBeDefined();
        });

        it('should update the couchdb configuration for each option in the provided configuration', function(done) {
            var configuration = {
                httpd: {
                    enable_cors: 'true'
                },    
                cors: {
                    origins: '*',
                    credentials: 'false'
                }     
            };        
            var expectedConfigOptions = {
                "http://example.com/_config/httpd/enable_cors": "true",
                "http://example.com/_config/cors/origins": "*",
                "http://example.com/_config/cors/credentials": "false"
            };

            // call the method
            couchInit.configure(couchUrl, configuration)
                .catch(console.error.bind(console));         

            // expect a request for each option
            Object.keys(expectedConfigOptions).forEach(function(optionUrl) {
                var optionValue = expectedConfigOptions[optionUrl];
                var expectedRequestOptions = {
                    url: optionUrl,
                    method: 'PUT',
                    json: true,
                    body: JSON.stringify(optionValue)
                };
                expect(requestPromise).toHaveBeenCalledWith(expectedRequestOptions);
            });

            done();
        }); 
    });

    describe('waitForStart', function() {
        it('should return a promise', function() {
            var promise = couchInit.waitForStart(couchUrl);
            expect(promise.then).toBeDefined();
        });    

        it('should try to get couch info the supplied number of times', function(done) {
            var delay = 5;
            var attempts = 3;
            var expectedRequestOptions = {
                url: couchUrl,
                method: 'GET'
            };

            var expectCorrectRequests = function() {
                expect(requestPromise.calls.count()).toEqual(attempts); 

                _.times(attempts, function(attemptIndex) {
                    expect(requestPromise.calls.argsFor(attemptIndex))
                        .toEqual([expectedRequestOptions]);
                });

		done();
            };

	    rejectRequestsInstantly = true;
 
            couchInit.waitForStart(couchUrl, delay, attempts)
                .then(null, expectCorrectRequests)
                .catch(console.error.bind(console));
        });

        it('it should wait the supplied delay between attempts', function(done) {
            var delay = 10;
            var attempts = 2;
            var timeBeforeSecondRequest;
            var expectedTimeAfterSecondRequest;

            rejectRequestsInstantly = true;

            couchInit.waitForStart(couchUrl, delay, attempts)
                .then(null, function() {
                    var timeAfterSecondRequest = new Date().getTime();
                    var timeDifference = timeAfterSecondRequest - timeBeforeSecondRequest;
                    expect(timeDifference).toBeGreaterThan(delay - 1);
                    expect(timeDifference).toBeLessThan(delay + 25);
                    done();
                })
                .catch(console.error.bind(console));

            timeBeforeSecondRequest = new Date().getTime();
        });            
    });

    describe('createDatabases', function() {
        it('should return a promise', function() {
            var configuration = {};
            var promise = couchInit.createDatabases(couchUrl, configuration);
            expect(promise.then).toBeDefined();
        });    

        it('should create a couchdb database for each database name in the provided array', function(done) {
            var databaseNames = ['database1', 'database2', 'database3'];

            // call the method
            couchInit.createDatabases(couchUrl, databaseNames)
                .catch(console.error.bind(console));

            // expect a request for each database
            databaseNames.forEach(function(databaseName) {
                var expectedRequestOptions = {
                    url: couchUrl + '/' + databaseName,
                    method: 'PUT'
                };
                expect(requestPromise).toHaveBeenCalledWith(expectedRequestOptions);
            });

        done();
        });
    });

});
