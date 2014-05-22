describe('couch-init', function() {
    var couchInit;
    var requestPromise;
    var requests;
    var resolveRequests;
    var rejectRequests;
    var RSVP = require('rsvp');
    var proxyquire = require('proxyquire');
    var couchUrl = "http://example.com";

    // create and spy on request-promise mock
    beforeEach(function() {
        var mock = {};
        requests = [];

        // mock requestPromise
        mock.requestPromise = function() {
            requestDeferred = RSVP.defer();
            requests.push(requestDeferred);
            return requestDeferred.promise;
        }; 

        // spy on mock requestPromise
        spyOn(mock, 'requestPromise').andCallThrough();
        requestPromise = mock.requestPromise;

        // helper methods to settle mock requests 
        resolveRequests = function(requests) { 
            if(requests.length > 0)
                requests.pop().resolve('Couchdb response');
            else return requests;
        };

        rejectRequests = function(requests) { 
            if(requests.length > 0)
                requests.pop().reject(0); // http unreachable
            else return requests;
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

            resolveRequests(requests);
            done();
        }); 
    });

    describe('waitForCouch', function() {
        it('should return a promise', function() {
            var promise = couchInit.waitForCouch(couchUrl);
            expect(promise.then).toBeDefined();
        });    

        it('should try to get couch info the supplied number of times', function(done) {
            var timeout = 1;
            var attempts = 3;
            var expectedRequestOptions = {
                url: couchUrl,
                method: 'GET'
            };

            var expectCouchInfoToHaveBeenRequestedThisManyTimes = function expectCouchInfoToHaveBeenRequestedThisManyTimes(times) {
                console.log();
                if (times > 0) {
                    expect(requestPromise.calls[times - 1].args[0]).toEqual(expectedRequestOptions);
                    expectCouchInfoToHaveBeenRequestedThisManyTimes(times - 1); 
                }
                else return true;
            };
 
            couchInit.waitForCouch(couchUrl, timeout, attempts)
                .then(null, function() {
                    expect(requestPromise.calls.length).toEqual(attempts);
                    expectCouchInfoToHaveBeenRequestedThisManyTimes(attempts);
                })
                .then(done)
                .catch(console.error.bind(console));
            
            rejectRequests(requests);
        });

        it('it should wait the supplied timeout between attempts', function(done) {
            var timeout = 25;
            var attempts = 2;

            jasmine.Clock.useMock() 
           
            couchInit.waitForCouch(couchUrl, timeout, attempts)
                .catch(console.error.bind(console));
            
            // flush first request
            rejectRequests(requests.splice(0,1));

            expect(requestPromise.calls.length).toEqual(1);

            jasmine.Clock.tick(timeout);

            expect(requestPromise.calls.length).toEqual(2);

            done();
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

            // flush the request
            resolveRequests(requests);

	    done();
        });
    });

});
