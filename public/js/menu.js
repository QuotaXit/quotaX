document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('menu');

    if (!menuToggle || !menu) {
        console.error("Errore: Pulsante hamburger (#menu-toggle) o menu mobile (#menu) non trovato.");
        return;
    }

    menuToggle.addEventListener('click', () => {
        menu.classList.toggle('hidden');
    });
});
