console.log("menu.js caricato.");

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM completamente caricato.");
    const menuToggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('menu');

    if (!menuToggle || !menu) {
        console.error("Errore: pulsante hamburger (#menu-toggle) o menu mobile (#menu) non trovati.");
        return;
    }

    console.log("Elementi trovati correttamente.");
    menuToggle.addEventListener('click', () => {
        console.log("Pulsante hamburger cliccato.");
        menu.classList.toggle('hidden');
    });
});
