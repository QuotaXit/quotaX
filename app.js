require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const admin = require("firebase-admin");

// Configurazione Firebase
try {
  if (!process.env.FIREBASE_CONFIG) {
    throw new Error("La variabile d'ambiente FIREBASE_CONFIG non è definita!");
  }

  const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);

  // Risolvi le sequenze \\n in \n nella chiave privata
  firebaseConfig.private_key = firebaseConfig.private_key.split("\\n").join("\n");

  // Inizializza Firebase solo se non è già inizializzato
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
    });
    console.log("Firebase configurato con successo.");
  } else {
    console.log("Firebase app già inizializzata.");
  }
} catch (error) {
  console.error("Errore nella configurazione di Firebase:", error.message);
  process.exit(1);
}

const auth = admin.auth();
const app = express();

// Middleware di configurazione
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// Serve i file statici dalla cartella "public"
app.use(express.static("public"));

// Configurazione della sessione
app.use(
  session({
    secret: process.env.SESSION_SECRET || "segretissimo",
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

// Rotta per la pagina "Crea Annuncio"
app.get("/crea-annuncio", (req, res) => {
  res.render("crea-annuncio", { announcements }); // Passa dati se necessari
});

// Rotta per la pagina "Vedi Annunci"
app.get("/vedi-annunci", (req, res) => {
  res.render("vedi-annunci", { announcements });
});

// Rotta per la pagina "Accedi"
app.get("/accedi", (req, res) => {
  res.render("accedi");
});

// Rotta per la pagina "Registrati"
app.get("/registrati", (req, res) => {
  res.render("registrati");
});

// Rotta per la pagina "Crowdfunding"
app.get("/crowdfunding", (req, res) => {
  res.render("crowdfunding");
});

// Porta di ascolto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
