document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.querySelector(".hamburger");
    const menu = document.getElementById("menu");

    if (!hamburger) {
        console.error("Hamburger button not found.");
    }
    if (!menu) {
        console.error("Menu element not found.");
    }

    if (hamburger && menu) {
        hamburger.addEventListener("click", () => {
            menu.classList.toggle("hidden");
        });
    }
});
