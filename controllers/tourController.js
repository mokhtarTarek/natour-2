const multer = require('multer');
const jimp = require('jimp');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const ErrorApp = require('./../utils/errorApp');
const handlerFactory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new errorApp('not an image please upload only images', 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  //name : name of the fields in DB
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);
//upload.single('image')
//upload.array('image',5)
exports.reseizeTourPhoto = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  // 1) image cover
  req.body.imageCover = `tour-${req.params.id}${Date.now()}-cover.jpeg`;
  const img = await jimp.read(req.files.imageCover[0].buffer);
  img
    .resize(2000, 1333) // resize
    .quality(60) // set JPEG quality
    //.greyscale() // set greyscale
    .write(`public/img/tours/${req.body.imageCover}`); // save
  // 2) tour images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}${Date.now()}-${i + 1}.jpeg`;

      const img = await jimp.read(file.buffer);
      img
        .resize(2000, 1333) // resize
        .quality(60) // set JPEG quality
        //.greyscale() // set greyscale
        .write(`public/img/tours/${filename}`); // save

      req.body.images.push(filename);
    })
  );
  next();
});

exports.aliasTopCheap = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = handlerFactory.getAll(Tour);
exports.getTour = handlerFactory.getOne(Tour, {
  path: 'reviews',
});
exports.createTour = handlerFactory.createOne(Tour);
exports.updateTour = handlerFactory.updateOne(Tour);
exports.deleteTour = handlerFactory.deleteOne(Tour);

///tours-within/:distance/center/:latlng/unit/:unit
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  // convert radius to radiance
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    return next(new ErrorApp('please provide latitude and longtitude', 400));
  }

  const tours = await Tour.find({
    //the startLocation field must be indexedin the tour model
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    return next(new ErrorApp('please provide latitude and longtitude', 400));
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier, //covert from meter to mi or km
      },
    },
    {
      $project: {
        //filter
        distance: 1, //the name of field we want to keep
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});

// ################  MONGOOSE AGREGATION PIPELINE  #########################

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
