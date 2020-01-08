const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Would usually pass in an application, but it has been defined already in .firebaserc
admin.initializeApp();

const express = require("express");
const app = express();

var firebaseConfig = {
  apiKey: "AIzaSyBbYTrpq99j95loiHfk7-_M8qWY_V6Mvxo",
  authDomain: "haiku-twitter.firebaseapp.com",
  databaseURL: "https://haiku-twitter.firebaseio.com",
  projectId: "haiku-twitter",
  storageBucket: "haiku-twitter.appspot.com",
  messagingSenderId: "853305919295",
  appId: "1:853305919295:web:60f9bce28e1ae19867358a",
  measurementId: "G-L6RKPLTGPD"
};

const firebase = require("firebase");
firebase.initializeApp(firebaseConfig);

// route for getting all haikus
app.get("/get-haikus", (req, res) => {
  admin
    .firestore()
    .collection("haikus")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let haikus = [];
      data.forEach(doc => {
        haikus.push({
          haikuId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        });
      });
      return res.json(haikus);
    })
    .catch(err => console.error(err));
});

// route for creating a haiku
app.post("/create-haiku", (req, res) => {
  const newHaiku = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };

  admin
    .firestore()
    .collection("haikus")
    .add(newHaiku)
    .then(doc => {
      res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch(err => {
      res.status(500).json({ error: "Something went wrong :(" });
      console.error(err);
    });
});

// signup route
app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    userHandle: req.body.userHandle
  };

  let token, userId;
  admin
    .firestore()
    .doc(`/users/${newUser.userHandle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res
          .status(400)
          .json({ userHandle: "this user handle is already taken!" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        userHandle: newUser.userHandle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId: userId
      };
      admin
        .firestore()
        .doc(`/users/${newUser.userHandle}`)
        .set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "Email is already in use" });
      }
      return res.status(500).json({ error: err.code });
    });
});

// Good practice to use Express to create multiple routes under /api/
exports.api = functions.https.onRequest(app);
