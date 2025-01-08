document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('menu');

    if (!menuToggle || !menu) {
        console.error("Errore: Pulsante hamburger (#menu-toggle) o menu mobile (#menu) non trovato.");
        return;
    }

    console.log("Pulsante e menu trovati.");

    menuToggle.addEventListener('click', () => {
        console.log("Pulsante hamburger cliccato.");
        menu.classList.toggle('hidden');
        console.log("Stato del menu:", menu.classList.contains('hidden') ? "Nascosto" : "Visibile");
    });
});
