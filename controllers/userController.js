const userService = require('../services/userService');

async function getUsers(request, reply) {
  try {
    const result = await userService.fetchUsers();
    reply.status(result.status).send(result);
  } catch (error) {
    reply.status(500).send({
      success: false,
      message: 'Unexpected server error',
      error: error.message,
    });
  }
}

module.exports = {
  getUsers,
};
