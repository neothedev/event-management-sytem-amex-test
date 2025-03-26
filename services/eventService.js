const createCircuitBreaker = require('../utils/circuitBreaker');
const { ADD_EVENT_API_URL, circuitBreaker } = require('../config/config');
const { successResponse, errorResponse } = require('../utils/responseWrapper');

async function getAllEvents() {
  try {
    const response = await fetch('http://event.com/getEvents');
    const data = await response.json();
    return successResponse(data);
  } catch (error) {
    return errorResponse(error.message, 'Failed to fetch events', 502);
  }
}

async function getEventsByUserId(userId) {
  try {
    const userResponse = await fetch(`http://event.com/getUserById/${userId}`);
    const userData = await userResponse.json();

    const eventPromises = userData.events.map((eventId) =>
      fetch(`http://event.com/getEventById/${eventId}`).then((response) =>
        response.json()
      )
    );
    const eventArray = await Promise.all(eventPromises);

    return successResponse(eventArray);
  } catch (error) {
    return errorResponse(error.message, 'Failed to fetch user events', 502);
  }
}

async function addEvent(eventDetails) {
  const result = await withAddEventBreaker(addEventFn, [eventDetails]);

  if (result.status === 200) {
    return successResponse(result.data, result.message, result.status);
  }

  return errorResponse(result.error, result.message, result.status);
}

const addEventFn = async (eventDetails) => {
  const response = await fetch(ADD_EVENT_API_URL, {
    method: 'POST',
    body: JSON.stringify(eventDetails),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`External service returned ${response.status}: ${body}`);
  }
  return await response.json();
};

const testAddEvent = async () => {
  try {
    const response = await fetch(ADD_EVENT_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        id: Date.now(),
        name: 'Health Check',
        userId: '1',
        timestamp: new Date().toISOString(),
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
};

const withAddEventBreaker = createCircuitBreaker({
  ...circuitBreaker.addEvent,
  testRequest: testAddEvent,
});

module.exports = {
  addEvent,
  getAllEvents,
  getEventsByUserId,
};
