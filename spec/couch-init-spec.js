// should the it tests have more technical descriptions? 
// is it important to test graceful responses to invalid arguments if you are using promises?
// anthing else?
// thanks! : )

describe('couch-init', function() {
    var couchInit;
    var requestPromise;
    var requestDeferreds;
    var flushRequests;
    var RSVP = require('rsvp');
    var proxyquire = require('proxyquire');
    var couchUrl = "http://example.com";

    // create and spy on request-promise mock
    beforeEach(function() {
        var mock = {};
        requestDeferreds = [];

        // mock requestPromise
        mock.requestPromise = function() {
            requestDeferred = RSVP.defer();
            requestDeferreds.push(requestDeferred);
            return requestDeferred.promise;
        }; 

        // spy on mock requestPromise
        spyOn(mock, 'requestPromise').andCallThrough();
        requestPromise = mock.requestPromise;

        // helper method to complete mock requests 
        flushRequests = function() {
            requestDeferreds.forEach(function(deferred) {
                deferred.resolve('Couch response');
            });
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

            var expectRequestsToHaveBeenMadeCorrectlyForEachOption = function() {
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
            };

            // call the method
            couchInit.configure(couchUrl, configuration)
                .then(expectRequestsToHaveBeenMadeCorrectlyForEachOption)
                .then(done)
                .catch(console.error.bind(console));         

            flushRequests();
        }); 
    });

    //describe('waitForCouch', function() {
    //    it('should return a promise', funciton() {
    //        var promise = couchInit.waitForCouch(couchUrl);
    //        expect(promise.then).toBeDefined();
    //    });    

    //    it('should not resolve the promise until couch is available', function(done) {
    //        var expectRequestsToHaveBeenMadeCorrectlyForEachDatabaseName = function() {
    //            databaseNames.forEach(function(databaseName) {
    //                var expectedRequestOptions = {
    //                    url: couchUrl,
    //                    method: 'GET',
    //                };
    //                expect(requestPromise).toHaveBeenCalledWith(expectedRequestOptions);
    //            });
    //        };

    //        // call the method
    //        couchInit.createDatabases(couchUrl, databaseNames)
    //            .then(expectRequestsToHaveBeenMadeCorrectlyForEachDatabaseName)
    //            .then(done)
    //            .catch(console.error.bind(console));
    //    });
    //});

    describe('createDatabases', function() {
        it('should return a promise', function() {
            var configuration = {};
            var promise = couchInit.createDatabases(couchUrl, configuration);
            expect(promise.then).toBeDefined();
        });    

        it('should create a couchdb database for each database name in the provided array', function(done) {
            var databaseNames = ['database1', 'database2', 'database3'];

            var expectRequestsToHaveBeenMadeCorrectlyForEachDatabaseName = function() {
                databaseNames.forEach(function(databaseName) {
                    var expectedRequestOptions = {
                        url: couchUrl + '/' + databaseName,
                        method: 'PUT',
                    };
                    expect(requestPromise).toHaveBeenCalledWith(expectedRequestOptions);
                });
            };

            // call the method
            couchInit.createDatabases(couchUrl, databaseNames)
                .then(expectRequestsToHaveBeenMadeCorrectlyForEachDatabaseName)
                .then(done)
                .catch(console.error.bind(console));

            // flush the request
            flushRequests();
        });
    });

});
