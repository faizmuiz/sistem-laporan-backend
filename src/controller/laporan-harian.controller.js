'use strict';

// utility
const resFormat = require('../../utility/response-api'); 

// service
const laporanHarianService = require('../service/laporan-harian.service');

// get all laporan harian
const getAllLaporanHarian = async (req, res, next) => {
    try {
        const data = await laporanHarianService.getAllLaporanHarian(req);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    };
};

// get laporan harian by id
const getLaporanHarianById = async (req, res, next) => {
    try {
        const data = await laporanHarianService.getLaporanById(req);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    };
};

// create laporan
const createLaporanHarian = async (req, res, next) => {
    try {
        const data = await laporanHarianService.createLaporanHarian(req);
        return res.status(200).send(resFormat({code: 200}, data));
    } catch (error) {
        next(error);
    };
};

// update laporan harian
const updateLaporanHarian = async (req, res, next) => {
    try {
        const data = await laporanHarianService.updateLaporanHarian(req);
        return res.status(200).send(resFormat({code: 200}, data));
    } catch (error) {
        next(error);
    };
};

// soft delete laporan harian
const softDeleteLaporanHarian = async (req, res, next) => {
    try {
        const data = await laporanHarianService.softDeleteLaporanHarian(req);
        return res.status(200).send(resFormat({code: 200}, data)); 
    } catch (error) {
        next(error);
    };
};

// update status sudah direview
const updateStatusReview = async (req, res, next) => {
    try {
        const data = await laporanHarianService.updateReviewStatus(req);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

// update status kendala selesai
const updateStatusKendala = async (req, res, next) => {
    try {
        const data = await laporanHarianService.updateKendalaSelesai(req);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

// exports module
module.exports = {
    getAllLaporanHarian,
    getLaporanHarianById,
    createLaporanHarian,
    updateLaporanHarian,
    softDeleteLaporanHarian,
    updateStatusReview,
    updateStatusKendala
};