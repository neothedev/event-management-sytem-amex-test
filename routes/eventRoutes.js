const eventController = require('../controllers/eventController');

async function eventRoutes(fastify, options) {
  fastify.post('/addEvent', eventController.addEvent);
  fastify.get('/getEvents', eventController.getEvents);
  fastify.get('/getEventsByUserId/:id', eventController.getEventsByUserId);
}

module.exports = eventRoutes;
