// library
const express = require('express');
const router = express.Router();

// middleware
const authMiddleware = require('../middleware/auth-validation'); 

// controller
const taskController = require('../src/controller/task.controller')

// path
const pathGroup = 'task';
const pathVersion = 'v1';

// route
router.get(`/${pathGroup}/${pathVersion}/list`, authMiddleware.checkAuth, taskController.getTasks);
router.post(`/${pathGroup}/${pathVersion}/create`, authMiddleware.checkAuth, taskController.createTask);
router.put(`/${pathGroup}/${pathVersion}/update-status/`, authMiddleware.checkAuth, taskController.updateTaskStatus);
router.put(`/${pathGroup}/${pathVersion}/update/:id_task`, authMiddleware.checkAuth, taskController.updateTask);
router.delete(`/${pathGroup}/${pathVersion}/delete/:id_task`, authMiddleware.checkAuth, taskController.softDeleteTask);

module.exports = router;