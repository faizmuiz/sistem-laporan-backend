'use strict';

// utility
const resFormat = require('../../utility/response-api'); 

// service
const penggunaService = require('../service/pengguna.service');

// create
const createPengguna = async (req, res, next) => {
    try {
        const data = await penggunaService.createPengguna(req);
        return res.status(200).send(resFormat({code: 200}, data));
    } catch (error) {
        next(error);
    };
};

// get all pengguna
const getAllPengguna = async (req, res, next) => {
    try {
        const data = await penggunaService.getAllPengguna(req);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

// get pengguna by id
const getPenggunaById = async (req, res, next) => {
    try {
        const data = await penggunaService.getPenggunaById(req);
        return res.status(200).send(resFormat({code: 200}, data));
    } catch (error) {
        next(error);
    };
};

// update pengguna
const updatePengguna = async (req, res, next) => {
    try {
        const data = await penggunaService.updatePengguna(req);
        return res.status(200).send(resFormat({code: 200}, data));
    } catch (error) {
        next(error);
    }
};

// soft delete
const softDeletePengguna = async (req, res, next) => {
    try {
        const result = await penggunaService.softDeletePengguna(req);
        res.status(200).send(resFormat({ code: 200 }, result));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPengguna,
    getAllPengguna,
    getPenggunaById,
    updatePengguna,
    softDeletePengguna
};