const fs = require('fs');

const data = JSON.parse(fs.readFileSync('algeria-data.json', 'utf8'));

const flattened = [];

data.forEach(wilaya => {
    const wilayaName = wilaya.name.charAt(0).toUpperCase() + wilaya.name.slice(1).toLowerCase();
    wilaya.communes.forEach((commune, index) => {
        const communeName = commune.charAt(0).toUpperCase() + commune.slice(1).toLowerCase();
        flattened.push({
            label: `${communeName}, ${wilayaName}`,
            value: `${communeName}, ${wilayaName}`,
            commune: communeName,
            wilaya: wilayaName,
            wilayaId: wilaya.id,
            communeId: index + 1
        });
    });
});

// Add the 10 new wilayas if they are missing (simple version for now or just the names)
const existingIds = new Set(data.map(w => w.id));
const allWilayas = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar",
  "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger",
  "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma",
  "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh",
  "Illizi", "Bordj Bou Arreridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued",
  "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent",
  "Ghardaïa", "Relizane", "Timimoun", "Bordj Badji Mokhtar", "Ouled Djellal", "Béni Abbès",
  "In Salah", "In Guezzam", "Touggourt", "Djanet", "El M'Ghair", "El Meniaa"
];

allWilayas.forEach((name, index) => {
    const id = index + 1;
    if (!existingIds.has(id)) {
        // Just add the Wilaya as a "commune" for now if we don't have its communes
        flattened.push({
            label: `${name}, ${name}`,
            value: `${name}, ${name}`,
            commune: name,
            wilaya: name,
            wilayaId: id,
            communeId: 0
        });
    }
});

const content = `export type Location = {
  label: string;
  value: string;
  commune: string;
  wilaya: string;
  wilayaId: number;
  communeId: number;
};

export const ALGERIA_LOCATIONS: Location[] = ${JSON.stringify(flattened, null, 2)};
`;

fs.writeFileSync('lib/algeria-locations.ts', content);
console.log('Processed ' + flattened.length + ' locations.');
