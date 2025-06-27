'use strict';

// utility
const resFormat = require('../../utility/response-api'); 

// service
const taskService = require('../service/task.service')

// get all
const getTasks = async (req, res, next) => {
    try {
        const data = await taskService.getTasks(req);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

// create task
const createTask = async (req, res, next) => {
    try {
        const data = await taskService.bulkCreateTasks(req);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

// update task status
const updateTaskStatus = async (req, res, next) => {
    try {
        const data = await taskService.bulkUpdateTasks(req);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

// update task dan target
const updateTask = async (req, res, next) => {
    try {
        const data = await taskService.updateTask(req);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

// soft delete task
const softDeleteTask = async (req, res, next) => {
    try {
        const data = await taskService.softDeleteTask(req);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTasks,
    createTask,
    updateTaskStatus,
    updateTask,
    softDeleteTask
};