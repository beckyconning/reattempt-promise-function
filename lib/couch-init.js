var requestPromise = require('request-promise');
var Q = require('q');
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
    return Q.all(requestPromises);
};

CouchInit.prototype.waitForStart = function waitForStart(couchUrl, delay, attemptsLeft) {
    var options = { 
        url: couchUrl,
        method: 'GET'
    };
    return Q.Promise(function(resolve, reject, notify) {
        var attempt = function attempt() {
             requestPromise(options)
                 .then(function(response) { 
                         resolve(response);
                 }, 
                 function(status) {
                     attemptsLeft = attemptsLeft - 1;
                     if (attemptsLeft > 0) {
                         Q.delay(delay).then(function() {
                             notify(status);
                             attempt(); 
                         });
                     }
                     else reject();
                 });
        };
        attempt();
    });
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
    return Q.all(requestPromises);
};

module.exports = new CouchInit();
