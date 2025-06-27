// library
const express = require('express');
const router = express.Router();

// middleware
const authMiddleware = require('../middleware/auth-validation');
const requestValidation = require('../middleware/request-validation');

// validation
const authValidation = require('../src/validation/auth.validation');

// controller
const autentikasiController = require('../src/controller/autentikasi.controller');

// path 
const pathGroup = 'autentikasi';
const pathVersion = 'v1';

// route
router.post(`/${pathGroup}/${pathVersion}/login`, authValidation.login, autentikasiController.login);
router.post(`/${pathGroup}/${pathVersion}/logout`, authMiddleware.checkAuth, autentikasiController.logout);
router.get(`/${pathGroup}/${pathVersion}/detail-login`, authMiddleware.checkAuth, autentikasiController.getDetailLogin);

router.post(`/${pathGroup}/${pathVersion}/reset-password-request`, authValidation.forgotPasswordRequest, requestValidation, autentikasiController.forgotPasswordRequest);
router.post(`/${pathGroup}/${pathVersion}/reset-password-verify`, authValidation.forgotPasswordVerify, requestValidation, autentikasiController.forgotPasswordVerify);
router.post(`/${pathGroup}/${pathVersion}/reset-password-confirm`, authMiddleware.checkAuth, authValidation.forgotPasswordChangePassword, requestValidation, autentikasiController.forgotPasswordChangePassword);

module.exports = router;