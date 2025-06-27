// library
const express = require('express');
const router = express.Router();

// middleware
const authMiddleware = require('../middleware/auth-validation'); 

// controller
const laporanMingguanController = require('../src/controller/laporan-mingguan.controller');

// path
const pathGroup = 'laporan';
const pathVersion = 'v1';

// route
router.get(`/${pathGroup}/${pathVersion}/list-mingguan`, authMiddleware.checkAuth, laporanMingguanController.getAllLaporanMingguan);
router.get(`/${pathGroup}/${pathVersion}/detail-mingguan/:idLaporanMingguan`, authMiddleware.checkAuth, laporanMingguanController.findDetailByIdLaporanMingguan);
router.get(`/${pathGroup}/${pathVersion}/ringkasan-mingguan/:idLaporanMingguan`, authMiddleware.checkAuth, laporanMingguanController.getRingkasanLaporanMingguan);
router.post(`/${pathGroup}/${pathVersion}/generate-mingguan`, authMiddleware.checkAuth, laporanMingguanController.createLaporanMingguan);

module.exports = router;