// library
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");

// exception
const ErrorQueryException = require('../../exception/error-query.exception').ErrorQueryException;

// utility
const errorFormat = require('../../utility/error-format');

// model
const db = require('../../database/mysql.connection');
const autentikasi = db.autentikasi;
const pengguna = db.pengguna;
const jabatan = db.jabatan;

// find login by email
const findLogin = async (email) => {
    try {
        let config = {};
        config.where = {
            email: email
        }

        config.include = [
            {
                model: jabatan,
                as: 'jabatan',
                attributes: ['id_jabatan', 'jabatan', 'divisi', 'level']
            }
        ]

        return await pengguna.findOne(config);
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    };
};

// generate token
const generateToken = (pengguna) => {
    try {
        return jwt.sign({
            id_pengguna: pengguna.id_pengguna,
            email: pengguna.email,
            id_jabatan: pengguna.jabatan.id_jabatan,
            level: pengguna.jabatan.level
        }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
    } catch (error) {
        console.error('Error generating token:', err);
        throw new Error('Error generating token');
    };
};

// create request
const createRequest = async (data) => {
    try {
        const email = data.email; 
        const userExists = await pengguna.findOne({ where: { email } });

        if (!userExists) {
            throw new ErrorQueryException(`Email ${email} tidak terdaftar di sistem.`);
        }

        return await autentikasi.create(data);
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// find request by email
const findRequestByEmail = async (email) => {
    try {
        const requests = await autentikasi.findAll({
            where: { email, otp_status: 1 },
            order: [['requested_at', 'DESC']] 
        });

        if (requests.length > 1) {
            const latestRequest = requests[0];

            const otherRequestIds = requests.slice(1).map(request => request.id_auth);

            if (otherRequestIds.length > 0) {
                await autentikasi.update(
                    { otp_status: 0 },
                    { where: { id_auth: otherRequestIds } } 
                );
            }

            return latestRequest; 
        }

        return requests[0] || null;
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// find request by otp
const findRequestByCode = async (otp) => {
    try {
        return await autentikasi.findOne({ where: { otp, otp_status: 1 } });
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// update status
const updateRequestStatus = async (id, status) => {
    try {
        return await autentikasi.update({ otp_status: status }, { where: { id_auth: id } });
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// find pengguna by email
const findPenggunaByEmail = async (email) => {
    try {
        return await pengguna.findOne({ where: { email } });
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// update password
const updatePassword = async (newPassword, id_pengguna) => {
    try {
        if (!newPassword || !id_pengguna) {
            throw new ErrorQueryException('Password and id_pengguna are required.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const [updated] = await pengguna.update(
            { password: hashedPassword }, 
            { where: { id_pengguna } }
        );

        return updated > 0; 
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// get detail pengguna by id_pengguna
const getDetailLogin = async (id_pengguna) => {
    try {
        let config = {};
        config.where = {
            id_pengguna: id_pengguna
        };

        config.include = [
            {
                model: jabatan,
                as: 'jabatan',
                attributes: ['id_jabatan', 'jabatan', 'divisi', 'level']
            }
        ];

        return await pengguna.findOne(config);
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// export module 
module.exports = {
    findLogin,
    generateToken,
    createRequest,
    findRequestByEmail,
    findRequestByCode,
    updateRequestStatus,
    findPenggunaByEmail,
    updatePassword,
    getDetailLogin
};