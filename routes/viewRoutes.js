const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// SOLVE THE PROBLEME OF POLICY / STACKOVERFLOW
const CSP = 'Content-Security-Policy';
const POLICY =
	"default-src 'self' https://*.mapbox.com https://*.stripe.com/ ws://127.0.0.1:33753/ ;" +
	"base-uri 'self';block-all-mixed-content;" +
	"font-src 'self' https: data:;" +
	"frame-ancestors 'self';" +
	"img-src http://localhost:3000 'self' blob: data:;" +
	"object-src 'none';" +
	"script-src https: cdn.jsdelivr.net cdnjs.cloudflare.com api.mapbox.com 'self' blob: ;" +
	"script-src-attr 'none';" +
	"style-src 'self' https: 'unsafe-inline';" +
	'upgrade-insecure-requests;';

router.use((req, res, next) => {
	res.setHeader(CSP, POLICY);
	next();
});

//#########################################################################

router.get(
	'/',
	bookingController.createBookingCheckout,
	authController.isLoggedIn,
	viewController.getOverview
);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
router.get('/me', authController.protect, viewController.getAccount);
router.get('/my-tours', authController.protect, viewController.getMyTours);

//THIS ROUTE FOR UPDATING USER SETTING USING URL ENCODING
//router.post('/submit-user-data', viewController.updateUserData);

module.exports = router;
