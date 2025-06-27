// library
const express = require('express');
const router = express.Router();

// middleware
const authMiddleware = require('../middleware/auth-validation'); 

// controller
const projekController = require('../src/controller/projek.controller')

// path
const pathGroup = 'projek';
const pathVersion = 'v1'; 

// route
router.get(`/${pathGroup}/${pathVersion}/list`, authMiddleware.checkAuth, projekController.getAllProjek);
router.post(`/${pathGroup}/${pathVersion}/create`, authMiddleware.checkAuth, projekController.createProjek);
router.put(`/${pathGroup}/${pathVersion}/update/:id_projek`, authMiddleware.checkAuth, projekController.updateProjek);
router.delete(`/${pathGroup}/${pathVersion}/delete/:id_projek`, authMiddleware.checkAuth, projekController.softDeleteProjek);

module.exports = router;