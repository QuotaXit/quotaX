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
const db = admin.firestore(); // Se utilizzi Firestore
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

// Middleware per verificare l'autenticazione dell'utente
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userLoggedIn) {
    next();
  } else {
    res.redirect("/user-login");
  }
}

// Route principale per la homepage
app.get("/", async (req, res) => {
  try {
    // Recupera gli ultimi annunci dal database
    const snapshot = await db.collection("announcements").limit(5).get();
    const announcements = snapshot.docs.map(doc => doc.data());

    res.render("index", { announcements });
  } catch (error) {
    console.error("Errore durante il recupero degli annunci:", error);
    res.status(500).send("Errore durante il caricamento della homepage.");
  }
});

// Rotta per "vedi annunci"
app.get("/vedi-annunci", async (req, res) => {
  try {
    // Recupera tutti gli annunci creati dagli utenti
    const snapshot = await db.collection("announcements").get();
    const announcements = snapshot.docs.map(doc => doc.data());

    res.render("view", { announcements });
  } catch (error) {
    console.error("Errore durante il recupero degli annunci:", error);
    res.status(500).send("Errore durante il caricamento degli annunci.");
  }
});

// Rotta per "crea annuncio"
app.get("/crea-annuncio", isAuthenticated, (req, res) => {
  res.render("create");
});

// Rotta per "salvare un annuncio"
app.post("/crea-annuncio", isAuthenticated, async (req, res) => {
  const { societa, prezzoAcquisto, valoreAttuale, prezzoVendita } = req.body;

  try {
    await db.collection("announcements").add({
      societa,
      prezzoAcquisto: parseFloat(prezzoAcquisto),
      valoreAttuale: parseFloat(valoreAttuale),
      prezzoVendita: parseFloat(prezzoVendita),
      creatoDa: req.session.userEmail,
      creatoIl: new Date(),
    });

    res.redirect("/vedi-annunci");
  } catch (error) {
    console.error("Errore durante la creazione dell'annuncio:", error);
    res.status(500).send("Errore durante la creazione dell'annuncio.");
  }
});

// Rotta per il login utente
app.get("/user-login", (req, res) => {
  res.render("user-login", { error: null });
});

app.post("/user-login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Simulazione del controllo con Firebase Authentication
    const user = await auth.getUserByEmail(email);

    req.session.userLoggedIn = true;
    req.session.userEmail = user.email;

    res.redirect("/user-dashboard");
  } catch (error) {
    console.error("Errore durante il login:", error);
    res.render("user-login", { error: "Credenziali non valide o utente non trovato." });
  }
});

// Rotta per il dashboard dell'utente
app.get("/user-dashboard", isAuthenticated, (req, res) => {
  res.render("user-dashboard");
});

// Rotta per "registrati"
app.get("/registrati", (req, res) => {
  res.render("register");
});

// Porta di ascolto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
