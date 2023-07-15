const JWT = require("jsonwebtoken");
const createError = require("http-errors");
const { connectDB, getDB } = require("../config/mongoConnect");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
require("dotenv").config();

let db;
connectDB((err) => {
  if (!err) db = getDB();
  else console.log(err);
});

console.log(db);

module.exports = {
  signAccessToken: async (userId) => {
    let validUser = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });
    if (!validUser) {
      validUser = await db
        .collection("dealerships")
        .findOne({ _id: new ObjectId(userId) });
    }
    if (!validUser) return createError.Unauthorized();
    const rol = Object.values(validUser.roles).filter(Boolean);
    return new Promise((resolve, reject) => {
      const payload = { roles: rol };
      const secret = process.env.ACCESS_TOKEN_SECRET;
      const options = {
        expiresIn: "10m",
        issuer: "nervesparks.com",
        audience: userId.toString(),
      };
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) return reject(createError.InternalServerError());
        resolve(token);
      });
    });
  },

  verifyAccessToken: (req, res, next) => {
    if (!req.headers["authorization"]) return next(createError.Unauthorized());
    const authHeader = req.headers["authorization"];
    const bearToken = authHeader.split(" ");
    const token = bearToken[1];
    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
      if (err) {
        // if (err.name === "JsonwebTokenError") {
        //   return next(createError.Unauthorized());
        // } else {
        //   return next(createError.Unauthorized(err.message));
        // }
        const message =
          err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
        return next(createError.Unauthorized(message));
      }
      req.roles = payload.roles;
      req.userId = payload.aud;
      next();
    });
  },
  signRefreshToken: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {};
      const secret = process.env.REFRESH_TOKEN_SECRET;
      const options = {
        expiresIn: "1y",
        issuer: "nervesparks.com",
        audience: userId.toString(),
      };
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message);
          reject(createError.InternalServerError());
        }
        resolve(token);
      });
    });
  },
  verifyRefreshToken: (refreshToken) => {
    return new Promise((resolve, reject) => {
      JWT.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, payload) => {
          if (err) return reject(createError.Unauthorized());
          const userId = payload.aud;
          resolve(userId);
        }
      );
    });
  },
  checkUser: async function (email, password) {
    const foundUser = await db.collection("users").findOne({ email: email });
    const foundDealer = await db
      .collection("dealerships")
      .findOne({ email: email });
    let isValid = false;
    if (foundUser) {
      isValid = await bcrypt.compare(password, foundUser.password);
    } else if (foundDealer) {
      isValid = await bcrypt.compare(password, foundDealer.password);
    }

    if (isValid && foundUser) return foundUser;
    else if (isValid && foundDealer) return foundDealer;
    else return false;
  },
};
