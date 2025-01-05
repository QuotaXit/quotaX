const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-account.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://<your-database-name>.firebaseio.com"
});


// Configurazione Firebase: gestione duale (variabili d'ambiente o file JSON)
let firebaseConfig;
try {
  if (process.env.FIREBASE_CONFIG) {
    console.log("Caricamento credenziali Firebase da variabile d'ambiente...");
    firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
    });
  } else {
    console.log("Caricamento credenziali Firebase da file locale...");
    try {
      const serviceAccount = require("./firebase-service-account.json");
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://quotax-c76ba.firebaseio.com", // Cambia con il tuo databaseURL
      });
    } catch (fileError) {
      console.error("Errore: il file firebase-service-account.json non è stato trovato.");
      throw fileError;
    }
  }
} catch (error) {
  console.error("Errore nella configurazione di Firebase:", error);
  process.exit(1);
}

const auth = admin.auth();
const app = express();

// Middleware di configurazione
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Configurazione della sessione
app.use(
  session({
    secret: "segretissimo", // Cambialo in produzione
    resave: false,
    saveUninitialized: true,
  })
);

// Simulazione database di annunci (in memoria)
let announcements = [];

// Credenziali amministratore
const ADMIN_USERNAME = "odeiroma";
const ADMIN_PASSWORD = "move87-Main6";

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

// Rotte e logica rimangono invariati...
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Route principale per la homepage
app.get("/", (req, res) => {
  res.render("index", { announcements });
});

