// library
const express = require('express');
const router = express.Router();

// middleware
const authMiddleware = require('../middleware/auth-validation'); 

// controller
const laporanHarianController = require('../src/controller/laporan-harian.controller'); 

// path
const pathGroup = 'laporan';
const pathVersion = 'v1'; 

// route
router.get(`/${pathGroup}/${pathVersion}/list`, authMiddleware.checkAuth, laporanHarianController.getAllLaporanHarian);
router.get(`/${pathGroup}/${pathVersion}/detail-harian/:id_laporan`, authMiddleware.checkAuth, laporanHarianController.getLaporanHarianById);
router.post(`/${pathGroup}/${pathVersion}/create-harian`, authMiddleware.checkAuth, laporanHarianController.createLaporanHarian);
router.put(`/${pathGroup}/${pathVersion}/update-harian/:id_laporan`, authMiddleware.checkAuth, laporanHarianController.updateLaporanHarian);
router.delete(`/${pathGroup}/${pathVersion}/delete-harian/:id_laporan`, authMiddleware.checkAuth, laporanHarianController.softDeleteLaporanHarian);
router.put(`/${pathGroup}/${pathVersion}/update-review/:id_laporan`, authMiddleware.checkAuth, laporanHarianController.updateStatusReview);
router.put(`/${pathGroup}/${pathVersion}/update-kendala/:id_laporan`, authMiddleware.checkAuth, laporanHarianController.updateStatusKendala);

module.exports = router;