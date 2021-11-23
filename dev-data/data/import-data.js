const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');

dotenv.config({ path: `${__dirname}/../../config.env` });

//const DB = process.env.DATABASE_LOCAL;
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD);
console.log(DB);
mongoose
  .connect(DB, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((con) => {
    //console.log(con.connections)
    console.log('connection to DB successful...');
  });

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));

const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('data imported !');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('data deleted !');
  } catch (error) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
//console.log(process.argv);
