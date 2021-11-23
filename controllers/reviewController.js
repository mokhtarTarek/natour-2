const catchSync = require('./../utils/catchAsync');
const Review = require('./../models/reviewModel');

exports.createReview = catchSync(async (req, res, next) => {
	if (!req.body.tour) req.body.tour = req.params.tourId;
	if (!req.body.user) req.body.user = req.user.id; //come from protect middleware
	const review = await Review.create(req.body);
	res.status(201).json({
		status: 'success',
		data: {
			review,
		},
	});
});

exports.getAllReviews = catchSync(async (req, res, next) => {
	let filter = {};
	if (req.params.tourId) filter = { tour: req.params.tourId };

	const reviews = await Review.find(filter);
	res.status(201).json({
		status: 'success',
		reviews: reviews.length,
		data: {
			reviews,
		},
	});
});
