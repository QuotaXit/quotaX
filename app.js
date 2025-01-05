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
  firebaseConfig.private_key = firebaseConfig.private_key.replace(/\\n/g, "\n");

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

// Credenziali amministratore
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

// Rotte per le pagine
app.get("/crea-annuncio", (req, res) => {
  res.render("create");
});

app.get("/vedi-annunci", (req, res) => {
  // Simulazione annunci creati dagli utenti loggati
  const userCreatedAnnouncements = announcements.filter(a => a.creatoDaUtente === true);

  res.render("view", { announcements: userCreatedAnnouncements });
});

app.get("/accedi", (req, res) => {
  res.render("admin-login");
});

app.get("/registrati", (req, res) => {
  res.render("register"); // Corretto per la rotta /register
});

app.get("/crowdfunding", (req, res) => {
  res.render("crowdfunding");
});

// Route per visualizzare la pagina di login utente
app.get("/user-login", (req, res) => {
  res.render("user-login", { error: null });
});

// Route per gestire il form di login utente
app.post("/user-login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Controlla le credenziali con Firebase Authentication
    const user = await auth.getUserByEmail(email);

    // Simulazione: Se il controllo delle credenziali è corretto
    req.session.userLoggedIn = true; // Salva lo stato di login nella sessione
    res.redirect("/user-dashboard"); // Reindirizza al dashboard utente
  } catch (error) {
    console.error("Errore durante il login:", error);
    res.render("user-login", { error: "Credenziali non valide o utente non trovato." });
  }
});

// Route per il dashboard dell'utente
app.get("/user-dashboard", isAuthenticated, (req, res) => {
  res.render("user-dashboard"); // Assicurati che user-dashboard.ejs esista
});

// Route per la pagina warnings
app.get("/warnings", (req, res) => {
  res.render("warnings"); // Assicurati che warnings.ejs esista
});

// Rotta per la pagina view
app.get("/view", (req, res) => {
  res.render("view"); // Assicurati che view.ejs esista
});

// Porta di ascolto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Middleware per gestire errori
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});
