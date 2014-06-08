#!/usr/bin/env node
var couchInit = require('./lib/couch-init');
var couchUrl = process.argv[2];
var couchConfig = {
    httpd: {
        enable_cors: 'true'
    },
    cors: {
        origins: '*',
        credentials: 'true'
    }
};
var couchDatabases = ['presentations'];

if (typeof couchUrl !== 'undefined') {
    couchInit.waitForStart(couchUrl, 100, 60)
    .then(function() {
        couchInit.configure(couchUrl, couchConfig)
            .then(function() {
                console.log('Finished configuration');
            })
            .catch(console.error.bind(console));

        couchInit.createDatabases(couchUrl, couchDatabases)	
            .then(function() {
                console.log('Finished creating databases');
            })
            .catch(console.error.bind(console));
    })
    .catch(function() {
        console.log('Couldn\'t connect to CouchDB');
    });
}
else {
    console.log('Usage: couch-init http://couchUrl');
}
