const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
	//1) create a transporter
	const transporter = nodemailer.createTransport({
		//service: 'Gmail',
		host: process.env.EMAIL_HOST,
		port: process.env.EMAIL_PORT,
		auth: {
			user: process.env.EMAIL_USERNAME,
			pass: process.env.EMAIL_PASSWORD,
		},
		//Activate in gmail "less secure app" option
	});

	//2) Define the email options coming from params;

	const mailOptions = {
		from: 'tarek Mokhtar <hello@Tarek.io>',
		to: options.email,
		subject: options.subject,
		text: options.message,
		//html:
	};

	await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;
