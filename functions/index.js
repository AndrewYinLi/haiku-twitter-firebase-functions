const functions = require("firebase-functions");

const express = require("express");
const app = express();

const FBAuth = require("./util/fbAuth");
const { getHaikus, createHaiku } = require("./handlers/haikus");
const { signup, login, uploadImage } = require("./handlers/users");

// routes for haikus
app.get("/get-haikus", getHaikus);
app.post("/create-haiku", FBAuth, createHaiku);
// routes for users
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);

// Good practice to use Express to create multiple routes under /api/
exports.api = functions.https.onRequest(app);
