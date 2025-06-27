const multer = require('multer');
const path = require('path');
const { v7: uuidv7 } = require('uuid');

// Konfigurasi penyimpanan file dengan multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../', 'upload')); 
    },
    filename: (req, file, cb) => {
        const fileName = `${uuidv7()}${path.extname(file.originalname)}`; 
        cb(null, fileName);
    },
});

// Validasi tipe file yang diterima
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipe file tidak didukung'), false);
    }
};

// Konfigurasi multer
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter,
});

// Middleware untuk single file upload
const uploadSingleFile = upload.single('file');

module.exports = {
    uploadSingleFile,
};
