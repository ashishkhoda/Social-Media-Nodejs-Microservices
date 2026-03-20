require('dotenv').config();
const express = require('express');
const logger = require('./utils/logger');
const connectDB = require('./config/database');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimiter, sensitiveEndpointLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const routes = require("./routes/identity-service");

const app = express();
const PORT = process.env.PORT || 3001;

//Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    logger.info(`Request received: ${req.method} ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
})
app.use(rateLimiter)
app.use('/api/auth/register', sensitiveEndpointLimiter)

app.use("/api/auth", routes);


app.use(errorHandler)

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        logger.info(`Identity Service running on port ${PORT}`);
    });
}

startServer();

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at ', promise, " reason: ", reason);
})