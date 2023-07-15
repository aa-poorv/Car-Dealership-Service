const ROLES_LIST = require("../config/roles_list");
const verifyRoles = require("../middleware/UserVerify");
const { verifyAccessToken, signAccessToken } = require("../helpers/jwt_helper");
const asyncHandler = require("express-async-handler");
const { connectDB, getDB } = require("../config/mongoConnect");
const express = require("express");
const { ObjectId } = require("mongodb");
const { faker } = require("@faker-js/faker");
const createError = require("http-errors");
const { date } = require("joi");
const router = express.Router();

let db;
connectDB((err) => {
  if (!err) db = getDB();
  else console.log(err);
});

router.post(
  "/buyCar/:id",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.Admin, ROLES_LIST.User),
  asyncHandler(async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const { insertedId } = await db.collection("soldVehicles").insertOne({
        car_id: new ObjectId(id),
        user_id: new ObjectId(userId),
        vin: faker.vehicle.vin(),
      });
      if (!insertedId) return createError.BadRequest();

      const userCarInsert = await db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(userId) },
          { $push: { vehicle_id: insertedId } }
        );
      if (userCarInsert.matchedCount !== 0)
        res.send("New car purchased successfully");
      else return createError.BadRequest();
    } catch (err) {
      next(err);
    }
  })
);

router.get(
  "/dealership-cars/:id",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.Admin, ROLES_LIST.User),
  asyncHandler(async (req, res, next) => {
    try {
      const { cars } = await db
        .collection("dealerships")
        .findOne({ _id: new ObjectId(req.params.id) });
      const allCars = await db
        .collection("cars")
        .find({ _id: { $in: cars } })
        .toArray();
      res.send(allCars);
    } catch (err) {
      next(err);
    }
  })
);

router.get(
  "/dealerships",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.Admin, ROLES_LIST.User),
  asyncHandler(async (req, res, next) => {
    try {
      // const { type } = req.query;
      let carsInDealership = await db
        .collection("cars")
        .find(req.query)
        .toArray();
      carsInDealership = carsInDealership.map((car) => car._id);
      const dealerships = await db
        .collection("dealerships")
        .find({ cars: { $in: carsInDealership } })
        .toArray();
      res.send(dealerships);
    } catch (err) {
      next(err);
    }
  })
);

router.get(
  "/cars",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.Admin, ROLES_LIST.User),
  asyncHandler(async (req, res, next) => {
    try {
      const { vehicle_id } = await db
        .collection("users")
        .findOne({ _id: new ObjectId(req.userId) });
      let carsId = await db
        .collection("soldVehicles")
        .find({ _id: { $in: vehicle_id } })
        .toArray();
      carsId = carsId.map((carId) => carId.car_id);
      const cars = await db
        .collection("cars")
        .find({ _id: { $in: carsId } })
        .toArray();
      res.send(cars);
    } catch (err) {
      next(err);
    }
  })
);

router.get(
  "/deals",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.Admin, ROLES_LIST.User),
  asyncHandler(async (req, res, next) => {
    try {
      let cars = await db.collection("cars").find(req.query).toArray();
      cars = cars.map((car) => car._id.toString());
      const deals = await db
        .collection("deals")
        .find({ cars_id: { $in: cars } })
        .toArray();

      let dealsAvailable = await Promise.all(
        deals.map(async (deal) => {
          const carDeal = await db
            .collection("cars")
            .findOne({ _id: new ObjectId(deal.cars_id) });
          deal.car = carDeal;
          delete deal.cars_id;
          return deal;
        })
      );
      res.send(dealsAvailable);
    } catch (err) {
      next(err);
    }
  })
);

router.get(
  "/deals/:id",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.Admin, ROLES_LIST.User),
  asyncHandler(async (req, res, next) => {
    try {
      const { deals } = await db
        .collection("dealerships")
        .findOne({ _id: new ObjectId(req.params.id) });
      let allDeals = await db
        .collection("deals")
        .find({ _id: { $in: deals } })
        .toArray();

      let dealsAvailable = await Promise.all(
        allDeals.map(async (deal) => {
          const carDeal = await db
            .collection("cars")
            .findOne({ _id: new ObjectId(deal.cars_id) });
          deal.car = carDeal;
          delete deal.cars_id;
          return deal;
        })
      );
      res.send(dealsAvailable);
    } catch (err) {
      next(err);
    }
  })
);

router.get(
  "/dealershipNearby",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.Admin, ROLES_LIST.User),
  asyncHandler(async (req, res, next) => {
    try {
      const { location } = await db
        .collection("users")
        .findOne({ _id: new ObjectId(req.userId) });

      const nearbyDealers = await db
        .collection("dealerships")
        .find({
          loc: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [location[0], location[1]],
              },
              $maxDistance: 80000,
            },
          },
        })
        .toArray();
      res.send(nearbyDealers);
    } catch (err) {
      next(err);
    }
  })
);

module.exports = router;
