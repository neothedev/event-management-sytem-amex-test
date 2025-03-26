function successResponse(data, message = 'OK', status = 200) {
  return {
    status,
    success: true,
    message,
    data,
  };
}

function errorResponse(error, message = 'Something went wrong', status = 500) {
  return {
    status,
    success: false,
    message,
    error,
  };
}

module.exports = {
  successResponse,
  errorResponse,
};
