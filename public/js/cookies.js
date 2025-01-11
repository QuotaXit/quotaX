document.addEventListener("DOMContentLoaded", () => {
    const banner = document.getElementById("cookie-banner");
    const acceptButton = document.getElementById("accept-cookies");
    const rejectButton = document.getElementById("reject-cookies");

    // Controlla se i cookie sono già stati accettati/rifiutati
    if (localStorage.getItem("cookies-consent")) {
        banner.style.display = "none";
        return;
    }

    // Gestisci il consenso
    acceptButton.addEventListener("click", () => {
        localStorage.setItem("cookies-consent", "accepted");
        banner.style.display = "none";
        console.log("Cookie accettati.");
        abilitaCookie();
    });

    rejectButton.addEventListener("click", () => {
        localStorage.setItem("cookies-consent", "rejected");
        banner.style.display = "none";
        console.log("Cookie rifiutati.");
        disabilitaCookie();
    });

    function abilitaCookie() {
        // Inizializza cookie opzionali, come Google Analytics
        console.log("Abilitazione cookie opzionali...");
    }

    function disabilitaCookie() {
        // Rimuovi o disabilita cookie opzionali
        console.log("Disabilitazione cookie opzionali...");
    }
});
