'use strict';

// utility
const resFormat = require('../../utility/response-api'); 

// service
const projekService = require('../service/projek.service')

// get all
const getAllProjek = async (req, res, next) => {
    try {
        const data = await projekService.getAllProjek(req);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

// create projek
const createProjek = async (req, res, next) => {
    try {
        const data = await projekService.createProjek(req);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};


// update projek
const updateProjek = async (req, res, next) => {
    try {
        const data = await projekService.updateProjek(req);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

// soft delete
const softDeleteProjek = async (req, res, next) => {
    try {
        const data = await projekService.softDeleteProjek(req);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllProjek,
    createProjek,
    updateProjek,
    softDeleteProjek
}