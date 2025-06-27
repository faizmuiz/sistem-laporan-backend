const { Sequelize, QueryTypes, Op, DataTypes } = require('sequelize')
const dbConfig = require('../config/db.config')['mysql']
const fs = require('fs')
const path = require('path')

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USERNAME, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    port: dbConfig.PORT,
    dialect: dbConfig.DIALECT,
    operatorsAliases: 0,
    pool: dbConfig.OPTIONS,
    logging: dbConfig.LOGGING,
    timezone: dbConfig.TIMEZONE || '+07:00',
});

sequelize
    .authenticate()
    .then(() => {
        console.log("Connected to the database mysql!");
    })
    .catch((err) => {
        console.log("Cannot connect to the database mysql:", err);
    });

const db = {};
const modelsFolder = path.join(__dirname, '../src/model/mysql');
fs.readdirSync(modelsFolder)
    .filter((file) => {
        return !file.startsWith('.') && file !== modelsFolder && file.endsWith('.js')
    })
    .forEach((file) => {
        const model = require(path.join(modelsFolder, file))(sequelize, DataTypes);
        db[model.name] = model;
    })

Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
})

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.Op = Op;
db.QueryTypes = QueryTypes;

module.exports = db;