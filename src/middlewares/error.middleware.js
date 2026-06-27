import logger from '../utils/logger.js';

const errorMiddleware = (err, req, res, next) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  return res.status(500).json({
    success: false,
    message: 'Something went wrong',
    ...(process.env.NODE_ENV === 'dev' && { stack: err.stack }),
  });
};

export default errorMiddleware;