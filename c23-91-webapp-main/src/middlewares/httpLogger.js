import logger from "../config/logger.js";

const httpLogger = (req, res, next) => {
  logger.http(`${req.method} ${req.url}`);
  next();
};

export default httpLogger;
