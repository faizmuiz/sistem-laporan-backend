const crypto = require('crypto');
const bcrypt = require('bcrypt');
const configKey = require('../config/aes.config');

class EncryptDecryptClass {
    constructor() {
        this.AES_METHOD = 'aes-256-cbc';
        this.IV_LENGTH = 16; // For AES, this is always 16, checked with php
        this.SALTROUNDS = 10; // bcrypt
        this.KEY = configKey.KEY; // Must be 256 bytes (32 characters)
        this.IV = configKey.IV;
    }

    encrypt(text) {
        if (process.versions.openssl <= '1.0.1f') {
            throw new Error('OpenSSL Version too old, vulnerability to Heartbleed');
        }

        let cipher = crypto.createCipheriv(this.AES_METHOD, Buffer.from(this.KEY), this.IV);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return encrypted;
    }

    decrypt(text) {
        try {
            let decipher = crypto.createDecipheriv(this.AES_METHOD, Buffer.from(this.KEY), this.IV);
            let decrypted = decipher.update(text, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            return null;
        }
    }

    encryptBcrypt(pass) {
        return bcrypt.hashSync(pass, this.SALTROUNDS);
    }

    async checkBcrypt(text, hash) {
        return await bcrypt.compare(text, hash.replace(/^\$2y(.+)$/i, '$2a$1'));
    }

    generateCode(digit = 5) {
        let result = '';
        const characters = '0123456789';

        for (let i = 0; i < digit; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters.charAt(randomIndex);
        }

        return result;
    }
}

module.exports = EncryptDecryptClass;
