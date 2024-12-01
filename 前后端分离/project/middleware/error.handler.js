const errorHandler = (err, req, res, next) => {
  console.error('错误详情:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    headers: req.headers
  });

  // API 错误
  if (err.response) {
    return res.status(err.response.status).json({
      error: err.message,
      details: err.response.data
    });
  }

  // 其他错误
  res.status(500).json({
    error: err.message || 'Internal Server Error'
  });
};

module.exports = errorHandler; 