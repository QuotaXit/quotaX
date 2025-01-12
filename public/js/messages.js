document.addEventListener("DOMContentLoaded", () => {
    console.log("Il DOM è pronto.");
    const messageIcons = document.querySelectorAll(".message-icon");
    console.log("Numero di icone trovate:", messageIcons.length);

    const modal = document.getElementById("message-modal");
    const announcementIdInput = document.getElementById("announcementId");

    if (!modal || !announcementIdInput) {
        console.error("Modal o input hidden non trovati nel DOM.");
        return;
    }

    messageIcons.forEach(icon => {
        icon.addEventListener("click", () => {
            console.log("Icona cliccata:", icon);
            const announcementId = icon.getAttribute("data-announcement-id");

            if (announcementId) {
                announcementIdInput.value = announcementId;
                modal.classList.remove("hidden");
                console.log("Modal mostrato con ID annuncio:", announcementId);
            } else {
                console.error("ID annuncio non trovato.");
            }
        });
    });

    // Aggiungi gestione per chiudere il modal
    modal.addEventListener("click", (event) => {
        if (event.target.id === "message-modal" || event.target.classList.contains("modal-close")) {
            modal.classList.add("hidden");
            console.log("Modal chiuso.");
        }
    });
});
