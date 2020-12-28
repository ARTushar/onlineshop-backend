const dotenv = require('dotenv');
const { FIREBASE_ADMIN_SERVICE } = require('./firebase_admin_service');

dotenv.config();

module.exports = {
	DATABASE_URL: process.env.DATABASE_URL,
	PORT: process.env.PORT,
	WHITELIST: [
		process.env.WHITELIST_1,
		process.env.WHITELIST_2,
		process.env.WHITELIST_3,
		process.env.WHITELIST_4,
	],
	FACEBOOK: {
		clientId: process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET,
	},
	DEFAULT_USER_ID: process.env.DEFAULT_USER_ID,
	FIREBASE_ADMIN: FIREBASE_ADMIN_SERVICE,
	BUCKET_URL: process.env.GOOGLE_CLOUD_BUCKET_URL,
	GCLOUD_APPLICATION_CREDENTIALS: process.env.GCLOUD_APPLICATION_CREDENTIALS,
	PUSHER_CONFIG: {
		appId: process.env.PUSHER_APP_ID,
		key: process.env.PUSHER_KEY,
		secret: process.env.PUSHER_SECRET,
		cluster: process.env.PUSHER_CLUSTER,
		channel: process.env.PUSHER_CHANNEL,
		orderEvent: process.env.PUSHER_ORDER_EVENT,
		questionEvent: process.env.PUSHER_QUESTION_EVENT,
		reviewEvent: process.env.PUSHER_REVIEW_EVENT
	}
};

/*
creating public private key pair

openssl genpkey -algorithm RSA -out rsa_private.pem -pkeyopt rsa_keygen_bits:2048

openssl rsa -in rsa_private.pem -pubout -out rsa_public.pem
writing RSA key
*/
