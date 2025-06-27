'use strict';

// utility
const resFormat = require('../../utility/response-api'); 

// service
const jabatanService =  require('../service/jabatan.service');

// create 
const createJabatan = async (req, res, next) => {
    try {
        const data = await jabatanService.createJabatan(req);
        return res.status(200).send(resFormat({code: 200}, data));
    } catch (error) {
        next(error);
    };
};

// get jabatan by id
const getJabatanById = async (req, res, next) => {
    try {
        const data = await jabatanService.getJabatanById(req);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    };
};

// get all jabatan
const getAllJabatan = async (req, res, next) => {
    try {
        const data = await jabatanService.getAllJabatan(req);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    };
};

// update jabatan
const updateJabatan = async (req, res, next) => {
    try {
        const data = await jabatanService.updateJabatan(req);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    };
};

module.exports = {
    createJabatan,
    getJabatanById,
    getAllJabatan,
    updateJabatan
};