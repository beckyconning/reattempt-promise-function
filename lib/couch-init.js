var requestPromise = require('request-promise');
var Promise = require('bluebird');
var async = require('async');

var CouchInit = function() {};

CouchInit.prototype.configure = function(couchUrl, configuration) {
    var couchConfigUrl = couchUrl + '/_config';
    var requestPromises = [];
    
    Object.keys(configuration).forEach(function(sectionKey) {
        var section = configuration[sectionKey];
        async.each(Object.keys(section), function(optionKey) {
            var option = section[optionKey];
            var url = couchConfigUrl + '/' + sectionKey + '/' + optionKey;
            var options = {
                url: url,
                method: 'PUT',
                json: true,
                body: JSON.stringify(option)
            };
            var configurationOptionPutRequest = requestPromise(options);
            requestPromises.push(configurationOptionPutRequest);
        });
    });
    return Promise.all(requestPromises);
};

CouchInit.prototype.waitForStart = function waitForStart(couchUrl, delay, attemptsLeft) {
    var couchInit = this;
    var options = { 
        url: couchUrl,
        method: 'GET'
    };

    return requestPromise(options)
        .then(null, function(status) {
            if (attemptsLeft <= 1) 
                return Promise.reject("Couldn't connect to CouchDB: " + status);
            else 
                return Promise.delay(delay)
                    .then(function() {
                            return couchInit.waitForStart(couchUrl, delay, attemptsLeft - 1);
                    });
        })
};

CouchInit.prototype.createDatabases = function(couchUrl, namesOfDatabasesToCreate) {
    var requestPromises = [];

    async.each(namesOfDatabasesToCreate, function(databaseName) {
        var databaseUrl = couchUrl + '/' + databaseName;
        var options = {
            url: databaseUrl,
            method: 'PUT'
        };
        var databaseCreationRequest = requestPromise(options);
        requestPromises.push(databaseCreationRequest);
    });
    return Promise.all(requestPromises);
};

module.exports = new CouchInit();
