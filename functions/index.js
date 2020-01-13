const functions = require("firebase-functions");

const express = require("express");
const app = express();

const FBAuth = require("./util/fbAuth");
const { getHaikus, createHaiku } = require("./handlers/haikus");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser
} = require("./handlers/users");

// routes for haikus
app.get("/get-haikus", getHaikus);
app.post("/create-haiku", FBAuth, createHaiku);
// routes for users
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);

// Good practice to use Express to create multiple routes under /api/
exports.api = functions.https.onRequest(app);
