const fs = require('fs');
const path = require('path');
const express = require('express');

const router = express.Router();

// router.get('/', (req, res) => {
//     res.status(200).json({
//         response: {},
//         metaData: {
//             message: "Server Connected",
//             code: 200,
//             response_code: "0000"
//         }
//     });
// });

router.get('/', (req, res) => {
    res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>API Sistem Laporan</title>
        </head>
        <body>
            <h1>API Sistem Laporan Berjalan</h1>
            <p>Server berhasil terhubung</p>
        </body>
        </html>
    `);
});

// Get all route files in the directory
const routeFiles = fs.readdirSync(__dirname).filter(file => file !== 'index.js' && file.endsWith(".route.js") );

// Import all route files
routeFiles.forEach(file => {
    const route = require(path.join(__dirname, file));
    router.use('/', route);
});

module.exports = router;
