var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var db = mongoose.connection;

db.once( 'open', function callback () {

	var speedData = new Schema( {
		testId: { type: [String], index: true }, //data.testId
		site: String, //data.testUrl
		summary: String, //data.summary
		completed: { type: Date, index: true }, //data.completed, type: date
		averageTTFB: String, //data.average.repeatView.TTFB,
		averageLoadTime: String, //data.average.repeatView.loadTime,
		averageFullLoaded: String, //data.average.repeatView.fullyLoaded,
	} );

	var testResults = mongoose.model( 'speedData', speedData );

	mongoose.connect( 'mongodb://localhost/speedResults' );

	var test = new speedData( {
		testId: 'someTesting',
	} );

	testResults.save( function( err, test ) {
		if ( err ) return console.error( err );
		console.dir( test );
	});

	// Find all movies.
	testResults.find(function(err, movies) {
		if (err) return console.error(err);
		console.dir(movies);
	});


});