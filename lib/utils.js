const crypto = require('crypto');


exports.titleCase = (name) => {
    return name
        .trim()
        .toLowerCase()
        .split(/[ \t]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

exoprts.addCountryCode = (num) => {
    if (num.match(/^+880[0-9]{10}/)){
        return num;
    } else if(num.match(/^880[0-9]{10}/)){
        return "+" + num;
    } else if(num.match(/^0[0-9]{10}/)){
        return "+88" + num;
    } else {
        return num;
    }
}

const calculateDiscountedPrice = (price, discount) => price - discount * price * 0.01

exports.calculateTotalPrice = (products) => {
    return products.reduce((total, product) => total + this.calculateDiscountedPrice(product.price, product.discount), 0) 
}

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