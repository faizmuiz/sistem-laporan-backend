// library
const express = require('express');
const router = express.Router();

// middleware
const authMiddleware = require('../middleware/auth-validation'); 

// validation
// const jabatanValidation = require('../src/validation/jabatan.validation');

// controller
const jabatanController = require('../src/controller/jabatan.controller');

// path
const pathGroup = 'jabatan';
const pathVersion = 'v1'; 

// route
router.post(`/${pathGroup}/${pathVersion}/create`, authMiddleware.checkAuth, jabatanController.createJabatan);
router.get(`/${pathGroup}/${pathVersion}/detail/:id_jabatan`, authMiddleware.checkAuth, jabatanController.getJabatanById);
router.get(`/${pathGroup}/${pathVersion}/list`, authMiddleware.checkAuth, jabatanController.getAllJabatan);
router.put(`/${pathGroup}/${pathVersion}/update/:id_jabatan`, authMiddleware.checkAuth, jabatanController.updateJabatan);

module.exports = router;