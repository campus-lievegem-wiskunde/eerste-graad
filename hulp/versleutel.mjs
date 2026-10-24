/* Verbetersleutel van een toets of taak versleutelen.
   node hulp/versleutel.mjs <bron/sleutel.json> <map van de opdracht> [sleutelcode]
   Schrijft <map>/sleutel.enc.json en toont de sleutelcode (zonder code wordt er een nieuwe gemaakt, bv. K7QM-R2XD).
   De leesbare sleutel.json hoort NIET in de repository (die is openbaar): bewaar hem in de projectmap. */
import fs from 'fs'; import path from 'path';
import { versleutel, ontsleutel } from '../gedeeld/opdrachten.js';
const [bron, map, gegeven] = process.argv.slice(2);
if(!bron || !map){ console.error('Gebruik: node hulp/versleutel.mjs <sleutel.json> <map van de opdracht> [code]'); process.exit(1); }
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const code = gegeven || [0, 1].map(()=>Array.from(crypto.getRandomValues(new Uint8Array(4)), b=>ABC[b % 32]).join('')).join('-');
const sleutel = JSON.parse(fs.readFileSync(bron, 'utf8'));
const enc = await versleutel(sleutel, code);
const terug = await ontsleutel(enc, code);
if(JSON.stringify(terug) !== JSON.stringify(sleutel)){ console.error('Controle mislukt'); process.exit(1); }
fs.writeFileSync(path.join(map, 'sleutel.enc.json'), JSON.stringify(enc) + '\n');
console.log('Sleutelcode: ' + code);
