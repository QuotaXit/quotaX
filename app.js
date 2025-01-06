const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const admin = require("firebase-admin");

const app = express();

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
const db = admin.firestore();

// Configurazione di Express
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

// Middleware per passare l'utente alle view
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

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
app.post("/user-login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await auth.getUserByEmail(email);

        // Salva lo stato dell'utente nella sessione, includendo il nome
        req.session.user = { 
            id: user.uid, 
            email: email, 
            name: user.displayName || "Anonimo" // Usa il nome dell'utente o "Anonimo" come fallback
        };
        req.session.userEmail = email;
        req.session.userLoggedIn = true;

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
    const userEmail = req.session.userEmail; // Ottieni l'email dell'utente dalla sessione
    res.render("create", { userEmail }); // Passa l'email al file EJS
});

app.post("/create", async (req, res) => {
    try {
        const { societa, dataAcquisto, prezzoAcquisto, valoreAttuale, prezzoVendita, rubricazione } = req.body;

        console.log("Rubricazione ricevuta dal modulo:", rubricazione);

        const announcement = {
            societa,
            dataAcquisto,
            prezzoAcquisto: parseFloat(prezzoAcquisto),
            valoreAttuale: parseFloat(valoreAttuale),
            prezzoVendita: parseFloat(prezzoVendita),
            rubricazione: rubricazione === "Si" ? "Si" : "No",
            nome: req.session.user?.name || "Anonimo", // Cambia "Anonimo" in "Utente"
            email: req.session.userEmail || "Riservato",
            createdAt: new Date().toISOString(),
        };

        await db.collection("announcements").add(announcement);
        res.redirect("/view");
    } catch (error) {
        console.error("Errore durante la creazione dell'annuncio:", error);
        res.status(500).send("Errore interno del server.");
    }
});


// Rotta per "Vedi Annunci"
app.get("/view", async (req, res) => {
    try {
        const { search, minPrice, maxPrice } = req.query;

        let announcementsQuery = db.collection("announcements");

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
            isAuthenticated: !!req.session.userEmail,
        });
    } catch (error) {
        console.error("Errore durante il recupero degli annunci:", error);
        res.status(500).send("Errore interno del server.");
    }
});



app.get("/crowdfunding", (req, res) => {
    res.render("crowdfunding");
});

  

app.get("/crowdfunding", (req, res) => {
  res.render("crowdfunding");
});

app.post("/delete-announcement", isAuthenticated, async (req, res) => {
    const { id } = req.body;

    if (!id) {
        console.error("Errore: ID non fornito.");
        return res.status(400).send("Errore: ID mancante.");
    }

    try {
        // Elimina il documento con l'ID specifico dalla collezione "announcements"
        await db.collection("announcements").doc(id).delete();
        console.log(`Annuncio con ID ${id} eliminato con successo.`);
        res.redirect("/user-announcements");
    } catch (error) {
        console.error("Errore durante l'eliminazione dell'annuncio:", error);
        res.status(500).send("Errore durante l'eliminazione dell'annuncio.");
    }
});



// Rotta per logout
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Errore durante il logout:", err);
            return res.status(500).send("Errore durante il logout.");
        }
        res.redirect("/"); // Reindirizza alla home dopo il logout
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

app.get("/user-profile", isAuthenticated, (req, res) => {
    const email = req.session.userEmail;
    res.render("user-profile", { email, error: null });
});

// Rotta per visualizzare il profilo
app.post("/user-profile", isAuthenticated, async (req, res) => {
    const { email, password } = req.body;
    const currentEmail = req.session.userEmail;

    try {
        // Recupera l'utente corrente
        const user = await auth.getUserByEmail(currentEmail);

        // Aggiorna l'email, se modificata
        if (email && email !== currentEmail) {
            await auth.updateUser(user.uid, { email });
            req.session.userEmail = email; // Aggiorna la sessione con la nuova email
        }

        // Aggiorna la password, se fornita
        if (password) {
            await auth.updateUser(user.uid, { password });
        }

        res.redirect("/user-profile");
    } catch (error) {
        console.error("Errore durante l'aggiornamento del profilo:", error);
        res.render("user-profile", { email: currentEmail, error: error.message });
    }
});

  
  // Rotta per modificare il profilo
  app.get("/user-modify", isAuthenticated, (req, res) => {
    const email = req.session.userEmail;
    res.render("user-modify", { email, error: null });
  });
  
  app.post("/user-modify", isAuthenticated, async (req, res) => {
    const { email, password } = req.body;

    try {
        const userEmail = req.session.userEmail; // Email attuale dell'utente dalla sessione

        // Aggiorna l'email e/o la password nel database
        const userRef = db.collection("users").doc(userEmail);

        const updates = {};
        if (email) updates.email = email;
        if (password) updates.password = password;

        await userRef.update(updates);

        // Aggiorna l'email nella sessione se è stata cambiata
        if (email) req.session.userEmail = email;

        // Rendi il messaggio disponibile alla vista
        res.render("user-modify", {
            successMessage: "Modifiche salvate con successo.",
            email: req.session.userEmail, // Passa l'email aggiornata
        });
    } catch (error) {
        console.error("Errore durante l'aggiornamento dei dati:", error);
        res.render("user-modify", {
            errorMessage: "Si è verificato un errore. Riprova più tardi.",
            email: req.session.userEmail, // Passa l'email corrente
        });
    }
});


  // Rotta per modificare gli annunci
  app.get("/user-announcements", isAuthenticated, async (req, res) => {
    const userEmail = req.session.userEmail;

    // Controlla se l'email dell'utente esiste nella sessione
    if (!userEmail) {
        console.error("Errore: userEmail non trovato nella sessione.");
        return res.render("user-announcements", { announcements: [], errorMessage: "Utente non autenticato." });
    }

    try {
        // Recupera gli annunci creati dall'utente corrente
        const userAnnouncementsSnapshot = await db
            .collection("announcements")
            .where("email", "==", userEmail) // Usa il campo 'email'
            .get();

        const userAnnouncements = [];
        userAnnouncementsSnapshot.forEach((doc) => {
            userAnnouncements.push({ id: doc.id, ...doc.data() });
        });

        // Render della pagina con gli annunci dell'utente
        res.render("user-announcements", { announcements: userAnnouncements, errorMessage: null });
    } catch (error) {
        // Gestione degli errori
        console.error("Errore durante il recupero degli annunci:", error.message);
        res.render("user-announcements", {
            announcements: [],
            errorMessage: "Si è verificato un errore durante il recupero degli annunci. Riprova più tardi.",
        });
    }
});



// Porta di ascolto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

 