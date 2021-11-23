const ApiFeatures = require('./../utils/ApiFeatures');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const ErrorApp = require('./../utils/errorApp');

exports.aliasTopCheap = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  // EXECUTE THE QUERY
  const features = new ApiFeatures(Tour.find(), req.query)
    .filter()
    .limit()
    .sort()
    .paginate();
  //WAITING FOR THE QUERY RESULT
  const tours = await features.query;

  // SENDING RESPONSE
  res.status(200).json({
    status: 'sucsess',
    requestAT: req.reqTime,
    result: tours.length,
    data: {
      tours,
    },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id).populate('reviews');
  //Tour.findOne({_id:req.params.id})

  if (!tour) {
    return next(new ErrorApp(`no tour found with that ID`, 404));
  }

  res.status(200).json({
    status: 'sucsess',
    data: { tour },
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'sucsess',
    data: {
      tour: newTour,
    },
  });

  /*
  create new anstance of the model
  const newTour = new Tour({})
  newTour.save()
  or access the create method of the model itself :
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'sucsess',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
  */
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!tour) {
    return next(new ErrorApp(`no tour found with that ID`, 404));
  }
  res.status(200).json({
    status: 'sucsess',
    data: {
      tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new ErrorApp(`no tour found with that ID`, 404));
  }
  res.status(204).json({
    status: 'sucsess',
    data: {
      tour: null,
    },
  });
});

// MONGOOSE AGREGATION PIPELINE

exports.getToursStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // _id: null,
        _id: { $toUpper: '$difficulty' },
        numTour: { $sum: 1 },
        numRating: { $avg: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: 'sucsess',
    data: {
      stats,
    },
  });
});

exports.getMonthlytPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      //unwind : destructuring by startDates fields
      $unwind: '$startDates',
    },
    {
      //find match in startdates field
      $match: {
        startDates: { $gte: new Date(`${year}-01-01`) },
        startDates: { $lte: new Date(`${year}-12-31`) },
      },
    },
    {
      //group document by specific field
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    //stage to add field
    {
      $addFields: { month: '$_id' },
    },
    //delete field : 0 to hide
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 }, // -1 for decending sort
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: 'success',
    lenght: plan.length,
    data: {
      plan,
    },
  });
});
