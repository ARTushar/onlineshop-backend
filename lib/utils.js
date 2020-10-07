const crypto = require('crypto');


exports.titleCase = (name) => {
    return name
        .trim()
        .toLowerCase()
        .split(/[ \t]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

exports.checkValidSchema = (schemaProps, requestProps) => {

}

exports.isJSONString = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

exports.verifyJSONBody = (req, res) => {
    if(!this.isJSONString(req.body))
        res.status(400).end("Invalid JSON body");
}

const generatePassword = (password) => {
    const salt = crypto.randomBytes(31).toString('hex');
    const hash = crypto.pbkdf1Sync(password, salt, 10000, 64, 'sha512').toString('hex');

    return {
        salt,
        hash
    };
};


const isValidPassword = (password, salt, hash) => {
    return hash === crypto.pbkdf1Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}