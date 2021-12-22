const path = require('path');
const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit'); //security
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const AppError = require('./utils/errorApp');
const globalErrorController = require('./controllers/errorController');

const app = express();
//define the view engine
app.set('view engine', 'pug'); //express support pug and others engines out of the box
app.set('views', path.join(__dirname, 'views'));
//------ALL MIDDLEWARES ARE INVOKED FOLLOWING THE MIDDLEWARE STACK ORDER------------

app.use(helmet()); //ADD SOME INFOS TO THE RES HEADERS

// GLOBAL MIDDLEWARES

// SERVING STATIS FILES
/*app.use(express.static(`${__dirname}/public`));*/
app.use(express.static(path.join(__dirname, 'public')));

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
//URL encoded
//app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

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

// COSTUM MD :READ REQUESTS
app.use((req, res, next) => {
	req.reqTime = new Date().toISOString();
	//console.log(req.cookies);
	next();
});

// MOUNTING ROUTERS

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// IF ALL PREVIOUS ROUTES ARE NOT MATCHED
app.all('*', (req, res, next) => {
	//call the next() middlewareStack with error object (extending Error class)
	next(new AppError(`can not find ${req.originalUrl} in this server`, 404));
});

//HANDLE ALL OTHERS ERRORS IN A GLOBAL MIDDLEWARE HANDLER
app.use(globalErrorController);

module.exports = app;
//#####################################
//CALLING NEXT WITH ARGUMENT THEN THE ARGUMENT WILL BE CONSIDERED AS ERROR BY EXPRESS
