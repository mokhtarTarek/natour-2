import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
	'pk_test_51K8qpdI4i3Bqw2PHwgUFTdcwCVwGXKGlZgS34UM1keQu0FnAnwQpIzDGzBNeYgJVPDvYJoKPa0cHRosgweVvn6e4005tTzsVRx'
);

export const bookTour = async (tourId) => {
	try {
		// 1) Get checkout session from API
		const session = await axios(
			`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
		);
		//console.log(session);

		// 2) Create checkout form + chanre credit card
		//console.log('redirect');
		await stripe.redirectToCheckout({
			sessionId: session.data.session.id,
		});
	} catch (err) {
		//console.log(err);
		showAlert('error', err);
	}
};
