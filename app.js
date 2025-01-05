const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const admin = require("firebase-admin");

// Percorso al file di credenziali
const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://quotax-c76ba.firebaseio.com", // Cambia con il tuo databaseURL
});

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

// Rotta per il profilo utente
app.get("/user-profile", (req, res) => {
    if (req.session && req.session.userLoggedIn) {
        res.render("user-profile", { email: req.session.userEmail, error: null });
    } else {
        res.redirect("/user-login");
    }
});

// Rotta POST per aggiornare il profilo
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

// Rotta per la home
app.get("/", (req, res) => {
    res.render("index", { announcements: announcements.slice(-10) });
});

// Rotta per "Crea Annuncio"
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

// Rotta per "Vedi Annunci"
app.get("/view", (req, res) => {
    res.render("view", { announcements: announcements });
});

app.get("/warnings", (req, res) => {
    res.render("warnings");
});

// Rotta per login amministratore
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

// Rotta per logout amministratore
app.get("/admin-logout", (req, res) => {
    req.session.admin = false;
    res.redirect("/");
});

// Rotta per dashboard amministratore
app.get("/admin-dashboard", isAdmin, (req, res) => {
    res.render("admin-dashboard", { announcements });
});

// Rotta per eliminare un annuncio
app.post("/delete-announcement", isAdmin, (req, res) => {
    const index = parseInt(req.body.index, 10);
    if (!isNaN(index) && index >= 0 && index < announcements.length) {
        announcements.splice(index, 1);
    }
    res.redirect("/admin-dashboard");
});

// Avvio del server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Rotta per CrowdFunding
app.get("/crowdfunding", (req, res) => {
    res.render("crowdfunding");
});
