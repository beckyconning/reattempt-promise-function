describe('couch-init', function() {
    var couchInit;
    var requestPromise;
    var requests;
    var resolveRequests;
    var rejectRequests;
    var Q = require('q');
    var proxyquire = require('proxyquire');
    var couchUrl = "http://example.com";

    // create and spy on request-promise mock
    beforeEach(function() {
        var mock = {};
        requests = [];

        // mock requestPromise
        mock.requestPromise = function() {
            requestDeferred = Q.defer();
            requests.push(requestDeferred);
            return requestDeferred.promise;
        }; 

        // spy on mock requestPromise
        spyOn(mock, 'requestPromise').andCallThrough();
        requestPromise = mock.requestPromise;

        // helper methods to settle mock requests 
        resolveRequests = function(requests) { 
            if (requests.length > 0) {
                requests.pop().resolve('Couchdb response');
                resolveRequests(requests);
            }
            else return true;
        };

        rejectRequests = function(requests) { 
            if (requests.length > 0) {
                requests.pop().reject(0); // http unreachable
                rejectRequests(requests);
            }
            else return true; 
        };

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
            var delay = 0;
            var attempts = 3;
            var expectedRequestOptions = {
                url: couchUrl,
                method: 'GET'
            };

            var expectCorrectRequests = function() {
                expect(requestPromise.calls.length).toEqual(3); 
                expect(requestPromise.calls[0].args[0]).toEqual(expectedRequestOptions);
                expect(requestPromise.calls[1].args[0]).toEqual(expectedRequestOptions);
                expect(requestPromise.calls[2].args[0]).toEqual(expectedRequestOptions);
            };

            var rejectNextRequest = function() {
                rejectRequests(requests);
            };
 
            couchInit.waitForStart(couchUrl, delay, attempts)
                .then(null, expectCorrectRequests, rejectNextRequest)
                .then(done)
                .catch(console.error.bind(console));

            rejectRequests(requests);

            rejectNextRequest();
        });

        it('it should wait the supplied delay between attempts', function(done) {
            var delay = 25;
            var attempts = 2;
            var timeBeforeRequest = new Date().getTime();

            var expectDelayAndRejectNextRequest = function() {
                var timeAfterRequest = new Date().getTime();
                var timeDifference = timeAfterRequest - timeBeforeRequest; 
                expect(timeDifference).toBeGreaterThan(delay - 1);
                expect(timeDifference).toBeLessThan(delay + 100);
                timeBeforeRequest = timeAfterRequest;
                rejectRequests(requests);
            };

            couchInit.waitForStart(couchUrl, delay, attempts)
                .then(null, done, expectDelayAndRejectNextRequest)
                .catch(console.error.bind(console));

            rejectRequests(requests);

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
