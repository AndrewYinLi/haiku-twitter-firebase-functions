const admin = require("firebase-admin");

// Would usually pass in an application, but it has been defined already in .firebaserc
admin.initializeApp();

module.exports = { admin };
