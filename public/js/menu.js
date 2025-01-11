document.addEventListener("DOMContentLoaded", () => {
    const messageIcons = document.querySelectorAll(".message-icon");
    const modal = document.getElementById("message-modal");
    const announcementIdInput = document.getElementById("announcementId");

    messageIcons.forEach(icon => {
        icon.addEventListener("click", () => {
            const announcementId = icon.getAttribute("data-announcement-id");
            announcementIdInput.value = announcementId; // Imposta l'ID nell'input nascosto
            modal.classList.add("show"); // Mostra il modulo
        });
    });

    // Chiudi il modulo cliccando fuori
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("show");
        }
    });
});
