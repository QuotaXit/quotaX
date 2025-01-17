const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");


const app = express();

const transporter = nodemailer.createTransport({
    host: "smtp.aruba.it", // Host SMTP di Aruba
    port: 587, // Porta di default per SMTP
    secure: false, // Usa false per STARTTLS
    auth: {
        user: "postmaster@quotax.eu", // Tua email Aruba
        pass: "Ermago1998.", // Password dell'account
    },
});


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
app.use(express.static("public", {
    setHeaders: (res, path) => {
        if (path.endsWith(".js")) {
            res.setHeader("Content-Type", "application/javascript");
        }
    }
}));


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
            name: user.displayName || "nome utente"
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
        console.log("Dati ricevuti dal modulo:", req.body);
        const { nome, societa, dataAcquisto, prezzoAcquisto, valoreAttuale, prezzoVendita, rubricazione } = req.body;

        // Salva l'annuncio con il nome inserito nel modulo
        const announcement = {
            nome, // Nome preso direttamente dal modulo
            societa,
            dataAcquisto,
            prezzoAcquisto: parseFloat(prezzoAcquisto),
            valoreAttuale: parseFloat(valoreAttuale),
            prezzoVendita: parseFloat(prezzoVendita),
            rubricazione: rubricazione === "Si" ? "Si" : "No",
            email: req.session.userEmail || "Riservato", // Email presa dalla sessione
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
        announcementsSnapshot.forEach((doc) => {
            announcements.push({ id: doc.id, ...doc.data() });
        });        
        
        res.render("view", {
            announcements,
            search,
            minPrice,
            maxPrice,
            isAuthenticated: !!req.session.userEmail, // L'email è ancora condizionata dall'autenticazione
        });
    } catch (error) {
        console.error("Errore durante il recupero degli annunci:", error);
        res.status(500).send("Errore interno del server.");
    }
});


app.get("/crowdfunding", (req, res) => {
  res.render("crowdfunding");
});


app.post("/delete-announcement", isAuthenticated, async (req, res) => {
    const { id, isAzione } = req.body;

    if (!id) {
        console.error("Errore: ID non fornito.");
        return res.status(400).send("Errore: ID mancante.");
    }

    try {
        // Determina la collezione da cui eliminare l'annuncio
        const collection = isAzione === "true" ? "azioni" : "announcements";

        // Elimina il documento con l'ID specifico dalla collezione
        await db.collection(collection).doc(id).delete();
        console.log(`Annuncio con ID ${id} eliminato con successo dalla collezione ${collection}.`);
        res.redirect("/user-announcements");
    } catch (error) {
        console.error("Errore durante l'eliminazione dell'annuncio:", error);
        res.status(500).send("Errore durante l'eliminazione dell'annuncio.");
    }
});

app.post("/upload-profile-picture", isAuthenticated, async (req, res) => {
    const { imageUrl } = req.body; // URL immagine caricata
    const email = req.session.userEmail;

    try {
        await db.collection("users").doc(email).update({ profileImg: imageUrl });
        req.session.user.profileImg = imageUrl; // Aggiorna la sessione
        res.redirect("/user-dashboard");
    } catch (error) {
        console.error("Errore nel caricamento dell'immagine:", error);
        res.status(500).send("Errore interno del server.");
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

app.get('/terms-conditions', (req, res) => {
    res.render('terms_conditions'); // Renderizza il file terms_conditions.ejs
});


app.get("/warnings", (req, res) => {
  res.render("warnings");
});

app.get('/come-funziona', (req, res) => {
    res.render('come-funziona'); // Usa il file come-funziona.ejs
});

app.get('/contatti', (req, res) => {
    res.render('contatti'); // Renderizza il file contatti.ejs
});

app.get('/faq', (req, res) => {
    res.render('faq');
});


app.post("/send-contact", (req, res) => {
    const { nome, emailProfilo, motivo, messaggio } = req.body;

    // Configura il contenuto dell'email
    const mailOptions = {
        from: emailProfilo,
        to: "postmaster@quotax.eu", // Email destinatario
        subject: `Nuovo contatto da ${nome} - Motivo: ${motivo}`,
        text: `
            Nome: ${nome}
            Email: ${emailProfilo}
            Motivo: ${motivo}
            Messaggio: ${messaggio}
        `,
    };

    // Invia l'email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Errore nell'invio dell'email:", error);
            res.render("contatti", {
                message: "Si è verificato un errore nell'invio del messaggio. Riprova più tardi.",
            });
        } else {
            console.log("Email inviata con successo:", info.response);
            res.render("contatti", {
                message: "Grazie per averci contattato! Ti risponderemo al più presto.",
            });
        }
    });
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

    if (!userEmail) {
        console.error("Errore: userEmail non trovato nella sessione.");
        return res.render("user-announcements", { announcements: [], errorMessage: "Utente non autenticato." });
    }

    try {
        // Recupera gli annunci normali
        const announcementsSnapshot = await db
            .collection("announcements")
            .where("email", "==", userEmail)
            .get();

        const announcements = [];
        announcementsSnapshot.forEach(doc => {
            announcements.push({ id: doc.id, ...doc.data() });
        });

        // Recupera gli annunci delle azioni
        const azioniSnapshot = await db
            .collection("azioni")
            .where("email", "==", userEmail)
            .get();

        azioniSnapshot.forEach(doc => {
            announcements.push({ id: doc.id, ...doc.data(), isAzione: true }); // Aggiungi un flag per distinguere
        });

        // Passa tutti gli annunci (normali e azioni) al template
        res.render("user-announcements", { announcements, errorMessage: null });
    } catch (error) {
        console.error("Errore durante il recupero degli annunci:", error.message);
        res.render("user-announcements", {
            announcements: [],
            errorMessage: "Si è verificato un errore durante il recupero degli annunci. Riprova più tardi.",
        });
    }
});


app.get("/create-azioni", isAuthenticated, (req, res) => {
    const userEmail = req.session.userEmail; // Recupera l'email dalla sessione
    res.render("create-azioni", { userEmail }); // Passa l'email all'EJS
});


app.post("/create-azioni", async (req, res) => {
    try {
        const { nome, societa, numeroAzioni, dataAcquisto, valoreAttuale, prezzoVendita, quotata } = req.body;

        const azioni = {
            nome, // Nome inserito nel modulo
            societa,
            numeroAzioni: parseInt(numeroAzioni),
            dataAcquisto,
            valoreAttuale: parseFloat(valoreAttuale),
            prezzoVendita: parseFloat(prezzoVendita),
            quotata: quotata === "Si" ? "Si" : "No",
            email: req.session.userEmail || "Riservato", // Email presa dalla sessione
            createdAt: new Date().toISOString(),
        };

        await db.collection("azioni").add(azioni);
        res.redirect("/bacheca-azioni");
    } catch (error) {
        console.error("Errore durante la creazione dell'annuncio azioni:", error);
        res.status(500).send("Errore interno del server.");
    }
});

app.get("/bacheca-azioni", async (req, res) => {
    try {
        const { search, minPrice, maxPrice } = req.query;

        let azioniQuery = db.collection("azioni");

        if (search) {
            azioniQuery = azioniQuery.where("societa", "==", search);
        }
        if (minPrice) {
            azioniQuery = azioniQuery.where("prezzoVendita", ">=", parseFloat(minPrice));
        }
        if (maxPrice) {
            azioniQuery = azioniQuery.where("prezzoVendita", "<=", parseFloat(maxPrice));
        }

        const azioniSnapshot = await azioniQuery.get();
        const azioni = [];
        azioniSnapshot.forEach(doc => {
            azioni.push(doc.data());
        });

        res.render("bacheca-azioni", {
            azioni,
            search,
            minPrice,
            maxPrice,
            isAuthenticated: !!req.session.userEmail,
        });
    } catch (error) {
        console.error("Errore durante il recupero delle azioni:", error);
        res.status(500).send("Errore interno del server.");
    }
});

app.post("/save-consent", (req, res) => {
    const { userId, consent } = req.body;
    db.collection("consents").add({
        userId,
        consent,
        timestamp: new Date().toISOString(),
    })
    .then(() => res.status(200).send("Consenso salvato"))
    .catch((err) => res.status(500).send("Errore nel salvataggio del consenso"));
});


// Porta di ascolto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

 