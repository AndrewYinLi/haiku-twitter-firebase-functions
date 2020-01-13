const { admin } = require("../util/admin");

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
          createdAt: doc.data().createdAt
        });
      });
      return res.json(haikus);
    })
    .catch(err => console.error(err));
};

exports.createHaiku = (req, res) => {
  if (req.body.body.trim() === "") {
    return res.status(400).json({ body: "Body must not be empty" });
  }

  const newHaiku = {
    body: req.body.body,
    userHandle: req.user.userHandle,
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
    return res.status(400).json({ error: "Must not be empty" });
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
