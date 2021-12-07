const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

//HANDLE UNCAUGHT EXCEPTION : BUGS
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('application shutting down');
  process.exit(1);
});

const app = require('./app');

//const DB = process.env.DATABASE_LOCAL;
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD);
mongoose
  .connect(DB, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((con) => {
    //console.log(con.connections)
    console.log('connection to database is successful...');
  });

//console.log(process.env)

const port = process.env.PORT;
const server = app.listen(3000, () => {
  console.log(`app running on port ${port}...`);
});

// HANLDE ALL PROMISE REJECTIONS
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('application shutting down');
  server.close(() => {
    //to shutdown the app
    process.exit(1);
  });
});
