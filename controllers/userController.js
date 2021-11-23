const User = require('./../models/userModel');
const catchAsync = require('../utils/catchAsync');
const errorApp = require('./../utils/errorApp');

const filterObj = (body, ...allawedField) => {
  //rest params ['name','email']
  const newObj = {};

  //create object with body keys and loop throught it
  //if the resrParams array includes the object key then add the param to the new object
  Object.keys(body).forEach((el) => {
    if (allawedField.includes(el)) {
      newObj[el] = body[el];
    }
  });

  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // check if user is not updating the password
  if (req.body.password || req.body.passwordConfirm) {
    return next(new errorApp('this route is not for password update', 400));
  }

  // update current user data
  //filtred out unwanted property that not allawed to be ubdated
  const filtredBody = filterObj(req.body, 'name', 'email');

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

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not fefined',
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not fefined',
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not fefined',
  });
};
exports.deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return next(new ErrorApp(`no user found with that ID`, 404));
  }
  res.status(204).json({
    status: 'sucsess',
    data: {
      user: null,
    },
  });
};
