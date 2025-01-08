document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('menu');

    if (menuToggle && menu) {
        menuToggle.addEventListener('click', () => {
            menu.classList.toggle('hidden'); // Mostra o nasconde il menu
        });
    } else {
        console.error("Menu toggle o menu non trovati.");
    }
});
