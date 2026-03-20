require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');
const routes = require("./routes/post-routes");
const connectDB = require('./utils/database');
const logger = require('./utils/logger');
const { connectToRabbitMQ } = require('./utils/rabbitmq');

const app = express();
const PORT = process.env.PORT || 3002;

//Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    logger.info(`Post Service: Request received: ${req.method} ${req.url}`);
    logger.info(`Post Service: Request body: ${JSON.stringify(req.body)}`);
    next();
})


// Todo - Rate Limiter

app.use("/api/posts", routes);

app.use(errorHandler)

const startServer = async () => {
    try {
        await connectDB();
        await connectToRabbitMQ();
        app.listen(PORT, () => {
            logger.info(`Post Service running on port ${PORT}`);
        }); 
    } catch (error) {
        logger.error('Error starting server', error);
        process.exit(1);
    }
}

startServer();

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at ', promise, " reason: ", reason);
})