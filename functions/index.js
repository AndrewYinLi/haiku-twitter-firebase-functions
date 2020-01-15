const functions = require("firebase-functions");

const express = require("express");
const app = express();

const FBAuth = require("./util/fbAuth");

const { admin } = require("./util/admin");

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
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead
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
app.get("/user/:userHandle", getUserDetails);
app.post("/notifications", FBAuth, markNotificationsRead);

// Good practice to use Express to create multiple routes under /api/
exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions.firestore
  .document("likes/{id}")
  .onCreate(snapshot => {
    return admin
      .firestore()
      .doc(`/haikus/${snapshot.data().haikuID}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return admin
            .firestore()
            .doc(`/notifications/${snapshot.id}`)
            .set({
              createdAt: new Date().toISOString(),
              recipient: doc.data().userHandle,
              sender: snapshot.data().userHandle,
              type: "like",
              read: false,
              haikuID: doc.id
            });
        }
      })
      .catch(err => {
        console.error(err);
        return; // no need to send response bc it's a db trigger, not api endpoint
      });
  });

exports.deleteNotificationOnUnlike = functions.firestore
  .document("likes/{id}")
  .onDelete(snapshot => {
    return admin
      .firestore()
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch(err => {
        console.error(err);
        return err;
      });
  });

exports.createNotificationOnComment = functions.firestore
  .document("comments/{id}")
  .onCreate(snapshot => {
    return admin
      .firestore()
      .doc(`/haikus/${snapshot.data().haikuID}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return admin
            .firestore()
            .doc(`/notifications/${snapshot.id}`)
            .set({
              createdAt: new Date().toISOString(),
              recipient: doc.data().userHandle,
              sender: snapshot.data().userHandle,
              type: "comment",
              read: false,
              haikuID: doc.id
            });
        }
      })
      .catch(err => {
        console.error(err);
        return err;
      });
  });

// TO-DO: update image in comments
exports.onUserImageChange = functions.firestore
  .document("/users/{userID}")
  .onUpdate(change => {
    if (change.before.data().imageURL !== change.after.data().imageURL) {
      const batch = admin.firestore().batch();
      return admin
        .firestore()
        .collection("haikus")
        .where("userHandle", "==", change.before.data().userHandle)
        .get()
        .then(data => {
          data.forEach(doc => {
            const haiku = admin.firestore().doc(`/haikus/${doc.id}`);
            batch.update(haiku, { userImage: change.after.data().imageURL });
          });
          return batch.commit();
        });
    } else {
      return true;
    }
  });

exports.onHaikuDelete = functions.firestore
  .document("/haikus/{haikuID}")
  .onDelete((snapshot, context) => {
    const haikuID = context.params.haikuID;
    const batch = admin.firestore().batch();
    return admin
      .firestore()
      .collection("comments")
      .where("haikuID", "==", haikuID)
      .get()
      .then(data => {
        data.forEach(doc => {
          batch.delete(admin.firestore().doc(`/comments/${doc.id}`));
        });
        return admin
          .firestore()
          .collection("likes")
          .where("haikuID", "==", haikuID)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(admin.firestore().doc(`/likes/${doc.id}`));
        });
        return admin
          .firestore()
          .collection("notifications")
          .where("haikuID", "==", haikuID)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(admin.firestore().doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch(err => {
        console.error(err);
      });
  });
