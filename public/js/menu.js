function mostraMessaggioDebug(messaggio) {
    const debugDiv = document.getElementById("debug-messages");
    if (debugDiv) {
        const nuovoMessaggio = document.createElement("p");
        nuovoMessaggio.textContent = messaggio;
        debugDiv.appendChild(nuovoMessaggio);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    mostraMessaggioDebug("messages.js è stato caricato.");
    const messageIcons = document.querySelectorAll(".message-icon");
    mostraMessaggioDebug("Icone trovate: " + messageIcons.length);

    const modal = document.getElementById("message-modal");
    const announcementIdInput = document.getElementById("announcementId");

    messageIcons.forEach(icon => {
        icon.addEventListener("click", () => {
            mostraMessaggioDebug("Icona cliccata.");
            const announcementId = icon.getAttribute("data-announcement-id");
            mostraMessaggioDebug("ID annuncio: " + announcementId);

            if (announcementIdInput && modal) {
                announcementIdInput.value = announcementId;
                modal.classList.add("show");
                mostraMessaggioDebug("La modale è stata mostrata.");
            } else {
                mostraMessaggioDebug("Errore: modale o input ID non trovati.");
            }
        });
    });
});
