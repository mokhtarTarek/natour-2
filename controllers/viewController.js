const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const ErrorApp = require('./../utils/errorApp');

exports.getOverview = catchAsync(async (req, res) => {
	//1) get tours data
	const tours = await Tour.find();
	// 2) build template
	// 3) render the template (pug file) passing in the tours as data
	res.status(200).render('overview', {
		title: 'All tours',
		tours,
	});
});

exports.getTour = catchAsync(async (req, res, next) => {
	const tour = await Tour.findOne({ slug: req.params.slug })
		.populate({
			path: 'reviews',
			fields: 'review rating user', //selected fields
		})
		.populate('guides');
	if (!tour) {
		return next(new ErrorApp('there is no tour with that name', 404));
	}
	// 3) render the template (pug file) passing in one tour as data

	res.status(200).render('tour', {
		title: `${tour.name} Tour`,
		tour,
	});
});

exports.getLoginForm = (req, res) => {
	res.status(200).render('login', {
		title: `Login into your account`,
	});
};

exports.getAccount = (req, res) => {
	res.status(200).render('account', {
		title: `Your account`,
	});
};

exports.getMyTours = catchAsync(async (req, res, next) => {
	// 1) Find all bookings
	const bookings = await Booking.find({ user: req.user.id });

	// 2) Find tours with the returned IDs
	const tourIDs = bookings.map((el) => el.tour);
	const tours = await Tour.find({ _id: { $in: tourIDs } });

	res.status(200).render('overview', {
		title: 'My Tours',
		tours,
	});
});

// UPDATING USER USING URL ENCODING : TRADITIONAL WAY WITHOUT API
/*exports.updateUserData = catchAsync(async (req, res, next) => {
	const updatedUser = await User.findByIdAndUpdate(
		req.user.id,
		{
			name: req.body.name,
			email: req.body.email,
		},
		{
			new: true,
			runValidators: true,
		}
	);
	res.status(200).render('account', {
		title: 'your account',
		user: updatedUser,
	});
});*/
