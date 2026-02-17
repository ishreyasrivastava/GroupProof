require('dotenv').config();
const app = require('./src/app');
const config = require('./src/config');

const server = app.listen(config.port, () => {
  console.log(`🚀 GroupProof API running on port ${config.port} [${config.nodeEnv}]`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = server;
