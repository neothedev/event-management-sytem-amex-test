# Project Overview

This project is a Node.js application built with Fastify. Below is the structure of the `src` folder and a brief description of its contents.

## Folder Structure

src/
├── .prettierrc
├── package.json
├── startup.js
├── config/
│ ├── .env.development
│ ├── .env.production
│ ├── .env.test
│ └── config.js
├── controllers/
│ ├── eventController.js
│ └── userController.js
├── mock-server/
│ ├── index.js
│ └── mocks/
│ └── user.json
├── routes/
│ ├── eventRoutes.js
│ └── userRoutes.js
├── services/
│ ├── eventService.js
│ └── userService.js
└── utils/
├── circuitBreaker.js
├── configLoader.js
├── logger.js
└── responseWrapper.js

## Changes Made to the initial challenge:

## TASK 1

    Pulled all the server initialization code to 'startup.js' file and moved it to root folder. Had to change the scripts in package.json to adjust to this change.

    In this file,

    I am loading the environment variables and configuration.  I have used dotenv package for this.

    I am registering routes required.

    Why did i change the structure this way?

    - Did this to separate startup logic into a separate file and moving it to root helps us to maintain the logic in centralized place.
    - Also, this enables us to initialize any external dependencies such as database connections that might be added in future.

    Extracted routes logic to two separate files namely
    **userRoutes.js** and
    **eventRoutes.js**
    and moved them to routes folder.

    Extracted controller logic to two separate files namely
    **userController.js** and
    **eventController.js**
    and moved them to controllers folder.

    Extracted service logic to two separate files namely
    **userService.js**
    **eventService.js**
    and moved them to services folder.

    Extracted all the config to config folder and created different files for each environment namely development, production, test. This helps us store config in a singular place and also this can be used when containerizing the application using docker or k8s etc.

    I set addEvents url in config files and am getting it from config files to service,
     have to pull all other urls to config files(didnt implement).

    Updated packages.json scripts to load particular env file based on the intention of the developer.

    Created **responseWrapper.js** file and added two functions one for **success response** and another for **error response** with default properties for message and status which can be customized by the callers.

    These functions are being used in services.

    ## SCOPE OF IMPROVEMENT:

    Unit testing. use any framework and add unit tests for all the components. Maintain code coverage to an accepted percentage.

    Write a wrapper function over controllers that implements better logs, metrics etc. that can help have better  observability of metrics and logs which enables us to use any service like kibana, splunk or grafana.

    Introduce schema validations in routes. This can help us validate the request and also implement rate limiting if required. Also, we can implement required fields in the request received.

    Add middleware for authentication and autorization based on http headers depending on the implementation requirements.

    Improve documentation to help the reader understand what each api is doing and providing a sample request and response. Swagger can be used to get this documentation up and running.

## TASK 2 IMPROVE PERFORMANCE

    To improve performance of getEventsByUserId api, I have implemented promises.

    Previous code with for loop:

    for(let i = 0; i < userEvents.length; i++) {
        const event = await fetch('http://event.com/getEventById/' + userEvents[i]);
        const eventData = await event.json();
        eventArray.push(eventData);
    }

    In the above for loop, url is being called in each iteration of the loop. This is limiting us to call one url once during a particular time.

     const eventPromises = userData.events.map((eventId) =>
      fetch(`http://event.com/getEventById/${eventId}`).then((response) =>
        response.json()
      )
    );
    const eventArray = await Promise.all(eventPromises);

    In the above code i am mapping eventId to each promise so that they can run concurrently.

## TASK 3 IMPROVE RESILIENCY

I have implemented circuitBreaker to handle third task:

its implemented in **cricuitBreaker.js** file in **utils** folder

- ## Detect when the external service is consistently failing (3+ failures within a 30-second window)

  Implemented the following functions to check if the external service is continously failing. Getting the failureWindow value from config. Every time a request fails, the timestamp is pushed into the failures array.

  function recordFailure() {
  const now = Date.now();
  failures.push(now);
  failures = failures.filter((ts) => now - ts <= failureWindow);
  lastFailureTime = now;
  }

  function shouldOpenCircuit() {
  return failures.length >= failureThreshold;
  }

  If the number of failures exceeds failureThreshold (getting this number from config. its set to 3 in this case), the circuit is opened by the following code.

  if (shouldOpenCircuit()) {
  state = 'OPEN';
  log('Too many failures. Circuit is now OPEN.');
  }

- ## Implement a backoff/retry mechanism that reduces the load on the external service during failure periods

  To achieve this the backoff is caluculated in the following line.

  backoff = Math.min(backoff \* 2, maxBackoff);

  If the service is failing and circuit is OPEN (consecutive 3 failures in 30 secs window) a testRequest to the external service will trigger only after a delay. That delay is backoff that is calculated above. If the test fails the backoff is doubled to reduce the load on the external service.

- ## Gradually test if the service has recovered and resume normal operations when it's available again

  async function tryRecovery() {
  if (!testRequest || checkingRecovery || !isBackoffComplete()) return;

  checkingRecovery = true;

  const success = await testRequest();
  if (success) {
  failures = [];
  backoff = initialBackoff;
  state = 'CLOSED';
  log('Recovery test passed. Circuit CLOSED.');
  } else {
  backoff = Math.min(backoff \* 2, maxBackoff);
  log('Recovery test failed. Increasing backoff.');
  }

  checkingRecovery = false;
  }

  When the circuit is in OPEN state tryRecovery() function is called before each request.
  If backoff time is exceeded then a testRequest() is triggered to check if the service is back up or not.
  If service is up and running circuit is closed and all traffic resumes to normal state.
  If serviec is still failing circuit will be kept open and backoff is doubled.

- ## Provide appropriate error responses to clients when the external service is unavailable

  if (state === 'OPEN') {
  await tryRecovery();
  if (state === 'OPEN') {
  return {
  status: 503,
  error: 'Service is temporarily unavailable due to repeated failures.',
  message: `Circuit breaker is OPEN. Retry after backoff of ${Math.round(backoff / 1000)} seconds.`,
  };
  }
  }

  When circuit is open the caller will get the explanation of the failure and also information about when they can retry.
