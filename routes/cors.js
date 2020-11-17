const cors = require('cors');

const { WHITELIST } = require('../config/config');
let corsOptionsDelegate = (req, callback) => {
    var corsOptions;
    // console.log(req.header('Origin'));
    if(WHITELIST.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true };
    } else {
        corsOptions = {origin: false};
    }
    callback(null, corsOptions);
};

exports.cors = cors();
exports.corsWithOptions = cors(corsOptionsDelegate);
