const ErrorApp = require('../utils/errorApp');
const catchAsync = require('../utils/catchAsync');
const ApiFeatures = require('../utils/ApiFeatures');

exports.deleteOne = (Model) =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.findByIdAndDelete(req.params.id);

		if (!doc) {
			return next(new ErrorApp(`no document found with this ID`, 404));
		}
		res.status(204).json({
			status: 'sucsess',
			data: {
				data: null,
			},
		});
	});

exports.updateOne = (Model) =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		});
		if (!doc) {
			return next(new ErrorApp(`no document found with this ID`, 404));
		}
		res.status(200).json({
			status: 'sucsess',
			data: {
				data: doc,
			},
		});
	});

exports.createOne = (Model) =>
	catchAsync(async (req, res, next) => {
		const newDoc = await Model.create(req.body);

		res.status(201).json({
			status: 'sucsess',
			data: {
				data: newDoc,
			},
		});
	});

exports.getOne = (Model, popOptions) =>
	catchAsync(async (req, res, next) => {
		let query = Model.findById(req.params.id);
		if (popOptions) query = query.populate(popOptions);
		const doc = await query;

		if (!doc) {
			return next(new ErrorApp(`no document found with this ID`, 404));
		}

		res.status(200).json({
			status: 'sucsess',
			data: {
				data: doc,
			},
		});
	});

exports.getAll = (Model) =>
	catchAsync(async (req, res, next) => {
		//TO ALLOW FOR BESTED GET REVIEW ON TOUR
		let filter = {};
		if (req.params.tourId) filter = { tour: req.params.tourId };
		// EXECUTE THE QUERY
		const features = new ApiFeatures(Model.find(), req.query)
			.filter()
			.limit()
			.sort()
			.paginate();
		//WAITING FOR THE QUERY RESULT
		/*const doc = await features.query.explain();*/
		const doc = await features.query;

		// SENDING RESPONSE
		res.status(200).json({
			status: 'sucsess',
			requestAT: req.reqTime,
			result: doc.length,
			data: {
				data: doc,
			},
		});
	});
