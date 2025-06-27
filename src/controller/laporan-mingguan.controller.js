'use strict';

// utility
const resFormat = require('../../utility/response-api'); 

// service
const laporanMingguanService = require('../service/laporan-mingguan.service');

// get all
const getAllLaporanMingguan = async (req, res, next) => {
    try {
        const data = await laporanMingguanService.getAllLaporanMingguan(req);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

// find detail laporan mingguan by laporan mingguan id
const findDetailByIdLaporanMingguan = async (req, res, next) => {
    try {
        const data = await laporanMingguanService.findDetailByIdLaporanMingguan(req.params.idLaporanMingguan);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    };
};

// ringkasan
const getRingkasanLaporanMingguan = async (req, res, next) => {
    try {
        const data = await laporanMingguanService.getRingkasanLaporanMingguan(req.params.idLaporanMingguan);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    };
};

// create laporan mingguan
const createLaporanMingguan = async (req, res, next) => {
    try {
        const data = await laporanMingguanService.createLaporanMingguan(req);
        return res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    };
};

module.exports = {
    getAllLaporanMingguan,
    findDetailByIdLaporanMingguan,
    getRingkasanLaporanMingguan,
    createLaporanMingguan,
};