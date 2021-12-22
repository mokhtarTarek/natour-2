const express = require('express');
const router = express.Router();
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

//########## PUBLIC ROUTES ################################################

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logOut);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//########## PROTECTED ROUTES ##############################################

router.use(authController.protect); //protect all routes after this middleware
//upload single : for one file and photo for the field that will hold the file
router.patch(
	'/updateMe',
	userController.uploadUserPhoto,
	userController.reseizeUserPhoto,
	userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);
router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);

//########## PROTECTED AND RESTRICTED ROUTES ################################

router.use(authController.restrictTo('admin'));

router
	.route('/')
	.get(userController.getAllUsers)
	.post(userController.createUser);

router
	.route('/:id')
	.get(userController.getUser)
	.patch(userController.updateUser)
	.delete(userController.deleteUser);

module.exports = router;
