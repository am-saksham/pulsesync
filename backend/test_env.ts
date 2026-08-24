import 'dotenv/config';
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET length:", process.env.GOOGLE_CLIENT_SECRET?.length || 0);
