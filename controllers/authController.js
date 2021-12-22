const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const errorApp = require('../utils/errorApp');
const Email = require('../utils/email');

//--------------------------------------------------------HELPER FUNCTIONS
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_IN,
  });
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIES_EXPIRE_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  //sended only with https
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  //remove the password from the output
  user.password = undefined;

  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
//-------------------------------------------------------------------------

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  //SEND WELCOME IN USER REGISTRATION
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createAndSendToken(newUser, 200, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //console.log(email, password);
  if (!email || !password) {
    return next(new errorApp('please provid user and password', 400));
  }

  //password field is not selected by default in the model : we need to use select method
  const user = await User.findOne({ email }).select('+password');

  //IF USER IS FALSY OR BCRYPT.COMPARE RETURN FALSE
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new errorApp('incorrect email or password', 401)); //unauthorized
  }

  createAndSendToken(user, 200, res);
});

exports.logOut = (req, res) => {
  res.cookie('jwt', 'logout', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

//##################### PROTECT ROUTE :ONLY FOR LOGIN IN #############################

exports.protect = catchAsync(async (req, res, next) => {
  //check if token exist
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new errorApp('please log in ', 401));
  }

  // CHECK IF USER STILL EXIST

  //promisify :turn an async function with callback to a promisify function

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //console.log(decoded);
  const currentUser = await User.findById(decoded.id);

  //console.log(currentUser);
  if (!currentUser) {
    return next(new errorApp('the user no longer exist', 401));
  }

  //check if user change password after token essu :so user must login again
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new errorApp('Password has been changed please login again', 401)
    );
  }
  req.user = currentUser;
  res.locals.user = currentUser; //locals will be accessible by every pug templates
  next();
});

//########################## CHECK IF LOGGED IN FOR EVERY REQUEST ##################
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //1) VERIFY COOKIES
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //2) CHECK IF USER STILL EXIST
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      //3) CHECK IF USER CHANGE PASSWORD AFTER TOKEN ESSUED :SO USER MUST LOGIN AGAIN
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      //A USER EXIST
      res.locals.user = currentUser; //locals will be accessible by every pug templates
      return next();
    } catch {
      return next();
    }
  }
  next(); //in case if no cookies
};
//#############################################################################

exports.restrictTo = (...roles) => {
  //roles ('admin','lead-guide'),
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new errorApp('you do not have permission', 403));
    }
    next();
  };
};

//---------------------------------------------------------------
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) get user based on email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new errorApp('no user exist with this email', 404));
  }

  //2) create reset token
  const resetToken = user.createPasswordResetToken();
  // avoid validator
  await user.save({ validateBeforeSave: false });

  //3) send reset token

  /*const message = `forgot your password ? submit a patch with your new password
  and password confirm to this ${resetURL}`;*/

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    /*await sendEmail({
      email: user.email,
      message,
      subject: 'your email reset token',*/
    /*});*/
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'seccess',
      massage: 'reset token sended to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: true });
    return next(new errorApp(err, 500));
  }
});

//---------------------------------------------------------------RESET PASSWORD

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the reset token
  const hachedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hachedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new errorApp('token is not valid or expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createAndSendToken(user, 200, res);
});

//---------------------------------------------------------------UPADATE PASSWORD

exports.updatePassword = catchAsync(async (req, res, next) => {
  // this middleware become after protect middleware : so req.user already has the user.id
  const user = await User.findById(req.user._id).select('+password');

  // check if posted password is equivalent to user password in the database

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new errorApp('current password is wrong', 401)); //unauthorized
  }

  // update the password

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // FINDBYIDANUPDATE WILL NOT WORK AS INTENDED !!!!!!!

  // login user and send JWT

  createAndSendToken(user, 200, res);
});

//---------------------------------------------------------------UPADATE PASSWORD
