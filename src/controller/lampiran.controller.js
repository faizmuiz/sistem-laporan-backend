'use strict';

// utility
const resFormat = require('../../utility/response-api'); 

// service
const lampiranService = require('../service/lampiran.service');

// upload lampiran by file
const uploadFileLampiran = async (req, res, next) => {
    try {
        const data = await lampiranService.uploadFileLampiran(req);
        return res.status(200).send(resFormat({code: 200}, data));
    } catch (error) {
        next(error);
    }
};

// upload lampiran by base64
const uploadBase64Lampiran = async (req, res, next) => {
    try {
        const data = await lampiranService.uploadBase64Lampiran(req);
        return res.status(200).send(resFormat({code: 200}, data));
    } catch (error) {
        next(error);
    }
};

// get lampiran by lampiran id

// const getLampiranById = async (req, res, next) => {
//     try {
//         const {fileBuffer, fileName} = await lampiranService.getLampiranById(req);
//         res.writeHead(200, {
//             'Content-Type': 'image/png', 
//             'Content-Disposition': `inline; filename="${fileName}"`,
//             'Content-Length': fileBuffer.length,
//         });
//         res.end(fileBuffer); 
//     } catch (error) {
//         next(error);
//     }
// };

const getLampiranById = async (req, res, next) => {
    try {
        const {fileBuffer, fileName} = await lampiranService.getLampiranById(req);
        
        // Jika ingin mengembalikan sebagai JSON (base64)
        const base64Data = fileBuffer.toString('base64');
        res.json({
            success: true,
            data: {
                fileBuffer: base64Data,
                fileName: fileName,
                mimeType: 'image/png' // atau bisa dideteksi dari ekstensi file
            }
        });
        
        // Opsi 2: Jika tetap ingin mengirim binary (perlu perubahan di frontend)
        // res.writeHead(200, {
        //     'Content-Type': 'image/png',
        //     'Content-Disposition': `inline; filename="${fileName}"`,
        //     'Content-Length': fileBuffer.length,
        // });
        // res.end(fileBuffer);
    } catch (error) {
        next(error);
    }
};

// delete lampiran by id
const deleteLampiranById = async (req, res, next) => {
    try {
        await lampiranService.deleteLampiranById(req);
        return res.status(200).send(resFormat({code: 200}, {message: 'Lampiran berhasil dihapus'}));
    } catch (error) {
        next(error);
    }
};

// export module
module.exports = {
    uploadFileLampiran,
    uploadBase64Lampiran,
    getLampiranById,
    deleteLampiranById
};