'use strict';

// load modules
const cors = require("cors");
const express = require('express');
const morgan = require('morgan');
const routes = require('./routes.js');
const { sequelize } = require("./models");

// variable to enable global error logging
const enableGlobalErrorLogging = process.env.ENABLE_GLOBAL_ERROR_LOGGING === 'true';

// create the Express app
const app = express();

// Enable All CORS Requests
app.use(cors());

app.use(express.json());

// setup morgan which gives us http request logging
app.use(morgan('dev'));

// setup a friendly greeting for the root route
app.get('/', (req, res) => {
  res.json({
    message: 'To-Do-App-Api Api By @tford-dev.',
  });
});

app.use('/api', routes);

// send 404 if no other route matched
app.use((req, res) => {
  res.status(404).json({
    message: 'Route Not Found',
  });
});

// setup a global error handler
app.use((err, req, res, next) => {
  if (enableGlobalErrorLogging) {
    console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
  }

  res.status(err.status || 500).json({
    message: err.message,
    error: {},
  });
});

// set our port
app.set('port', process.env.PORT || 5000);

//Async function to connect database to express
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Application is now connected to database.');
  } catch (error) {
    console.error('Error when connecting to database:', error);
  }
})();


// start listening on our port
sequelize.sync()
  .then(()=> {
    const server = app.listen(app.get('port'), () => {
      console.log(`Application is up and running on port ${server.address().port}`);
    });
})

