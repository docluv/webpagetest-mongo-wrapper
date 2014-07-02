/* jslint node: true */
'use strict';

/*
* @name /speedTest.js
* @description Runs tests at www.webpagestest
* @since Thu Jun 27 2014
* @author Luke Frake <luke.frake@holidayextras.com>
*/

/* Go and get everything we require */
var WebPageTest = require( 'webpagetest' ),
		mongoose = require( 'mongoose' ),
		Q = require( 'q' ),
		config = require( '../json/config.json' ),
		wpt = new WebPageTest( config.testServer, config.apiKey ),
		_ = require( 'lodash' );

/* Set up our Schema */
var speedTestResultsSchema = new mongoose.Schema( {
	testId: { type: String, index: true }, /*data.testId */
	site: String, /*data.testUrl */
	summary: String, /*data.summary */
	completed: { type: Date, index: true }, /*data.completed, type: date */
	averageTTFB: String, /*data.average.repeatView.TTFB, */
	averageLoadTime: String, /*data.average.repeatView.loadTime, */
	averageFullLoaded: String, /*data.average.repeatView.fullyLoaded, */
}, { collection: 'speedTestResults' } );

/* We don't want to index everything */
speedTestResultsSchema.set( 'autoIndex', false );

/* Instatitate our results */
var speedTestResults = mongoose.model( 'speedTestResults', speedTestResultsSchema );

/* Log our data to mongo with mongoose */
function logData( data ) {

	/* Tell it our database */
	mongoose.connect( config.databaseUrl );
	var db = mongoose.connection;

	/* We're going to use this */
	var date = Date.now();

	/* Connect to our database */
	db.once( 'open', function callback () {

		/* We have some data, lets give it a go at telling the database */
		try {

			/* Define whats going to fill our data */
			var siteSpeedData = new speedTestResults( {
				testId: data.testId,
				site: data.testUrl,
				summary: data.summary,
				completed: date,
				averageTTFB: data.average.repeatView.TTFB,
				averageLoadTime: data.average.repeatView.loadTime,
				averageFullLoaded: data.average.repeatView.fullyLoaded,
			} );

			/* Lets tell the screen whats going on */
			if ( data && data.testUrl ) {
				outputLog( 'saving ' + data.testUrl )
			}

			/* Now we have it all sorted, lets save it */
			siteSpeedData.save( function( err, siteSpeedData ) {
				/* If it goes wrong, lets shout about it */
				if ( err ) return console.error( err );
				outputLog( siteSpeedData ); /* We have some data, lets tell the screen */

				/* Close the connection */
				db.close();
			});

		} catch ( e ) {
			outputLog( data.testUrl + ' has failed' );
			outputLog( e ); /* oh no! something went wrong, lets tell the screen */

			/* Close the connection */
			db.close();
		}


	});

}

function requestData( config ) {
	/* Lets make somewhere to put all our promises */
	var promiseChain = Q.fcall( function() {} );
	outputLog( 'Start setting up the promises' );

	/* Loop over our sites building our promises */
	for ( var key in config.sites ) {
		( function( key ) {

			/* Easier to read */
			var currentSite = config.sites[key];
			outputLog( currentSite + ' site');

			/* Set up whats going to happen in our promise */
			var promiseLink = function() {
				var deferred = Q.defer();

				/* wpt changes some of the values in here, so lets take a copy of it */
				var webPageTestOptions = _.cloneDeep( config.webPageTestOptions );

				outputLog( currentSite + ' inner loop site' );

				/* Run our request off to WPT */
				wpt.runTest( currentSite, webPageTestOptions, function( err, data ) {
					/* Make sure we have some data */
					if ( data && data.response.data ) {
						var data = data.response.data;
						/* Try and send the data to mongo */
						try {
							/* If all goes to plan, lets log some data */
							outputLog( 'alright, we have response from ' + data.testUrl + ' lets track it!' );
							logData( data ); /* We have data, lets log it */
						} catch ( e ) {
							/* If it failes, lets cry about it */
							outputLog( data.testUrl + ' has failed' );
							outputLog( e ); /* oh no! something went wrong, lets tell the screen */
						}
						/* Always move onto the next test, or this will never end! */
						deferred.resolve( data );
					} else {
						outputLog( 'Uh-Oh! No data!' );
					}
				});
				return deferred.promise;
			};

			promiseChain = promiseChain.then( promiseLink );

		} )( key );

	}

}

/**
* Overridden console.log, we can then push info to a log bin if required
* @description uses the arguments array
*/
function outputLog( ) {
	console.log.apply( console, ['WebpageTestWrapper Debug:', [].slice.call( arguments )] );
};

/* Lets try and get some data */
requestData( config );