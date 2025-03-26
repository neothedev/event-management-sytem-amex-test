const eventService = require('../services/eventService');

async function addEvent(request, reply) {
  try {
    const eventData = {
      id: new Date().getTime(),
      ...request.body,
    };

    const result = await eventService.addEvent(eventData);
    reply.status(result.status || 200).send(result);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
}

async function getEvents(request, reply) {
  try {
    const result = await eventService.getAllEvents();
    reply.status(result.status || 200).send(result);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
}

async function getEventsByUserId(request, reply) {
  try {
    const { id } = request.params;
    const result = await eventService.getEventsByUserId(id);
    reply.status(result.status || 200).send(result);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
}

module.exports = {
  addEvent,
  getEvents,
  getEventsByUserId,
};
