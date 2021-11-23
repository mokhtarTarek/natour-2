const express = require('express');
//using merge params :using the tourId form tour router
const router = express.Router({ mergeParams: true });
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

router
	.route('/')
	.get(reviewController.getAllReviews)
	.post(
		authController.protect,
		authController.restrictTo('user', 'admin'),
		reviewController.createReview
	);

module.exports = router;
