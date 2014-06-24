/* jslint node: true */
'use strict';

/*
* @name /speedTest.js
* @description Runs tests at www.webpagestest
* @since Thu Jun 27 2014
* @author Luke Frake <luke.frake@holidayextras.com>
*/

// Go and get webpage test
var WebPageTest = require( 'webpagetest' );
// Go and get Mongoose
var mongoose = require( 'mongoose' );
// Go and get Q
var Q = require( 'q' );
// Go and get our config
var config = require( '../json/config.json' );

// Our API key
var apiKey = config.apiKey;
// Lets get WebPageTest
// This is the URL we are going to go and resquest to
var wpt = new WebPageTest( config.testServer, apiKey );

// Log our data to mongo with mongoose
function logData( data ) {

	// Tell it our database
	mongoose.connect( config.databaseUrl );
	var db = mongoose.connection;

	// We're going to use this
	var date = Date.now();
	// Connect to our database
	db.once('open', function callback () {

		// Set up our Schema
		var speedTestResultsSchema = new mongoose.Schema({
			testId: { type: String, index: true }, //data.testId
			site: String, //data.testUrl
			summary: String, //data.summary
			completed: { type: Date, index: true }, //data.completed, type: date
			averageTTFB: String, //data.average.repeatView.TTFB,
			averageLoadTime: String, //data.average.repeatView.loadTime,
			averageFullLoaded: String, //data.average.repeatView.fullyLoaded,
		}, {collection: 'speedTestResults'});

		// We don't want to index everything
		speedTestResultsSchema.set( 'autoIndex', false );

		// Instatitate our results
		var speedTestResults = mongoose.model( 'speedTestResults', speedTestResultsSchema );

		// Define whats going to fill our data
		var siteSpeedData = new speedTestResults({
			testId: data.testId,
			site: data.testUrl,
			summary: data.summary,
			completed: date,
			averageTTFB: data.average.repeatView.TTFB,
			averageLoadTime: data.average.repeatView.loadTime,
			averageFullLoaded: data.average.repeatView.fullyLoaded,
		});

		// Lets tell the screen whats going on
		if ( data && data.testUrl ) {
			console.log( 'saving ' + data.testUrl )
		}

		// Now we have it all sorted, lets save it
		siteSpeedData.save( function( err, siteSpeedData ) {
			// If it goes wrong, lets shout about it
			if ( err ) return console.error( err );
			// Now we have saved it, lets read it to make sure its there
			speedTestResults.find( function( err, speedData ) {
				// If it goes wrong lets shout about it
				if ( err ) return console.error( err );
				// Lets tell the screen what comes back from our read
				console.log( require( 'util' ).inspect( speedData, { depth: null } ) );
				// // Close the connection
				db.close();
			});
		});

	});

}

function requestData( sites ) {
	var promise_chain = Q.fcall(function(){});
	console.log('Start setting up the promises')

	for ( var key in sites ) {

		console.log( sites[key] + ' site')

		var promise_link = function() {
			var deferred = Q.defer();
			var currentSite = sites[key];

			console.log( currentSite + ' inner loop site')

			wpt.runTest( currentSite, {pollResults: 30, pageSpeed: true, runs: 1}, function( err, data, key1, result ) {
				// Make sure we have some data
				if ( data && data.response.data ) {
					var data = data.response.data;
				// Try and send the data to mongo
				try {
					console.log( 'alright, we have response from ' + data.testUrl + ' lets track it!' );
				//logData( data ); // We have data, lets log it
				deferred.resolve( data );
				} catch ( e ) {
					console.log ( data.testUrl + ' has failed' );
				console.log( e ); // oh no! something went wrong, lets tell the screen
				}
				} else {
					console.log( 'Uh-Oh! No data!' );
				}
			});
			return deferred.promise;
		};

		promise_chain = promise_chain.then(promise_link);

	}

}

// Lets go and get our data
// function requestData() {
// 	var results = [];
// 	// Loop over everything from our config
// 	for ( var key in config.sites ) {
// 		console.log( 'testing ' + config.sites[key] )
// 		// Send our site off to WPT
// 		wpt.runTest( config.sites[key], {pollResults: 30, pageSpeed: true, runs: 1}, function( err, data, key ) {
// 			// Make sure we have some data
// 			if ( data && data.response.data ) {
// 				var data = data.response.data;
// 				// Try and send the data to mongo
// 				try {
// 					console.log( 'alright, we have response from ' + data.testUrl + ' lets track it!' );
// 					logData( data ); // We have data, lets log it
// 				} catch ( e ) {
// 					console.log ( data.testUrl + ' has failed' );
// 					console.log( e ); // oh no! something went wrong, lets tell the screen
// 				}
// 			} else {
// 				console.log( 'Uh-Oh! No data!' );
// 			}
// 		});
// 	}
// }

// Lets try and get some data
try {
	requestData( config.sites );
} catch ( e ) {
	console.log( e ); // oh no! something went wrong, lets tell the screen
}