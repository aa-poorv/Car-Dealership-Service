const { MongoClient } = require("mongodb");
const { faker } = require("@faker-js/faker");
require("dotenv").config();
const bcrypt = require("bcryptjs");

let db;
let user;
let dealership;
// let car;

async function connectToMongoDB() {
  const uri = "mongodb://127.0.0.1:27017/";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    db = client.db("userRegister");
    user = db.collection("users");
    car = db.collection("cars");
    dealership = db.collection("dealerships");

    // Perform database operations here

    return client; // Return the connected client
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

// Call the connectToMongoDB function and await the returned client
connectToMongoDB()
  .then(async (client) => {
    // Access the database using the connected client
    // Perform additional operations or close the connection
    async function userSeed() {
      for (let i = 0; i < 10; i++) {
        const realpassword = faker.internet.password();
        await user.insertOne({
          name: faker.person.fullName(),
          email: faker.internet.email(),
          realPassword: realpassword,
          password: await bcrypt.hash(realpassword, 10),
          location: faker.location.nearbyGPSCoordinate({
            origin: [77.8602000209348, 22.593919357290275],
            radius: 200,
            isMetric: true,
          }),
          refreshToken: [],
          roles: {
            User: 2001,
          },
          vehicle_id: [],
        });
      }
    }

    const dealershipSeed = async () => {
      for (let i = 0; i < 7; i++) {
        const realpassword = faker.internet.password();
        await dealership.insertOne({
          name: faker.company.name(),
          address: faker.location.streetAddress(),
          city: faker.location.city(),
          website: faker.internet.url(),
          email: faker.internet.email(),
          realPassword: realpassword,
          password: await bcrypt.hash(realpassword, 10),
          loc: {
            type: "Point",
            coordinates: faker.location.nearbyGPSCoordinate({
              origin: [77.8602000209348, 22.593919357290275],
              radius: 200,
              isMetric: true,
            }),
          },
          cars: [],
          deals: [],
          sold_vehicles: [],
          refreshToken: [],
          roles: {
            Dealer: 1984,
          },
        });
      }
    };

    const carsSeed = async () => {
      for (let i = 0; i < 20; i++) {
        await car.insertOne({
          manufacturer: faker.vehicle.manufacturer(),
          model: faker.vehicle.model(),
          type: faker.vehicle.type(),
          year: faker.number.int({ min: 1990, max: 2020 }),
          color: faker.vehicle.color(),
          price: faker.commerce.price(),
          description: faker.lorem.paragraph(),
        });
      }
    };

    dealershipSeed();
    carsSeed();
    userSeed();
    await dealership.createIndex({ loc: "2dsphere" });
    setTimeout(() => {
      client.close();
    }, 100000);
  })
  .catch((error) => {
    // Handle any connection errors
    console.error("Error:", error);
  });

// console.log("data seeded successfully");
