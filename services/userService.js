const { successResponse, errorResponse } = require('../utils/responseWrapper');

async function fetchUsers() {
  try {
    const response = await fetch('http://event.com/getUsers');
    const data = await response.json();
    return successResponse(data, 'Fetched users successfully', 200);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return errorResponse(error.message, 'Unable to retrieve users', 502);
  }
}

module.exports = {
  fetchUsers,
};
