document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.querySelector(".hamburger");
    const menu = document.getElementById("menu");

    if (hamburger && menu) {
        hamburger.addEventListener("click", () => {
            menu.classList.toggle("hidden");
            console.log("Menu toggled:", !menu.classList.contains("hidden"));
        });
    } else {
        console.error("Hamburger button or menu element not found.");
    }
});
