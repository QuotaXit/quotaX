const fs = require('fs');
const xml2js = require('xml2js');

// Legge il file XML
fs.readFile('risposta.xml', (err, data) => {
    if (err) {
        console.error('Errore nella lettura del file XML:', err);
        return;
    }

    const parser = new xml2js.Parser();
    parser.parseString(data, (err, result) => {
        if (err) {
            console.error('Errore nel parsing del file XML:', err);
            return;
        }

        // Estrai i dati delle imprese
        const imprese = result.Risposta.ListaImpreseRI[0].Impresa;
        console.log('Imprese trovate:', imprese.length);

        imprese.forEach((impresa) => {
            const denominazione = impresa.AnagraficaImpresa[0].Denominazione[0];
            console.log('Nome Impresa:', denominazione);
        });
    });
});
