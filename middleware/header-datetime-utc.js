const dayjs = require('dayjs');
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

module.exports = (req, res, next) => {
    try {
        // set datetime UTC now
        req.datetime = dayjs.utc().format();
       
        next();
    } catch (error) {
        next(error);
    }
}
