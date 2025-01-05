const admin = require("firebase-admin");

// Sostituisci con il tuo file di credenziali Firebase
const serviceAccount = require("./path-to-firebase-adminsdk.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://<your-database-name>.firebaseio.com"
});

const auth = admin.auth();
module.exports = { auth };
