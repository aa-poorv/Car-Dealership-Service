const ROLES_LIST = require("../config/roles_list");
const verifyRoles = require("../middleware/UserVerify");
const { verifyAccessToken } = require("../helpers/jwt_helper");
const asyncHandler = require("express-async-handler");
const { faker } = require("@faker-js/faker");
const { connectDB, getDB } = require("../config/mongoConnect");
const express = require("express");
const { ObjectId } = require("mongodb");
const createError = require("http-errors");
const { date } = require("joi");
const router = express.Router();

let db;
connectDB((err) => {
  if (!err) db = getDB();
  else console.log(err);
});

router.post(
  "/addDeal/:id",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Dealer),
  asyncHandler(async (req, res, next) => {
    try {
      const { id } = req.params;
      const dealerId = req.userId;

      const { insertedId } = await db.collection("deals").insertOne(req.body);
      if (!insertedId) throw createError.BadRequest();

      await db
        .collection("dealerships")
        .updateOne(
          { _id: new ObjectId(dealerId) },
          { $push: { deals: insertedId } }
        );
      await db
        .collection("deals")
        .updateOne({ _id: insertedId }, { $set: { cars_id: id } });
      res.send("new deal added successfully");
    } catch (error) {
      next(error);
    }
  })
);

router.get(
  "/AllCars",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.User, ROLES_LIST.Editor, ROLES_LIST.Admin),
  asyncHandler(async (req, res) => {
    res.send(await db.collection("cars").find({}).toArray());
  })
);

router.post(
  "/addCar/:id",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.Dealer, ROLES_LIST.Admin),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const dealerId = req.userId;

    const carAdd = await db
      .collection("dealerships")
      .updateOne(
        { _id: new ObjectId(dealerId) },
        { $push: { cars: new ObjectId(id) } }
      );

    if (carAdd.matchedCount !== 0) {
      res.send("Car added successfully");
    } else {
      res.send("Car not added");
    }
  })
);

router.post(
  "/addSoldCar/:id",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Dealer),
  asyncHandler(async (req, res, next) => {
    try {
      const { id } = req.params;
      const dealer_id = req.userId;

      const vehicle = await db
        .collection("soldVehicles")
        .findOne({ car_id: new ObjectId(id) });
      if (vehicle) {
        let dealsId = [];
        const dealsGroup = await db
          .collection("deals")
          .find({ cars_id: id.toString() })
          .toArray();

        dealsGroup.forEach((deal) => {
          dealsId.push(deal._id);
        });
        console.log(dealsGroup);
        await db
          .collection("dealerships")
          .updateOne(
            { _id: new ObjectId(dealer_id) },
            { $pull: { cars: new ObjectId(id) } }
          );
        const { matchedCount } = await db
          .collection("dealerships")
          .updateOne(
            { _id: new ObjectId(dealer_id) },
            { $push: { sold_vehicles: vehicle._id } }
          );
        await db
          .collection("dealerships")
          .updateOne(
            { _id: new ObjectId(dealer_id) },
            { $pull: { deals: { $in: dealsId } } }
          );
        await db.collection("deals").deleteMany({ cars_id: id.toString() });
        if (matchedCount !== 0) return res.send("Car added in dealership");
        else throw createError[404];
      } else throw createError.BadRequest();
    } catch (error) {
      next(error);
    }
  })
);

router.get(
  "/soldCars",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Dealer),
  asyncHandler(async (req, res, next) => {
    try {
      const { sold_vehicles } = await db
        .collection("dealerships")
        .findOne({ _id: new ObjectId(req.userId) });

      let carsSold = await db
        .collection("soldVehicles")
        .find({
          _id: { $in: sold_vehicles },
        })
        .toArray();

      carsSold = carsSold.map((vehicle) => vehicle.car_id);

      const soldCars = await db
        .collection("cars")
        .find({ _id: { $in: carsSold } })
        .toArray();
      res.send(soldCars);
    } catch (error) {
      next(error);
    }
  })
);

router.get(
  "/deals",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Dealer),
  asyncHandler(async (req, res, next) => {
    try {
      const { deals } = await db
        .collection("dealerships")
        .findOne({ _id: new ObjectId(req.userId) });
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
    } catch (error) {
      next(error);
    }
  })
);

router.get(
  "/vehiclesSold",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Dealer),
  asyncHandler(async (req, res, next) => {
    try {
      const { sold_vehicles } = await db
        .collection("dealerships")
        .findOne({ _id: new ObjectId(req.userId) });
      const vehicle = await db
        .collection("soldVehicles")
        .find({ _id: { $in: sold_vehicles } })
        .toArray();
      res.send(vehicle);
    } catch (err) {
      next(err);
    }
  })
);

module.exports = router;
