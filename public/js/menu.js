document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('menu');

    // Verifica se gli elementi esistono
    if (!menuToggle || !menu) {
        console.error("Errore: pulsante hamburger (#menu-toggle) o menu mobile (#menu) non trovati.");
        return;
    }

    // Log di debug per confermare il caricamento
    console.log("menu.js caricato correttamente.");

    // Aggiungi il listener al pulsante hamburger
    menuToggle.addEventListener('click', () => {
        console.log("Pulsante hamburger cliccato.");
        menu.classList.toggle('hidden'); // Mostra o nasconde il menu mobile
        console.log("Stato del menu:", menu.classList.contains('hidden') ? "Nascosto" : "Visibile");
    });
});
