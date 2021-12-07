const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'a user should have a name'],
  },
  email: {
    type: String,
    required: [true, 'a user should have an email'],
    unique: true,
    validate: [validator.isEmail, 'please provide a valid email'],
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'a user should have a name'],
    minLength: 8,
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    dafault: 'user',
  },
  passwordConfirm: {
    type: String,
    required: [true, 'please confirm your password'],
    validate: {
      //THIS WORK ONLY ON CREATE AND SAVE NOT UPDATE !!
      validator: function (el) {
        //custom validator el is the current field
        return el === this.password; //this refer to this doc (model)
      },
      message: 'password are not the same!',
    },
  },
  passwordchangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// pre: mongoose middleware become just before saving to database

userSchema.pre('save', async function (next) {
  //if the password is not changed then return
  if (!this.isModified('password')) return next();
  //hash the password
  this.password = await bcrypt.hash(this.password, 8);
  //delete the confirm password
  this.passwordConfirm = undefined;
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordchangedAt = Date.now() - 1000;
  next();
});

// this method will be executed before every query start with find
userSchema.pre(/^find/, function (next) {
  //this point to the current query
  this.find({ active: { $ne: false } });
  next();
});

//instance method : available with the document
userSchema.methods.correctPassword = async function (
  condidatePassword, //form the request body
  password //form the database
) {
  return await bcrypt.compare(condidatePassword, password);
};

//IF USER CHANGES PASSWORD THE PREVIOUS TOKEN SHOULD BE ABONDONNED
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordchangedAt) {
    const changedTimestamp = parseInt(
      this.passwordchangedAt.getTime() / 1000,
      10
    ); //same format of decoded token iat

    return JWTTimestamp < changedTimestamp; //
  }
  return false;
};

//GENERATE RESET TOKEN TO SENDING IT TO THE USER EMAIL
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  console.log({ resetToken }, this.passwordResetToken);
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
