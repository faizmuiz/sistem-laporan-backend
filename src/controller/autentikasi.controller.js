'use strict';

// library
const { validationResult } = require('express-validator');

// utility
const resFormat = require('../../utility/response-api'); 

// service
const autentikasiService = require('../service/autentikasi.service');

// login
const login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const data = await autentikasiService.login(req);

        res.setHeader("Authorization", `Bearer ${data.token}`);
        res.setHeader("Access-Control-Exposed-Headers", "Authorization");

        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

// logout
const logout = async (req, res, next) => {
    try {
        const result = await autentikasiService.logout(req);
        return res.status(200).send(resFormat({ code: 200 }, result));
    } catch (error) {
        next(error);
    }
};

// 1. Request OTP for Forgot Password
const forgotPasswordRequest = async (req, res, next) => {
    try {
        const { email } = req.body;
        const result = await autentikasiService.requestForgotPassword(email);

        res.status(200).send(resFormat({ code: 200 }, result));
    } catch (error) {
        next(error);
    }
};

// 2. Verify OTP for Forgot Password
const forgotPasswordVerify = async (req, res, next) => {
    try {
        const { email, code } = req.body;
        const token = await autentikasiService.verifyOtpCode(email, code);

        res.setHeader("Authorization", `Bearer ${token}`);
        res.setHeader("Access-Control-Exposed-Headers", "Authorization");

        res.status(200).send(resFormat({ code: 200 }, { message: 'OTP verified successfully!', token }));
    } catch (error) {
        next(error);
    }
};

// 3. Change Password
const forgotPasswordChangePassword = async (req, res, next) => {
    try {
        
        const result = await autentikasiService.changePassword(req);

        res.status(200).send(resFormat({ code: 200 }, { result }));
    } catch (error) {
        next(error);
    }
};

// get detail login
const getDetailLogin = async (req, res, next) => {
    try {
        const result = await autentikasiService.getDetailLogin(req);
        return res.status(200).send(resFormat({ code: 200 }, result));
    } catch (error) {
        next(error);
    }
};

// export module
module.exports = {
    login,
    logout,
    forgotPasswordRequest,
    forgotPasswordVerify,
    forgotPasswordChangePassword,
    getDetailLogin
};