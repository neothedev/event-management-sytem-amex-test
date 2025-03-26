require('dotenv').config();
require('./utils/configLoader');
const port = process.env.PORT || 4000;

const fastify = require('fastify')({ logger: true });
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const listenMock = require('./mock-server');

fastify.register(userRoutes);
fastify.register(eventRoutes);

fastify.listen({ port: port }, (err) => {
  listenMock();
  if (err) {
    fastify.log.error(err);
    process.exit();
  }
});
