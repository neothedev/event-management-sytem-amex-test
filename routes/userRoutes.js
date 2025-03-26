const userController = require('../controllers/userController');

async function userRoutes(fastify, options) {
  fastify.get('/getUsers', userController.getUsers);
}

module.exports = userRoutes;
