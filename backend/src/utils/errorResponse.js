const errorResponse = (message) => ({
  success: false,
  data: null,
  error: message,
});

module.exports = errorResponse;
