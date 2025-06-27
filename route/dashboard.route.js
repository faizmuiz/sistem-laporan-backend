// library
const express = require('express');
const router = express.Router();

// middleware
const authMiddleware = require('../middleware/auth-validation'); 

// controller
const dashboardController = require('../src/controller/dashboard.controller');

// path
const pathGroup = 'dashboard';  
const pathVersion = 'v1';

// route
// DASHBOARD KARYAWAN
router.get(`/${pathGroup}/${pathVersion}/karyawan/total-review`, authMiddleware.checkAuth, dashboardController.getTotalLaporanDanReview);
router.get(`/${pathGroup}/${pathVersion}/karyawan/status-laporan`, authMiddleware.checkAuth, dashboardController.getStatusLaporan);
router.get(`/${pathGroup}/${pathVersion}/karyawan/list-kendala`, authMiddleware.checkAuth, dashboardController.getListKendala);
router.get(`/${pathGroup}/${pathVersion}/karyawan/info-kendala`, authMiddleware.checkAuth, dashboardController.getInformasiKendala);
router.get(`/${pathGroup}/${pathVersion}/karyawan/presentase-task`, authMiddleware.checkAuth, dashboardController.getPresentasetask);
router.get(`/${pathGroup}/${pathVersion}/karyawan/task-status`, authMiddleware.checkAuth, dashboardController.getTotalTaskStatus);

// DASHBOARD ATASAN
router.get(`/${pathGroup}/${pathVersion}/atasan/laporan-bawahan`, authMiddleware.checkAuth, dashboardController.getTotalLaporanBawahan);
router.get(`/${pathGroup}/${pathVersion}/atasan/daftar-bawahan`, authMiddleware.checkAuth, dashboardController.getDaftarBawahan);
router.get(`/${pathGroup}/${pathVersion}/atasan/info-projek`, authMiddleware.checkAuth, dashboardController.getInformasiProjek);

// DASHBOARD DIREKTUR
router.get(`/${pathGroup}/${pathVersion}/direktur/daftar-atasan`, authMiddleware.checkAuth, dashboardController.getDaftarAtasan);

// DRILL DOWN
router.get(`/${pathGroup}/${pathVersion}/direktur/dashboard-atasan/:id_pengguna_atasan`, authMiddleware.checkAuth, dashboardController.getDashboardAtasanById);
router.get(`/${pathGroup}/${pathVersion}/atasan/dashboard-bawahan/:id_pengguna_bawahan`, authMiddleware.checkAuth, dashboardController.getDashboardBawahanById);

module.exports = router;