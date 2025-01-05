const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const admin = require("firebase-admin");
const { search, minPrice, maxPrice } = req.query;

// Configurazione Firebase (variabile d'ambiente)
try {
    const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
    firebaseConfig.private_key = firebaseConfig.private_key.replace(/\\n/g, "\n");

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig),
            databaseURL: "https://quotax-c76ba.firebaseio.com",
        });
    }
    console.log("Firebase configurato con successo.");
} catch (error) {
    console.error("Errore nella configurazione di Firebase:", error.message);
    process.exit(1);
}

const auth = admin.auth();
const db = admin.firestore(); // Firestore database
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

// Credenziali amministratore
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "odeiroma";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "move87-Main6";

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

// Rotta per la pagina di registrazione
app.get("/register", (req, res) => {
    res.render("register", { error: null });
});

// Rotta POST per gestire la registrazione
app.post("/register", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await auth.createUser({
            email: email,
            password: password,
        });
        res.redirect("/user-login");
    } catch (error) {
        res.render("register", { error: error.message });
    }
});

// Rotta per la pagina di login
app.get("/user-login", (req, res) => {
    res.render("user-login", { error: null });
});

// Rotta POST per gestire il login
app.post("/user-login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await auth.getUserByEmail(email);
        req.session.userLoggedIn = true;
        req.session.userEmail = email;
        res.redirect("/user-dashboard");
    } catch (error) {
        res.render("user-login", { error: "Email o password non validi" });
    }
});

// Rotta per la dashboard utenti
app.get("/user-dashboard", (req, res) => {
    if (req.session && req.session.userLoggedIn) {
        res.render("user-dashboard", { email: req.session.userEmail });
    } else {
        res.redirect("/user-login");
    }
});

// Rotta per "Crea Annuncio"
app.get("/create", isAuthenticated, (req, res) => {
    res.render("create");
});

app.post("/create", async (req, res) => {
    const announcement = {
        nome: req.body.nome,
        email: req.body.email,
        societa: req.body.societa,
        dataAcquisto: req.body.dataAcquisto,
        prezzoAcquisto: req.body.prezzoAcquisto,
        valoreAttuale: req.body.valoreAttuale,
        prezzoVendita: req.body.prezzoVendita,
        creatoDa: req.session.userEmail,
    };

    try {
        await db.collection("announcements").add(announcement);
        res.redirect("/");
    } catch (error) {
        console.error("Errore durante la creazione dell'annuncio:", error);
        res.status(500).send("Errore durante la creazione dell'annuncio.");
    }
});

// Rotta per "Vedi Annunci"
app.get("/view", async (req, res) => {
  try {
      const { search, minPrice, maxPrice } = req.query;

      // Ottieni tutti gli annunci dal database Firestore
      let announcementsQuery = db.collection("annunci");

      // Applica i filtri
      if (search) {
          announcementsQuery = announcementsQuery.where("societa", "==", search);
      }

      if (minPrice) {
          announcementsQuery = announcementsQuery.where("prezzoVendita", ">=", parseFloat(minPrice));
      }

      if (maxPrice) {
          announcementsQuery = announcementsQuery.where("prezzoVendita", "<=", parseFloat(maxPrice));
      }

      const announcementsSnapshot = await announcementsQuery.get();

      const announcements = [];
      announcementsSnapshot.forEach(doc => {
          announcements.push(doc.data());
      });

      res.render("view", {
          announcements,
          search,
          minPrice,
          maxPrice,
      });
  } catch (error) {
      console.error("Errore durante il recupero degli annunci:", error);
      res.status(500).send("Errore interno del server.");
  }
});



app.get("/crowdfunding", (req, res) => {
  res.render("crowdfunding");
});


// Rotta per logout
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/user-login");
    });
});

app.get("/warnings", (req, res) => {
  res.render("warnings");
});


// Rotta per la home
app.get("/", async (req, res) => {
    try {
        const snapshot = await db.collection("announcements").orderBy("dataAcquisto", "desc").limit(10).get();
        const announcements = snapshot.docs.map(doc => doc.data());
        res.render("index", { announcements });
    } catch (error) {
        console.error("Errore durante il recupero degli annunci per la home:", error);
        res.render("index", { announcements: [] });
    }
});

// Porta di ascolto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
