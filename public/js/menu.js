document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.querySelector("#menu-toggle");
    const menuMobile = document.querySelector("#menu");
    const menuDesktop = document.querySelector(".desktop-menu");

    if (hamburger && menuMobile && menuDesktop) {
        // Mostra/Nasconde il menu mobile
        hamburger.addEventListener("click", () => {
            menuMobile.classList.toggle("hidden");
        });

        // Aggiungi un listener per mostrare/nascondere il menu desktop in base alla larghezza dello schermo
        window.addEventListener("resize", () => {
            if (window.innerWidth > 768) {
                menuDesktop.classList.remove("hidden");
                menuMobile.classList.add("hidden");
            } else {
                menuDesktop.classList.add("hidden");
            }
        });

        // Esegui il controllo iniziale
        if (window.innerWidth > 768) {
            menuDesktop.classList.remove("hidden");
        } else {
            menuDesktop.classList.add("hidden");
        }
    } else {
        console.error("Elementi non trovati: hamburger, menu mobile o menu desktop");
    }
});
