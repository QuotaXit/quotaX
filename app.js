const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const admin = require("firebase-admin");

// Percorso al file di credenziali o utilizzo delle variabili d'ambiente
let firebaseConfig;

if (process.env.FIREBASE_CONFIG) {
  try {
    firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
    });
  } catch (error) {
    console.error("Errore nella lettura di FIREBASE_CONFIG:", error);
    process.exit(1);
  }
} else {
  try {
    const serviceAccount = require("./firebase-service-account.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://quotax-c76ba.firebaseio.com", // Cambia con il tuo databaseURL
    });
  } catch (error) {
    console.error("Errore nella lettura del file firebase-service-account.json:", error);
    process.exit(1);
  }
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

// Rotte
app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

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

app.get("/user-login", (req, res) => {
  res.render("user-login", { error: null });
});

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

app.get("/user-dashboard", (req, res) => {
  if (req.session && req.session.userLoggedIn) {
    res.render("user-dashboard", { email: req.session.userEmail });
  } else {
    res.redirect("/user-login");
  }
});

app.get("/user-profile", (req, res) => {
  if (req.session && req.session.userLoggedIn) {
    res.render("user-profile", { email: req.session.userEmail, error: null });
  } else {
    res.redirect("/user-login");
  }
});

app.post("/user-profile", async (req, res) => {
  const { nome, password } = req.body;
  const email = req.session.userEmail;

  try {
    const user = await auth.getUserByEmail(email);

    if (nome) {
      await auth.updateUser(user.uid, { displayName: nome });
    }

    if (password) {
      await auth.updateUser(user.uid, { password: password });
    }

    res.render("user-profile", { email, error: "Profilo aggiornato con successo!" });
  } catch (error) {
    res.render("user-profile", { email, error: error.message });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/user-login");
  });
});

app.get("/", (req, res) => {
  res.render("index", { announcements: announcements.slice(-10) });
});

app.get("/create", isAuthenticated, (req, res) => {
  res.render("create");
});

app.post("/create", (req, res) => {
  const announcement = {
    nome: req.body.nome,
    email: req.body.email,
    societa: req.body.societa,
    dataAcquisto: req.body.dataAcquisto,
    prezzoAcquisto: req.body.prezzoAcquisto,
    valoreAttuale: req.body.valoreAttuale,
    prezzoVendita: req.body.prezzoVendita,
  };
  announcements.push(announcement);
  res.redirect("/");
});

app.get("/view", (req, res) => {
  res.render("view", { announcements: announcements });
});

app.get("/warnings", (req, res) => {
  res.render("warnings");
});

app.get("/admin-login", (req, res) => {
  res.render("admin-login", { error: null });
});

app.post("/admin-login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.admin = true;
    res.redirect("/admin-dashboard");
  } else {
    res.render("admin-login", { error: "Credenziali non valide" });
  }
});

app.get("/admin-logout", (req, res) => {
  req.session.admin = false;
  res.redirect("/");
});

app.get("/admin-dashboard", isAdmin, (req, res) => {
  res.render("admin-dashboard", { announcements });
});

app.post("/delete-announcement", isAdmin, (req, res) => {
  const index = parseInt(req.body.index, 10);
  if (!isNaN(index) && index >= 0 && index < announcements.length) {
    announcements.splice(index, 1);
  }
  res.redirect("/admin-dashboard");
});

app.get("/crowdfunding", (req, res) => {
  res.render("crowdfunding");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
