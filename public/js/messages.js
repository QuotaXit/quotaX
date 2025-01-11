document.addEventListener("DOMContentLoaded", () => {
    console.log("Il DOM è pronto.");
    const messageIcons = document.querySelectorAll(".message-icon");
    console.log("Icone trovate:", messageIcons.length);

    const modal = document.getElementById("message-modal");
    const announcementIdInput = document.getElementById("announcementId");

    messageIcons.forEach(icon => {
        icon.addEventListener("click", () => {
            console.log("Icona cliccata:", icon);
            const announcementId = icon.getAttribute("data-announcement-id");
            console.log("ID annuncio:", announcementId);

            if (announcementIdInput && modal) {
                announcementIdInput.value = announcementId;
                modal.classList.add("show");
                console.log("La modale è stata mostrata.");
            } else {
                console.error("La modale o l'input ID non sono stati trovati.");
            }
        });
    });
});
