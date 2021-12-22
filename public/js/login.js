import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
	try {
		//console.log(email, password);
		const result = await axios({
			method: 'POST',
			url: 'http://127.0.0.1:3000/api/v1/users/login',
			data: {
				email,
				password,
			},
		});
		if (result.data.status === 'success') {
			showAlert('success', 'Logged in successfully');
			window.setTimeout(function () {
				location.assign('/'); //loading other page
			}, 1500);
		}
	} catch (err) {
		showAlert('error', err.response.data.message);
	}
};
export const logOut = async () => {
	try {
		const res = await axios({
			method: 'GET',
			url: 'http://127.0.0.1:3000/api/v1/users/logout',
		});
		if ((res.data.status = 'success')) location.assign('/'); //true:force reload from the server not from the cach
	} catch (err) {
		('error logout try again!');
	}
};
