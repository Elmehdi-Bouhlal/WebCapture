import dotenv from 'dotenv';
dotenv.config();

export default {
  app: {
    port: process.env.PORT || 3002,
    env: process.env.NODE_ENV || 'dev',
  }
};