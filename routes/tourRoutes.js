const express = require('express');
const router = express.Router();
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
/*const reviewController = require('../controllers/reviewController');*/
const reviewRouter = require('./reviewRoutes');

//redirect to review router and use mergeParams there to acess this tourId param
router.use('/:tourId/reviews', reviewRouter);

router
	.route('/')
	.get(authController.protect, tourController.getAllTours)
	.post(tourController.createTour);

router
	.route('/top-5-cheap')
	.get(tourController.aliasTopCheap, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getToursStats);

router.route('/monthly-plan/:year').get(tourController.getMonthlytPlan);

router
	.route('/:id')
	.get(tourController.getTour)
	.patch(tourController.updateTour)
	.delete(
		authController.protect,
		authController.restrictTo('admin', 'lead-guide'),
		tourController.deleteTour
	);

/*// NESTED ROUTE
router
	.route('/:tourId/reviews')
	.post(
		authController.protect,
		authController.restrictTo('admin', 'user'),
		reviewController.createReview
	);*/
module.exports = router;
