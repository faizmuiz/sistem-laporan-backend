module.exports = {
    mysql: {
        HOST: process.env.MYSQL_HOST || "",
        PORT: process.env.MYSQL_PORT || "3306",
        USERNAME: process.env.MYSQL_USER || "laporker_admin",
        PASSWORD: process.env.MYSQL_PASS || "",
        DB: process.env.MYSQL_DB || "laporker_sistem_laporan",
        DIALECT: "mysql",
        TIMEZONE: "+07:00",
        OPTIONS: {
            max: 20,
            min: 5,
            acquire: 60000,
            idle: 30000,
            connectTimeout: 60000,
            dialectOptions: {
                ssl: {                   // koneksi publik
                    require: true,
                    rejectUnauthorized: false
                }
            }
        },
        LOGGING: process.env.NODE_ENV === 'development' ? console.log : false
    },
    // redis: {
    //     HOST: process.env.REDIS_HOST || '127.0.0.1',
    //     PORT: process.env.REDIS_PORT || '3305',
    //     PASSWORD: process.env.REDIS_PASS || 'redis_pass',
    //     DB: process.env.REDIS_DB || 0
    // },
}  