const multer = require('multer');
const jimp = require('jimp');
const User = require('./../models/userModel');
const catchAsync = require('../utils/catchAsync');
const errorApp = require('./../utils/errorApp');
const handlerFactory = require('./handlerFactory');

/*const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});*/

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
/*const upload = multer({ dest: 'public/img/users' });*/

exports.uploadUserPhoto = upload.single('photo');

exports.reseizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  //this bullshit lib is not working in linux
  /*await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 50 })
    .toFile(`public/img/users/${req.file.filename}`);*/

  const img = await jimp.read(req.file.buffer);
  img
    .resize(256, 256) // resize
    .quality(60) // set JPEG quality
    //.greyscale() // set greyscale
    .write(`public/img/users/${req.file.filename}`); // save

  next();
});

// FILTER THE BODY############
const filterObj = (body, ...allawedField) => {
  //rest params ['name','email']
  const newObj = {};
  //create object with body keys and loop throught it
  Object.keys(body).forEach((el) => {
    if (allawedField.includes(el)) {
      newObj[el] = body[el];
    }
  });

  return newObj;
};

// a MD to get the current logedin user without specifying the id as a params
exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //console.log(req.file);
  // check if user has not updating the password
  if (req.body.password || req.body.passwordConfirm) {
    return next(new errorApp('this route is not for password update', 400));
  }

  // update current user data
  //filtred out unwanted property that not allawed to be ubdated
  const filtredBody = filterObj(req.body, 'name', 'email');
  // add photo prop to the filtred body
  if (req.file) filtredBody.photo = req.file.filename;
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filtredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});
exports.deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: 'success',
  });
});
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not defined / please use signup unstead',
  });
};

exports.getAllUsers = handlerFactory.getAll(User);
exports.getUser = handlerFactory.getOne(User);

// DO NOT UPDATE USER PASSWORD WITH THIS : findByIdAndUpdate will not invoke models middlewares
exports.updateUser = handlerFactory.updateOne(User);
exports.deleteUser = handlerFactory.deleteOne(User);
