import dotenv from 'dotenv';
dotenv.config();
import app from './src/app.js';
import config from './config/index.js';

const PORT = config.app.port ;

app.listen(PORT, () => {
  console.log(`WebCapture running on port ${PORT}`);
});
