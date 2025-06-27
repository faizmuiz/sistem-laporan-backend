'use strict';

// utility
const resFormat = require('../../utility/response-api'); 

// service
const komentarService = require('../service/komentar.service');

// create komentar
const createKomentar = async (req, res, next) => {
    try {
        const data = await komentarService.createKomentar(req);
        return res.status(200).send(resFormat({code: 200}, data));
    } catch (error) {
        next(error);
    };
};

// get komentar by laporan id
const getKomentarByLaporanId = async (req, res, next) => {
    try {
        const data = await komentarService.getKomentarByLaporanId(req);
        return res.status(200).send(resFormat({code: 200}, data));
    } catch (error) {
        next(error);
    };
};

// export module
module.exports = {
    createKomentar,
    getKomentarByLaporanId,
};