const dotenv = require('dotenv');
const { FIREBASE_ADMIN_SERVICE } = require('./firebase_admin_service');

dotenv.config();

module.exports = {
    DATABASE_URL: process.env.DATABASE_URL,
    PORT:  process.env.PORT,
    WHITELIST: [process.env.WHITELIST_1, process.env.WHITELIST_2, process.env.WHITELIST_3],
    FACEBOOK: {
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET
    },
    FIREBASE_ADMIN: FIREBASE_ADMIN_SERVICE

};


/*
creating public private key pair

openssl genpkey -algorithm RSA -out rsa_private.pem -pkeyopt rsa_keygen_bits:2048

openssl rsa -in rsa_private.pem -pubout -out rsa_public.pem
writing RSA key
*/