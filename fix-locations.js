const fs = require('fs');
const path = require('path');

console.log('Reading Algerian wilayas data from algeria-data.json...');

try {
    const data = fs.readFileSync('algeria-data.json', 'utf8');
    const rawData = JSON.parse(data);
    const flattened = [];

    rawData.forEach(wilaya => {
        if (!wilaya.communes || !Array.isArray(wilaya.communes)) return;
        
        wilaya.communes.forEach((commune, index) => {
            const communeName = commune.name || commune;
            flattened.push({
                label: `${communeName}, ${wilaya.name}`,
                value: `${communeName}, ${wilaya.name}`,
                commune: communeName,
                wilaya: wilaya.name,
                wilayaId: wilaya.id,
                communeId: index + 1
            });
        });
    });

    const content = `"use client";

export type Location = {
  label: string;
  value: string;
  commune: string;
  wilaya: string;
  wilayaId: number;
  communeId: number;
};

export const ALGERIA_LOCATIONS: Location[] = ${JSON.stringify(flattened, null, 2)};
`;

    fs.writeFileSync(path.join(__dirname, 'lib', 'algeria-locations.ts'), content);
    
    console.log(`Successfully regenerated lib/algeria-locations.ts with ${flattened.length} locations.`);
} catch (e) {
    console.error('Error processing file:', e.message);
}
