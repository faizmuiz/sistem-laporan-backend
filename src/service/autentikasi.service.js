// library
const { v7: uuidv7 } = require('uuid');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// exception
const ErrorAuthenticationException = require("../../exception/error-authentication.exception").ErrorAuthenticationException;

// utility
const EncryptDecryptClass = require("../../utility/encrypt-decrypt"); 
const encryptDecrypt = new EncryptDecryptClass(); 
const { getMetadataInfo } = require('../../utility/metadata-info.utility');

// repo
const autentikasiRepo = require('../repository/autentikasi.repository');

// middleware
const authMiddleware = require('../../middleware/auth-validation');

// other service
const sendEmailService = require('./send-email.service');
const templateEmailService = require('./template-email.service');

// login
const login = async (req) => {
    const body = req.body;
    const email = body.email;
    const password = body.password;

    // 1. cek isi
    if (!email || !password) {
        throw new ErrorAuthenticationException("Email atau password salah.");
    };

    // 2. cek email dan status pengguna
    const pengguna = await autentikasiRepo.findLogin(email);
    if (!pengguna) {
        throw new ErrorAuthenticationException("Email atau password salah.");
    };

    if (pengguna.status_pengguna !== 1) {
        throw new ErrorAuthenticationException("Akun Anda tidak aktif.");
    }

    // 3. cek password
    const isPasswordValid = await encryptDecrypt.checkBcrypt(password, pengguna.password);
    if (!isPasswordValid) {
        throw new ErrorAuthenticationException("Email atau password salah.");
    }

    // 4. generate token
    const token = autentikasiRepo.generateToken(pengguna);

    // 5. data
    const penggunaData = {
        id_pengguna: pengguna.id_pengguna,
        nama: pengguna.nama,
        email: pengguna.email,
        telepon: pengguna.telepon,
        id_jabatan: pengguna.jabatan.id_jabatan,
        jabatan: pengguna.jabatan.jabatan,
        divisi: pengguna.jabatan.divisi,
        level: pengguna.jabatan.level,
        status_pengguna: pengguna.status_pengguna,
        token: token
    };

    // console.log('isi token:', token);
    // const encoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // console.log('encode:', encoded);

    return penggunaData;
};

// logout
const logout = async (req) => {
    // 1. get token
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        throw new ErrorAuthenticationException("Not authenticated, no token provided.");
    }
    
    // 2. hapus token dari Authorization variable
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    // 3. hapus token dari request headers
    req.headers['authorization'] = '';

    // 4. tambah token ke invalid tokens set
    authMiddleware.addToInvalidTokens(token);

    return { message: 'Logout berhasil' };
};

// request forgot password by email
const requestForgotPassword = async (email) => {
    const otpCode = Math.floor(10000 + Math.random() * 90000).toString(); // Generate 5-digit OTP
    const encryptedOtp = crypto.createHash('sha256').update(otpCode).digest('hex').substring(0, 10); // Encrypt and truncate to 10 characters
    
    const payload = {
        id_auth: uuidv7(),
        email,
        otp: encryptedOtp,
        requested_at: new Date(),
        expired_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        otp_status: 1,
    };

    // Save OTP request to the database
    await autentikasiRepo.createRequest(payload);

    // Generate email 
    const emailContent = templateEmailService.textForgotPassword({
        code: otpCode,
        expiredTime: 10,
    });

    // kirim email
    const emailSent = await sendEmailService.providerGmail(email, emailContent, 'Forgot Password OTP');

    if (!emailSent) {
        throw new ErrorAuthenticationException('Failed to send OTP email!');
    }

    return { message: 'OTP sent successfully!' };
};

// otp verification
const verifyOtpCode = async (email, otpCode) => {
    const request = await autentikasiRepo.findRequestByEmail(email);
    if (!request) {
        throw new ErrorAuthenticationException('OTP not found or expired!');
    }

    const decryptedOtp = crypto.createHash('sha256').update(otpCode).digest('hex').substring(0, 10); 

    if (decryptedOtp !== request.otp) { 
        throw new ErrorAuthenticationException('Invalid OTP!');
    }

    await autentikasiRepo.updateRequestStatus(request.id_auth, 0);

    const pengguna = await autentikasiRepo.findPenggunaByEmail(email);

    if (!pengguna) {
        throw new ErrorAuthenticationException('Pengguna tidak ditemukan.');
    }

    const id_pengguna = pengguna.get("id_pengguna");

    if (!id_pengguna) {
        throw new ErrorAuthenticationException('Pengguna tidak ditemukan.');    
    }

    const token = jwt.sign({ email, id_pengguna }, process.env.JWT_SECRET_KEY, { expiresIn: '15m' });

    return token;
};

// change password

// const changePassword = async (token, newPassword) => {
//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

//         if (decoded.type !== 'changepassword') {
//             throw new ErrorAuthenticationException('Invalid token type!');
//         }

//         const hashedPassword = encryptDecrypt.encryptBcrypt(newPassword);
//         console.log('Hashed Password:', hashedPassword);

//         await autentikasiRepo.updatePassword(decoded.email, hashedPassword);

//         return 'Password successfully updated!';
//     } catch (err) {
//         console.error('Error in changePassword:', err.message);
//         throw new ErrorAuthenticationException('Token expired or invalid!');
//     }
// };

const changePassword = async (req) => {
    try {
        const id_pengguna = req.penggunaId;

        const {newPassword, confirmPassword} = req.body;
        if (!newPassword || !confirmPassword) {
            throw new ErrorAuthenticationException("Password tidak boleh kosong.");
        }

        if (newPassword !== confirmPassword) {
            throw new ErrorAuthenticationException("Password tidak sama.");
        }

        if (!id_pengguna) {
            throw new ErrorAuthenticationException("Token tidak valid.");
        }

        await autentikasiRepo.updatePassword(newPassword, id_pengguna);

        return 'Password successfully updated!';
    } catch (err) {
        console.error('Error in changePassword:', err.message);
        throw new ErrorAuthenticationException('Token expired or invalid!');
    }
};

// get detail pengguna login
const getDetailLogin = async (req) => {
    // ambil id_pengguna dari token (middleware auth-validation harus sudah jalan sebelum ini)
    const { penggunaId } = getMetadataInfo(req);

    if (!penggunaId) {
        throw new ErrorAuthenticationException("Token tidak valid.");
    }

    const pengguna = await autentikasiRepo.getDetailLogin(penggunaId);
    if (!pengguna) {
        throw new ErrorAuthenticationException("Pengguna tidak ditemukan.");
    }

    const penggunaData = {
        id_pengguna: pengguna.id_pengguna,
        nama: pengguna.nama,
        email: pengguna.email,
        telepon: pengguna.telepon,
        id_jabatan: pengguna.jabatan.id_jabatan,
        jabatan: pengguna.jabatan.jabatan,
        divisi: pengguna.jabatan.divisi,
        level: pengguna.jabatan.level,
        status_pengguna: pengguna.status_pengguna
    };

    return penggunaData;
};

// export module  
module.exports = {
    login,
    logout,
    requestForgotPassword,
    verifyOtpCode,
    changePassword,
    getDetailLogin
};