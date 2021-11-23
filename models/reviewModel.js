// review rating createdAt ref to tour ref to user
const mongoose = require('mongoose');

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
		select: 'name',
	});

	next();
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
