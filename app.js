const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const admin = require("firebase-admin");
const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
firebaseConfig.private_key = firebaseConfig.private_key.split('\\n').join('\n');

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
});



require("dotenv").config();

// Configurazione Firebase
try {
  if (!process.env.FIREBASE_CONFIG) {
    throw new Error("La variabile d'ambiente FIREBASE_CONFIG non è definita!");
  }
  const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);

// Risolvi le sequenze \\n in \n nella chiave privata
firebaseConfig.private_key = firebaseConfig.private_key.split('\\n').join('\n');

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
});
console.log("Firebase configurato con successo.");
} catch (error) {
  console.error("Errore nella configurazione di Firebase:", error.message);
  process.exit(1);
}

console.log("Private Key Prima della Modifica:", process.env.FIREBASE_CONFIG);
console.log("Private Key Dopo la Modifica:", firebaseConfig.private_key);


const auth = admin.auth();
const app = express();

// Middleware di configurazione
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Configurazione della sessione
app.use(
  session({
    secret: process.env.SESSION_SECRET || "segretissimo", // Usa variabile d'ambiente in produzione
    resave: false,
    saveUninitialized: true,
  })
);

// Simulazione database di annunci (in memoria)
let announcements = [];

// Credenziali amministratore (da variabili d'ambiente)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "password";

// Middleware per verificare il login dell'amministratore
function isAdmin(req, res, next) {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin-login");
  }
}

// Middleware per verificare l'autenticazione dell'utente
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userLoggedIn) {
    next();
  } else {
    res.redirect("/user-login");
  }
}

// Route principale per la homepage
app.get("/", (req, res) => {
  res.render("index", { announcements });
});

// Porta di ascolto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
