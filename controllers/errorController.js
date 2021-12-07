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
	new AppError('Invalid Token please log in again', 401);
const handleJWTExpiredError = () =>
	new AppError('Expired Token please log in again', 401);

const sendErrorDev = (err, res) => {
	res.status(err.statusCode).json({
		status: err.status,
		error: err,
		message: err.message,
		stack: err.stack,
	});
};

const sendErrorProd = (err, res) => {
	//send err to the client
	if (err.isOperational) {
		res.status(err.statusCode).json({
			status: err.status,
			message: err.message,
		});
	} else {
		console.error('ERROR!!!!!!!');
		//send genric error
		res.status(505).json({
			status: 'error',
			message: 'something went very wrong!',
		});
	}
};
// A GLOBAL ERROR HANDLER : is a regular middleware with err as first param
//err ==> The error object (extended from the Error class)

module.exports = (err, req, res, next) => {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'fail';

	if (process.env.NODE_ENV === 'production') {
		let error = { ...err };
		console.log(err.name);
		if (err.name === 'CastError') error = handleCastErrorDB(err);
		if (err.code === 11000) error = handleDuplicateErrorDB(err);
		if (err.name === 'ValidationError') error = handleValidatorErrorDB(err);
		if (err.name === 'JsonWebTokenError') error = handleJWTError();
		if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

		sendErrorProd(error, res);
	} else if (process.env.NODE_ENV === 'developement') {
		sendErrorDev(err, res);
	}
};
