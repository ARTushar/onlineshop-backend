const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    DATABASE_URL: process.env.DATABASE_URL,
    PORT:  process.env.PORT,
    WHITELIST: [process.env.WHITELIST_1, process.env.WHITELIST_2, process.env.WHITELIST_3]
};


/*
creating public private key pair

openssl genpkey -algorithm RSA -out rsa_private.pem -pkeyopt rsa_keygen_bits:2048

openssl rsa -in rsa_private.pem -pubout -out rsa_public.pem
writing RSA key 
*/