const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth");
const dealerRouter = require("./routes/dealership");
const userRouter = require("./routes/user");
const createError = require("http-errors");
const { verify } = require("jsonwebtoken");
require("dotenv").config();

// db.createCollection("users");

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/auth", authRouter);
app.use("/dealer", dealerRouter);
app.use("/user", userRouter);

app.get("/", async (req, res) => {
  res.send("Hello Welcome to home page");
});

app.use(async (req, res, next) => {
  next(createError.NotFound("This route does not exist"));
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      staus: err.status || 500,
      message: err.message,
    },
  });
});

app.listen(3000, () => {
  console.log("Serving your app");
});
