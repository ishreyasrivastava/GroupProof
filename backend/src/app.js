const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');

const healthRoutes = require('./routes/health');
const projectRoutes = require('./routes/projects');
const commitRoutes = require('./routes/commits');
const contributorRoutes = require('./routes/contributors');
const userRoutes = require('./routes/users');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
if (config.nodeEnv !== 'test') app.use(morgan('combined'));
app.use(rateLimiter);

app.use('/api/health', healthRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', commitRoutes);
app.use('/api/projects', contributorRoutes);
app.use('/api/users', userRoutes);

app.use(errorHandler);

module.exports = app;
