const { MongoClient } = require("mongodb");
const { connect } = require("./routes/user");
require("dotenv").config();

let db;

const connectDB = async () => {
  MongoClient.connect(process.env.MONGODB_URI).then((client) => {
    dbConnection = client.db();
    dbConnection.createCollection("users", function (err, res) {
      if (err) throw err;
      console.log("Collection created!");
    });
    dbConnection.createCollection("cars", function (err, res) {
      if (err) throw err;
      console.log("Collection created!");
    });
    dbConnection.createCollection("dealership", function (err, res) {
      if (err) throw err;
      console.log("Collection created!");
    });
    dbConnection.createCollection("deals", function (err, res) {
      if (err) throw err;
      console.log("Collection created!");
    });
  });
};

connectDB();
