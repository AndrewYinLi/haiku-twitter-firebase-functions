const functions = require("firebase-functions");

const express = require("express");
const app = express();

const FBAuth = require("./util/fbAuth");
const {
  getHaikus,
  createHaiku,
  getHaiku,
  commentOnHaiku,
  likeHaiku,
  unlikeHaiku,
  deleteHaiku
} = require("./handlers/haikus");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser
} = require("./handlers/users");

// routes for haikus
app.get("/haikus", getHaikus);
app.post("/haiku", FBAuth, createHaiku);
app.get("/haiku/:haikuID", getHaiku);
app.delete("/haiku/:haikuID", FBAuth, deleteHaiku);
app.get("/haiku/:haikuID/like", FBAuth, likeHaiku);
app.get("/haiku/:haikuID/unlike", FBAuth, unlikeHaiku);
app.post("/haiku/:haikuID/comment", FBAuth, commentOnHaiku);

// routes for users
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);

// Good practice to use Express to create multiple routes under /api/
exports.api = functions.https.onRequest(app);
