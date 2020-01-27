const { admin } = require("../util/admin");
var syllable = require("syllable");

exports.getHaikus = (req, res) => {
  admin
    .firestore()
    .collection("haikus")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let haikus = [];
      data.forEach(doc => {
        haikus.push({
          haikuID: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
          commentCount: doc.data().commentCount,
          likeCount: doc.data().likeCount,
          userImage: doc.data().userImage
        });
      });
      return res.json(haikus);
    })
    .catch(err => console.error(err));
};

exports.createHaiku = (req, res) => {
  const haikuSplit = req.body.body.split("\n");
  let errorStr = "";
  let lineOneResult = syllable(haikuSplit[0]);
  if (lineOneResult !== 5) {
    errorStr += "Line 1 has " + lineOneResult + " syllables. ";
  }
  if (haikuSplit.length > 1) {
    let lineTwoResult = syllable(haikuSplit[1]);
    if (lineTwoResult !== 7) {
      errorStr += "Line 2 has " + lineTwoResult + " syllables. ";
    }
  } else {
    errorStr += "Line 2 is empty. ";
  }
  if (haikuSplit.length > 2) {
    let lineThreeResult = syllable(haikuSplit[2]);
    if (lineThreeResult !== 5) {
      errorStr += "Line 3 has " + lineThreeResult + " syllables. ";
    }
  } else {
    errorStr += "Line 3 is empty. ";
  }
  if (haikuSplit.length > 3) {
    errorStr += "You can't have more than 4 lines.";
  }
  if (errorStr !== "") {
    return res.status(400).json({ body: errorStr.trim() });
  }

  const newHaiku = {
    body: req.body.body,
    userHandle: req.user.userHandle,
    userImage: req.user.imageURL,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0
  };

  admin
    .firestore()
    .collection("haikus")
    .add(newHaiku)
    .then(doc => {
      const resHaiku = newHaiku;
      resHaiku.haikuID = doc.id;
      res.json({ resHaiku });
    })
    .catch(err => {
      res.status(500).json({ error: "Something went wrong :(" });
      console.error(err);
    });
};

exports.getHaiku = (req, res) => {
  let haikuData = {};
  admin
    .firestore()
    .doc(`/haikus/${req.params.haikuID}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Haiku not found" });
      }
      haikuData = doc.data();
      haikuData.haikuID = doc.id;
      return admin
        .firestore()
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("haikuID", "==", req.params.haikuID)
        .get();
    })
    .then(data => {
      haikuData.comments = [];
      data.forEach(doc => {
        haikuData.comments.push(doc.data());
      });
      return res.json(haikuData);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.commentOnHaiku = (req, res) => {
  if (req.body.body.trim() === "") {
    return res.status(400).json({ comment: "Must not be empty" });
  }

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    haikuID: req.params.haikuID,
    userHandle: req.user.userHandle,
    userImage: req.user.imageURL
  };

  // verify haiku still exists
  admin
    .firestore()
    .doc(`/haikus/${req.params.haikuID}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Haiku not found" });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return admin
        .firestore()
        .collection("comments")
        .add(newComment);
    })
    .then(() => {
      res.json(newComment);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ error: "Something went wrong" });
    });
};

exports.likeHaiku = (req, res) => {
  const likeDoc = admin
    .firestore()
    .collection("likes")
    .where("userHandle", "==", req.user.userHandle)
    .where("haikuID", "==", req.params.haikuID)
    .limit(1);

  const haikuDoc = admin.firestore().doc(`/haikus/${req.params.haikuID}`);

  let haikuData;

  haikuDoc
    .get()
    .then(doc => {
      if (doc.exists) {
        haikuData = doc.data();
        haikuData.haikuID = doc.id;
        return likeDoc.get();
      }
      return res.status(404).json({ error: "Haiku not found" });
    })
    .then(data => {
      if (data.empty) {
        return admin
          .firestore()
          .collection("likes")
          .add({
            haikuID: req.params.haikuID,
            userHandle: req.user.userHandle
          })
          .then(() => {
            haikuData.likeCount++;
            return haikuDoc.update({ likeCount: haikuData.likeCount });
          })
          .then(() => {
            return res.json(haikuData);
          });
      } else {
        return res.status(400).json({ error: "Haiku already liked" });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.unlikeHaiku = (req, res) => {
  const likeDoc = admin
    .firestore()
    .collection("likes")
    .where("userHandle", "==", req.user.userHandle)
    .where("haikuID", "==", req.params.haikuID)
    .limit(1);

  const haikuDoc = admin.firestore().doc(`/haikus/${req.params.haikuID}`);

  let haikuData;

  haikuDoc
    .get()
    .then(doc => {
      if (doc.exists) {
        haikuData = doc.data();
        haikuData.haikuID = doc.id;
        return likeDoc.get();
      } else {
        return res.status(404).json({ error: "Haiku not found" });
      }
    })
    .then(data => {
      if (data.empty) {
        return res.status(400).json({ error: "Haiku not liked" });
      } else {
        return admin
          .firestore()
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            haikuData.likeCount--;
            return haikuDoc.update({ likeCount: haikuData.likeCount });
          })
          .then(() => {
            res.json(haikuData);
          });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.deleteHaiku = (req, res) => {
  const haikuDoc = admin.firestore().doc(`/haikus/${req.params.haikuID}`);
  haikuDoc
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Haiku not found" });
      }
      if (doc.data().userHandle !== req.user.userHandle) {
        return res.status(403).json({ error: "Unauthorized" });
      } else {
        return haikuDoc.delete();
      }
    })
    .then(() => {
      res.json({ message: "Haiku deleted successfully" });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
