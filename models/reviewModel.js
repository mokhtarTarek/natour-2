// review rating createdAt ref to tour ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
	{
		review: {
			type: String,
			required: [true, 'review should be not empty'],
		},
		rating: {
			type: Number,
			max: 5,
			min: 1,
		},
		createdAt: {
			type: Date,
			default: Date.now(),
		},
		tour: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Tour',
			required: [true, 'review must belong to a tour'],
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'review must belong to user'],
		},
	},
	//virtual property:
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

//PREVENTING DUPLICATE REVIEW : EACH USER CAN MAKE ONE REVIEW FOR A SINGLE TOUR
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
	/*this.populate({
		path: 'tour',
		select: 'name',
	}).populate({
		path: 'user',
		select: 'name',
	});*/
	this.populate({
		path: 'user',
		select: 'name photo',
	});

	next();
});

//USING STATIC AGREGATE METHOD TO UPDATE THE AVERAGE RATING WHEN NEW REVIEW IS CREATED
reviewSchema.statics.calcAverageRatings = async function (tourId) {
	//take the tour field : Id of the tour
	const stats = await this.aggregate([
		{
			$match: { tour: tourId }, //match the specified tour
		},
		{
			$group: {
				_id: '$tour',
				nRating: { $sum: 1 }, //add one for each tour to get the rating quantity
				avgRating: { $avg: '$rating' }, //calc the average ratings based on the rating field
			},
		},
	]);
	console.log(stats);

	if (stats.length > 0) {
		await Tour.findByIdAndUpdate(tourId, {
			ratingsQuantity: stats[0].nRating,
			ratingsAverage: stats[0].avgRating,
		});
	} else {
		await Tour.findByIdAndUpdate(tourId, {
			ratingsQuantity: 0,
			ratingsAverage: 4.5, //default rating
		});
	}
};

//the calculation is performed after the review was saved
reviewSchema.post('save', function () {
	//this point to current review
	this.constructor.calcAverageRatings(this.tour);
});

//UPDATING AVERAGE RATING WHEN THE REVIEW IS UPDATED OR DELETED
//pre() happend after the query is executed and before the doc is saved in the DB
reviewSchema.pre(/^findOneAnd/, async function (next) {
	//this point to the current mongo query
	this.r = await this.findOne(); //store the document in a variable to calc the average next
	console.log(this.r);
	next();
});

reviewSchema.post(/^findOneAnd/, async function () {
	await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
