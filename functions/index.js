const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Would usually pass in an application, but it has been defined already in .firebaserc
admin.initializeApp();

const express = require("express");
const app = express();

exports.getHaiku = functions.https.onRequest((req, res) => {
  admin
    .firestore()
    .collection("haikus")
    .get()
    .then(data => {
      let haikus = [];
      data.forEach(doc => {
        haikus.push(doc.data());
      });
      return res.json(haikus);
    })
    .catch(err => console.error(err));
});

exports.createHaiku = functions.https.onRequest((req, res) => {
  if (req.method != "POST") {
    return res.status(400).json({ error: "Method not allowed." });
  }
  const newHaiku = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: admin.firestore.Timestamp.fromDate(new Date())
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
