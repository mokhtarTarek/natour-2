const express = require('express');
const router = express.Router();
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
/*const reviewController = require('../controllers/reviewController');*/
const reviewRouter = require('./reviewRoutes');

/*// NESTED ROUTES
router
	.route('/:tourId/reviews')
	.post(
		authController.protect,
		authController.restrictTo('admin', 'user'),
		reviewController.createReview
	);*/

//redirect to review router and use mergeParams there to acess this tourId param
router.use('/:tourId/reviews', reviewRouter);

router
	.route('/')
	.get(tourController.getAllTours)
	.post(
		authController.protect,
		authController.restrictTo('admin', 'lead-guide'),
		tourController.createTour
	);

router
	.route('/top-5-cheap')
	.get(tourController.aliasTopCheap, tourController.getAllTours);

router
	.route('/tour-stats')
	.get(
		authController.protect,
		authController.restrictTo('admin', 'lead-guide', 'guide'),
		tourController.getToursStats
	);

router.route('/monthly-plan/:year').get(tourController.getMonthlytPlan);

router
	.route('/:id')
	.get(tourController.getTour)
	.patch(
		authController.protect,
		authController.restrictTo('admin', 'lead-guide'),
		tourController.uploadTourImages,
		tourController.reseizeTourPhoto,
		tourController.updateTour
	)
	.delete(
		authController.protect,
		authController.restrictTo('admin', 'lead-guide'),
		tourController.deleteTour
	);

router
	.route('/tours-within/:distance/center/:latlng/unit/:unit')
	.get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

module.exports = router;
