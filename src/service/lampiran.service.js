// library
const fs = require('fs');
const path = require('path');
const { v7: uuidv7 } = require('uuid');

// exception
const ErrorNotFoundException = require('../../exception/error-not-found.exception').ErrorNotFoundException;
const ErrorQueryException = require('../../exception/error-query.exception').ErrorQueryException;

// repo
const lampiranRepo = require('../repository/lampiran.repository');

// save file base64 format
const saveBase64File = async (fileName, base64String) => {
    try {
        const filePath = path.join(__dirname, '../../', 'upload', fileName);
        fs.writeFileSync(filePath, base64String);
        return filePath;
    } catch (error) {
        throw error;
    }
};

// generate nomor lampiran label
const generateLampiranLabel = async (id_laporan) => {
    const existingLampiran = await lampiranRepo.getLampiranByLaporanId(id_laporan);
    const lampiranCount = existingLampiran.length;
    const nextNumber = lampiranCount + 1;

    return `lampiran ${nextNumber.toString().padStart(2, '0')}-${id_laporan}`;
};

// upload lampiran by file
const uploadFileLampiran = async (req) => {
    const {id_laporan} = req.body;

    if (!id_laporan) {
        throw new ErrorNotFoundException('Laporan id tidak ditemukan');
    }

    if (!req.file) {
        throw new ErrorNotFoundException('File harus diupload');
    }

    const existingLampiran = await lampiranRepo.getLampiranByLaporanId(id_laporan);
    if (!existingLampiran) {
        throw new ErrorNotFoundException('Lampiran tidak ditemukan');
    }

    // konversi file ke base64
    const base64String = fs.readFileSync(req.file.path).toString('base64');

    // Hapus file asli setelah membaca isinya
    fs.unlinkSync(req.file.path);

    // Simpan file dalam format base64
    const fileName = `${uuidv7()}.txt`;
    const filePath = await saveBase64File(fileName, base64String);

    // lampiran label
    const lampiranLabel = await generateLampiranLabel(id_laporan);

    // save ke db
    const payload = {
        id_lampiran: fileName.replace('.txt', ''),
        id_laporan: id_laporan,
        nama_lampiran: fileName,
        lampiran_label: lampiranLabel,
        status_lampiran: 1,
        created_at: new Date(),
        updated_at: new Date(),
    };

    const newLampiran = await lampiranRepo.createLampiran(payload);
    return {newLampiran, filePath};
};

// upload lampiran by base64
const uploadBase64Lampiran = async (req) => {
    const {id_laporan, base64String} = req.body;

    if (!id_laporan) {
        throw new ErrorNotFoundException('Laporan id tidak ditemukan');
    }

    if (!base64String) {
        throw new ErrorNotFoundException('File harus diupload');
    }

    const existingLampiran = await lampiranRepo.getLampiranByLaporanId(id_laporan);
    if (!existingLampiran) {
        throw new ErrorNotFoundException('Lampiran tidak ditemukan');
    }

    // Simpan file dalam format base64
    const fileName = `${uuidv7()}.txt`;
    const filePath = await saveBase64File(fileName, base64String);

    // lampiran label
    const lampiranLabel = await generateLampiranLabel(id_laporan);

    // save ke db
    const payload = {
        id_lampiran: fileName.replace('.txt', ''),
        id_laporan: id_laporan,
        nama_lampiran: fileName,
        lampiran_label: lampiranLabel,
        status_lampiran: 1,
        created_at: new Date(),
        updated_at: new Date(),
    };

    const newLampiran = await lampiranRepo.createLampiran(payload);
    return {newLampiran, filePath};
};

// get lampiran by lampiran id
const getLampiranById = async (req) => {
    const {id_lampiran} = req.params;
    if (!id_lampiran) {
        throw new ErrorNotFoundException('Lampiran id tidak ditemukan');
    }

    const lampiran = await lampiranRepo.getLampiranById(id_lampiran);
    if (!lampiran) {
        throw new ErrorNotFoundException('Lampiran tidak ditemukan');
    }

    const filePath = path.join(__dirname, '../../', 'upload', lampiran.nama_lampiran);

    if (!fs.existsSync(filePath)) {
        throw new ErrorNotFoundException('File tidak ditemukan');
    }

    const base64Content = fs.readFileSync(filePath, {encoding: `utf-8`});

    const fileBuffer = Buffer.from(base64Content, 'base64');

    return {
        fileBuffer,
        fileName: lampiran.nama_lampiran,
    };
};

// delete lampiran by id
const deleteLampiranById = async (req) => {
    const {id_lampiran} = req.params;
    if (!id_lampiran) {
        throw new ErrorNotFoundException('Lampiran id tidak ditemukan');
    }

    const lampiran = await lampiranRepo.getLampiranById(id_lampiran);
    if (!lampiran) {
        throw new ErrorNotFoundException('Lampiran tidak ditemukan');
    }

    // hapus file
    const filePath = path.join(__dirname, '../../', 'upload', lampiran.nama_lampiran);
    fs.unlinkSync(filePath);

    // hapus dari db
    await lampiranRepo.deleteLampiranById(id_lampiran);
};

// export module
module.exports = {
    uploadFileLampiran,
    uploadBase64Lampiran,
    getLampiranById,
    deleteLampiranById
};
