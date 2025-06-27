// library
const express = require('express');
const router = express.Router();

// middleware
const authMiddleware = require('../middleware/auth-validation'); 

// controller
const penggunaController = require('../src/controller/pengguna.controller');

// path
const pathGroup = 'pengguna';
const pathVersion = 'v1'; 

// route
router.post(`/${pathGroup}/${pathVersion}/create`, authMiddleware.checkAuth, penggunaController.createPengguna);
router.get(`/${pathGroup}/${pathVersion}/list`, authMiddleware.checkAuth, penggunaController.getAllPengguna);
router.get(`/${pathGroup}/${pathVersion}/detail/:id_pengguna`, authMiddleware.checkAuth, penggunaController.getPenggunaById);
router.put(`/${pathGroup}/${pathVersion}/update/:id_pengguna`, authMiddleware.checkAuth, penggunaController.updatePengguna);
router.delete(`/${pathGroup}/${pathVersion}/delete/:id_pengguna`, authMiddleware.checkAuth, penggunaController.softDeletePengguna);

module.exports = router;