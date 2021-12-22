const AppError = require('../utils/errorApp');

const handleCastErrorDB = (err) => {
	let message = `invalid ${err.path} : ${err.value}`;
	return new AppError(message, 400);
};
const handleDuplicateErrorDB = (err) => {
	let message = `duplicate filed ${err.keyValue.name}`;
	return new AppError(message, 400);
};

const handleValidatorErrorDB = (err) => {
	return new AppError(err.message, 400);
};

const handleJWTError = () =>
	new AppError('Invalid Token please login again', 401);
const handleJWTExpiredError = () =>
	new AppError('Expired Token please login again', 401);

//################################# DEVELOPEMENT ENVIREMENT #############################

const sendErrorDev = (err, req, res) => {
	// A) API : send the entire error details
	if (req.originalUrl.startsWith('/api')) {
		return res.status(err.statusCode).json({
			status: err.status,
			error: err,
			message: err.message,
			stack: err.stack,
		});
	}
	// RENDER ERROR : render the error page
	console.error('ERROR!!!!!!!');
	return res.status(err.statusCode).render('error', {
		title: 'something went wrong',
		msg: err.message,
	});
};

//################################# PRODUCTION ENVIREMENT #############################

const sendErrorProd = (err, req, res) => {
	// A) API
	if (req.originalUrl.startsWith('/api')) {
		// Operational trusted error : send err to the client
		if (err.isOperational) {
			return res.status(err.statusCode).json({
				status: err.status,
				message: err.message,
			});
		}
		// Programming or unknown error : don't leack details
		//1) log error
		console.error('ERROR!!!!!!!');
		//2) send generic error
		return res.status(505).json({
			status: 'error',
			message: 'something went very wrong!',
		});
	}

	// A) RENDER ERROR
	// Operational trusted error : send err to the client
	if (err.isOperational) {
		return res.status(err.statusCode).render('error', {
			title: 'something went wrong',
			msg: err.message,
		});
	}
	// Programming or unknown erro : don't leack details
	//1) log error
	console.error('ERROR!!!!!!!');
	//2) send generic error
	return res.status(505).json({
		title: 'somthing went wrong!',
		msg: 'please try again later',
	});
};

//############################### GLOBAL ERROR HANDLER ##############################

// a regular middleware with err as first param
//err ==> the error object (extended from the express error class)

module.exports = (err, req, res, next) => {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'fail';

	if (process.env.NODE_ENV === 'developement') {
		sendErrorDev(err, req, res);
	} else if (process.env.NODE_ENV === 'production') {
		let error = { ...err };
		error.message = err.message;
		//console.log(err.name);
		if (err.name === 'CastError') error = handleCastErrorDB(err);
		if (err.code === 11000) error = handleDuplicateErrorDB(err);
		if (err.name === 'ValidationError') error = handleValidatorErrorDB(err);
		if (err.name === 'JsonWebTokenError') error = handleJWTError();
		if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

		sendErrorProd(error, req, res);
	}
};
