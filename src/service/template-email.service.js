// --- auth
// forgot password
const textForgotPassword = (payload = {}) => {
	return `
		<p>Kode OTP untuk setel ulang password adalah:</p>
		<p style="font-size:24px; font-weight:bold">${payload.code}</p>
		<p>Kode OTP kadaluarsa dalam ${payload.expiredTime} menit.</p>
	`;
}

module.exports = {
	textForgotPassword
}
