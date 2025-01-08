document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('menu');

    if (!menuToggle) {
        console.error("Errore: il pulsante hamburger (#menu-toggle) non è stato trovato.");
    }
    if (!menu) {
        console.error("Errore: il menu mobile (#menu) non è stato trovato.");
    }

    if (menuToggle && menu) {
        menuToggle.addEventListener('click', () => {
            menu.classList.toggle('hidden'); // Mostra o nasconde il menu mobile
            console.log("Stato del menu mobile:", menu.classList.contains('hidden') ? "Nascosto" : "Visibile");
        });
    }
});
