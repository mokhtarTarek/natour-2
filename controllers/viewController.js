const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');

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

exports.getTour = catchAsync(async (req, res) => {
	const tour = await Tour.findOne({ slug: req.params.slug })
		.populate({
			path: 'reviews',
			fields: 'review rating user', //selected fields
		})
		.populate('guides');
	/*if(!tour){
		return next(new Ap)
	}*/
	// 3) render the template (pug file) passing in one tour as data

	res.status(200).render('tour', {
		title: `${tour.name} Tour`,
		tour,
	});
});
