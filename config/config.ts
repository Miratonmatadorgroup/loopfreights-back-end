
export const config = {
    production: process.env.PRODUCTION,
    jwtSecret: process.env.JWT_SECRET,
    mongoDbUrl: process.env.MONGODB_URI,
    sendGridApiKey: process.env.SENDGRID_API_KEY,
    paystackAuthorization: process.env.PAYSTACK_AUTHORIZATION,
    googleApiKey: process.env.GOOGLE_API_KEY,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsAccessKey: process.env.AWS_ACCESS_KEY
};
