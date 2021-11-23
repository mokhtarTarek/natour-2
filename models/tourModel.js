const mongoose = require('mongoose');
const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'a tour must have a name !'],
      unique: true,
      trim: true,
      maxLength: [40, 'a tour name must be less or equal then 40 char'],
      minLength: [5, 'a tour name must be greater then 40 char'],
    },
    duration: {
      type: Number,
      required: [true, 'tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'tour must have a groupe size'],
    },
    difficulty: {
      type: String,
      required: [true, 'tour must have a dificulty'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating must be above 1.0'],
      max: [5, 'rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'a tour must have a price !'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // a false result will trigger a validation error
          return val < this.price; //this point to the newly created doc not for updated one
        },
        message: 'priceDiscount ({VALUE}) must be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'a tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'a tour must have an image cover'],
    },
    images: [String],
    cratedAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    /*guides: [],*/
    guides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },

  //virtual property:
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
//reugular function is required when dealing with "this"
tourSchema.virtual('weeksDuration').get(function () {
  return this.duration / 7; //this point to the current doc
});

// VIRTUAL POPULATE
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordchangedAt',
  });
  next();
});

// GET ALL USER INFOS BEFORE SAVING NEW TOUR
/*tourSchema.pre('save', async function (next) {
  // return an array of promises
  const guidesPromises = this.guides.map(async (id) => await User.findById(id));
  this.guides = await Promise.all(guidesPromises);
  next();
});*/
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
