// library
const express = require('express');
const router = express.Router();

// middleware
const authMiddleware = require('../middleware/auth-validation'); 

// controller
const komentarController = require('../src/controller/komentar.controller');

// path
const pathGroup = 'komentar';
const pathVersion = 'v1';   

// route
router.post(`/${pathGroup}/${pathVersion}/create`, authMiddleware.checkAuth, komentarController.createKomentar);
router.get(`/${pathGroup}/${pathVersion}/list/:laporanId`, authMiddleware.checkAuth, komentarController.getKomentarByLaporanId);

module.exports = router;