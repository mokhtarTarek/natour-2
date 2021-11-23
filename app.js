const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit'); //security
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const AppError = require('./utils/errorApp');
const globalErrorController = require('./controllers/errorController');

const app = express();

//------ALL MIDDLEWARES ARE INVOKED FOLLOWING THE MIDDLEWARE STACK ORDER------------

app.use(helmet()); //ADD SOME INFOS TO THE RES HEADERS

// GLOBAL MIDDLEWARES

if (process.env.NODE_ENV === 'developement') {
	app.use(morgan('dev')); //THIRD PARTY MW
}

const limiter = rateLimit({
	max: 100, //see response header
	windowMs: 60 * 60 * 1000,
	message: 'too many request for the same route please try after one hour',
});

// LIMIT THE REQUESTS FROM SINGLE IP
app.use('/api', limiter);

// BODY PARSER
app.use(express.json({ limit: '10kb' })); // BUILT-IN MD

// SANITIZE AAGAINST NOSQL INJECTION
app.use(mongoSanitize());

// SANITIZE AGAINST XSS ATTCK
app.use(xss());

// PREVENTING PARAMS POLLUTION : with exception for some fields
app.use(
	hpp({
		whiteList: [
			'duration',
			'ratingsAverage',
			'ratingsQuantity',
			'maxGroupSize',
			'difficulty',
			'price',
		],
	})
);

// SERVING STATIS FILES
app.use(express.static(`${__dirname}/public`));

// COSTUM MD :READ REQUESTS
app.use((req, res, next) => {
	req.reqTime = new Date().toISOString();
	//console.log(req.headers)
	next();
});

// MOUNTING ROUTERS
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// IF ALL PREVIOUS ROUTES ARE NOT MATCHED
app.all('*', (req, res, next) => {
	//call the next() middlewareStack with error object (extending Error class)
	next(new AppError(`can not find ${req.originalUrl} in this server`, 404));
});

//HANDLE ALL REST ERRORS IN A GLOBAL MIDDLEWARE HANDLER
app.use(globalErrorController);

module.exports = app;
