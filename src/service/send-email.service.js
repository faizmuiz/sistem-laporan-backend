const nodemailer = require('nodemailer')
const config = require('../../config/email.config')

const providerGmail = async (email, text, subject = false) => {
	// 1. create transporter email (email config)
	const transporter = nodemailer.createTransport({
		// service: 'gmail',
		host: 'mail.laporkerjagama.com',
		port: 465,
		secure: true,
		auth: {
			user: config.gmail.email,
			pass: config.gmail.password, // or app password
		}
	});

	// 2. set email options (payload email)
	const emailOptions = {
		from: config.gmail.email, // sender email
		to: email, // recipient email
		subject: subject,// subject email
		html: text, // emai body
	}

	// 3. send email
	try {
		const info = await transporter.sendMail(emailOptions);
		console.info('Email sent: ' + JSON.stringify(info));
		
		return {
			info: info.response,
			to: email
		}
	} catch (error) {
		console.error('Error', error);
		return false;
	}
}

module.exports = {
	providerGmail
}
