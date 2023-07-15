const express = require("express");
const verifyRoles = require("../middleware/UserVerify");
const ROLES_LIST = require("../config/roles_list");
const { connectDB, getDB } = require("../config/mongoConnect");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const createError = require("http-errors");
require("dotenv").config();
const { ObjectId } = require("mongodb");

let db;
connectDB((err) => {
  if (!err) db = getDB();
  else console.log(err);
});

console.log(db);
const {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  checkUser,
} = require("../helpers/jwt_helper");
const { verify } = require("jsonwebtoken");
const { object } = require("joi");
const router = express.Router();

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  const { jwt } = req.cookies;

  const validUser = await checkUser(email, password);
  if (validUser) {
    const accessToken = await signAccessToken(validUser._id);
    const refreshToken = await signRefreshToken(validUser._id);
    const refreshTokenArray = !jwt
      ? validUser.refreshToken
      : validUser.refreshToken.filter((rt) => rt !== jwt);

    validUser.refreshToken = [...refreshTokenArray, refreshToken];
    const { matchedCount } = await db
      .collection("users")
      .updateOne(
        { _id: validUser._id },
        { $set: { refreshToken: validUser.refreshToken } }
      );
    if (matchedCount === 0) {
      await db
        .collection("dealerships")
        .updateOne(
          { _id: validUser._id },
          { $set: { refreshToken: validUser.refreshToken } }
        );
    }
    res.cookie("jwt", refreshToken);
    res.send({ accessToken });
  } else {
    res.send("Sorry Something is wrong");
  }
});

router.post("/register", async (req, res, next) => {
  try {
    let { username, password } = req.body;
    password = await bcrypt.hash(password, 10);
    const doesExist = await db
      .collection("users")
      .findOne({ username: username });
    if (doesExist) {
      throw createError.Conflict(`${username} is already been registered`);
    }

    const { insertedId } = await db.collection("users").insertOne({
      username,
      password,
      refreshToken: [],
      roles: {
        User: 2001,
        Editor: undefined,
        Admin: undefined,
      },
    });

    const accessToken = await signAccessToken(insertedId);
    const refrToken = await signRefreshToken(insertedId);
    await db
      .collection("users")
      .updateOne({ _id: insertedId }, { $push: { refreshToken: refrToken } });

    res.cookie("jwt", refrToken);
    res.send(accessToken);
  } catch (error) {
    next(error);
  }
});

router.post("/refresh-token", async (req, res, next) => {
  try {
    const { jwt } = req.cookies;
    if (!jwt) throw createError.BadRequest();
    let validUser = await db.collection("users").findOne({ refreshToken: jwt });
    if (!validUser) {
      validUser = await db
        .collection("dealerships")
        .findOne({ refreshToken: jwt });
    }

    if (!validUser) {
      const userId = await verifyRefreshToken(jwt);
      let us = await db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) });
      if (!us) {
        us = await db
          .collection("dealerships")
          .findOne({ _id: new ObjectId(userId) });
      }
      if (!us) throw createError.BadRequest();
      us.refreshToken = [];
      return await db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(userId) },
          { $set: { refreshToken: us.refreshToken } }
        );
    }

    const refreshTokenArray = validUser.refreshToken.filter((rt) => rt !== jwt);

    const userId = await verifyRefreshToken(jwt);

    const accessToken = await signAccessToken(userId);
    const refToken = await signRefreshToken(userId);
    res.clearCookie("jwt");
    res.cookie("jwt", refToken);
    validUser.refreshToken = [...refreshTokenArray, refToken];
    const { modifiedCount } = await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: { refreshToken: validUser.refreshToken } }
      );

    if (modifiedCount === 0) {
      await db
        .collection("dealerships")
        .updateOne(
          { _id: new ObjectId(userId) },
          { $set: { refreshToken: validUser.refreshToken } }
        );
    }
    res.send({ accessToken });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const { jwt } = req.cookies;
    const userId = await verifyRefreshToken(jwt);
    let us = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });
    if (!us) {
      us = await db
        .collection("dealerships")
        .findOne({ _id: new ObjectId(userId) });
    }
    if (!us) throw createError.BadRequest();
    const refreshTokenArray = us.refreshToken.filter((rt) => rt !== jwt);
    us.refreshToken = [...refreshTokenArray];
    const { matchedCount } = await db
      .collection("users")
      .updateOne({ _id: us._id }, { $set: { refreshToken: us.refreshToken } });
    if (matchedCount === 0) {
      await db
        .collection("dealerships")
        .updateOne(
          { _id: us._id },
          { $set: { refreshToken: us.refreshToken } }
        );
    }
    res.clearCookie("jwt");
    return res.redirect(200, "/users/login");
  } catch (error) {
    next(error);
  }
});

router.post(
  "/changePassword",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Dealer, ROLES_LIST.User),
  async (req, res, next) => {
    try {
      const { password } = req.body;
      const presentUser = await db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(req.userId) },
          {
            $set: {
              realPassword: password,
              password: await bcrypt.hash(password, 10),
            },
          }
        );
      if (presentUser.modifiedCount === 0) {
        presentUser = await db
          .collection("users")
          .updateOne(
            { _id: new ObjectId(req.userId) },
            {
              $set: {
                realPassword: password,
                password: await bcrypt.hash(password, 10),
              },
            }
          );
      }

      if (presentUser.modifiedCount > 0)
        res.send("Passwords have been updated");
      else throw createError.BadRequest();
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
