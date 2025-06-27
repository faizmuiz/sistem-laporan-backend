// library
const express = require('express');
const router = express.Router();

// middleware
const authMiddleware = require('../middleware/auth-validation'); 
const fileUpload = require('../middleware/file-upload');

// controller
const lampiranController = require('../src/controller/lampiran.controller');

// path
const pathGroup = 'lampiran';
const pathVersion = 'v1';

// route
router.post(`/${pathGroup}/${pathVersion}/upload-file`, authMiddleware.checkAuth, fileUpload.uploadSingleFile, lampiranController.uploadFileLampiran);
router.post(`/${pathGroup}/${pathVersion}/upload-base64`, authMiddleware.checkAuth, lampiranController.uploadBase64Lampiran);
router.get(`/${pathGroup}/${pathVersion}/file/:id_lampiran`, authMiddleware.checkAuth, lampiranController.getLampiranById);
router.delete(`/${pathGroup}/${pathVersion}/delete/:id_lampiran`, authMiddleware.checkAuth, lampiranController.deleteLampiranById);

module.exports = router;