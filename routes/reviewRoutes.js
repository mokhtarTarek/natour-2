const express = require('express');
//using merge params :using the tourId form tour router
const router = express.Router({ mergeParams: true });
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

router.use(authController.protect);
router.route('/').get(reviewController.getAllReviews).post(
	authController.restrictTo('user'), //only regular user can make reviews
	reviewController.setTourUserIds,
	reviewController.createReview
);

router
	.route('/:id')
	.get(reviewController.getReview)
	.patch(
		authController.restrictTo('user', 'admin'),
		reviewController.updateReview
	)
	.delete(
		authController.restrictTo('user', 'admin'),
		reviewController.deleteReview
	);

module.exports = router;
