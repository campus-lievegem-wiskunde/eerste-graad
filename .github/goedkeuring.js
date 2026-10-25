/* Controle "goedkeuring": wie moet een pull request goedkeuren voor ze op main mag?
   Elk bestand heeft een eigenaar. Wijzigt iemand bestanden van een andere eigenaar, dan moet die eigenaar de pull request
   goedkeuren (Approve) op de laatste commit. Wie enkel eigen bestanden wijzigt, mag zelf samenvoegen zodra de tests slagen.
   Jeroen (STANDAARD) is eigenaar van alles: zijn pull requests hebben nooit een andere goedkeuring nodig; Tom is eigenaar van zijn delen.
   gedeeld/sites.js wordt per site bekeken: het element van een site hoort bij de eigenaar van haar pad.
   Draait met de versie van main (pull_request_target) en voert geen code uit de pull request uit. */
const EIGENAARS = [
  { wie:'vandaelet', naam:'Tom Van Daele', paden:[
    /^[12][AB]\/(basisgeletterdheid|heuristieken|wiskundige-problemen)\//,
    /^2B\/modules\//,
    /^2B\/index\.html$/,
    /^test\/wiskundigeproblemen(2b)?\.js$/,
  ] },
];
const STANDAARD = { wie:'dejaegerjeroen', naam:'Jeroen De Jaeger' };
const SITES = 'gedeeld/sites.js';

const { GH_TOKEN, REPO, PR, GITHUB_STEP_SUMMARY } = process.env;
const fs = require('fs');
async function api(pad, raw){
  const r = await fetch('https://api.github.com/repos/' + REPO + pad, { headers:{ authorization:'Bearer ' + GH_TOKEN,
    accept: raw ? 'application/vnd.github.raw' : 'application/vnd.github+json', 'x-github-api-version':'2022-11-28' } });
  if(raw && r.status === 404) return null;
  if(!r.ok) throw new Error(pad + ': ' + r.status + ' ' + await r.text());
  return raw ? r.text() : r.json();
}
async function alles(pad){ const uit = []; for(let p = 1; ; p++){ const d = await api(pad + (pad.includes('?') ? '&' : '?') + 'per_page=100&page=' + p); uit.push(...d); if(d.length < 100) return uit; } }
const eigenaar = bestand => (EIGENAARS.find(e=>e.paden.some(r=>r.test(bestand))) || STANDAARD).wie;
const naam = wie => (EIGENAARS.find(e=>e.wie === wie) || STANDAARD).naam;
function lees(tekst){ if(tekst == null) return []; const m = tekst.match(/export const SITES = ([\s\S]*);\s*$/); return JSON.parse(m[1]); }

(async()=>{
  const pr = await api('/pulls/' + PR); const auteur = pr.user.login, sha = pr.head.sha;
  const nodig = new Map(); /* eigenaar -> redenen */
  const voeg = (wie, waarom)=>{ if(!nodig.has(wie)) nodig.set(wie, []); nodig.get(wie).push(waarom); };
  for(const f of await alles('/pulls/' + PR + '/files')){
    for(const b of new Set([f.filename, f.previous_filename].filter(Boolean))){
      if(b !== SITES){ voeg(eigenaar(b), b); continue; }
      try{
        const oud = lees(await api('/contents/' + SITES + '?ref=' + pr.base.sha, true)), nieuw = lees(await api('/contents/' + SITES + '?ref=' + sha, true));
        const O = new Map(oud.map(s=>[s.id, s])), N = new Map(nieuw.map(s=>[s.id, s]));
        for(const id of new Set([...O.keys(), ...N.keys()])){
          const a = O.get(id), c = N.get(id); if(a && c && JSON.stringify(a) === JSON.stringify(c)) continue;
          for(const s of [a, c]) if(s) voeg(eigenaar(s.pad || ''), SITES + ' (site ' + id + ')');
        }
        const samen = oud.map(s=>s.id).filter(id=>N.has(id)), na = nieuw.map(s=>s.id).filter(id=>O.has(id));
        if(samen.join() !== na.join()) voeg(STANDAARD.wie, SITES + ' (volgorde van de sites)');
      }catch(e){ voeg(STANDAARD.wie, SITES + ' (niet te lezen: ' + e.message + ')'); }
    }
  }
  /* laatste beoordeling per persoon; een goedkeuring telt enkel voor de laatste commit */
  const laatste = new Map();
  for(const r of await alles('/pulls/' + PR + '/reviews')) if(r.user && r.state !== 'COMMENTED' && r.state !== 'PENDING') laatste.set(r.user.login, r);
  const regels = [], ontbreekt = [];
  for(const [wie, redenen] of nodig){
    const lijst = [...new Set(redenen)]; const kort = lijst.slice(0, 8).join(', ') + (lijst.length > 8 ? ' en ' + (lijst.length - 8) + ' andere' : '');
    if(wie === auteur){ regels.push(`OK   eigen bestanden van ${naam(wie)}: ${kort}`); continue; }
    if(auteur === STANDAARD.wie){ regels.push(`OK   ${STANDAARD.naam} is eigenaar van alles, ook van de bestanden van ${naam(wie)}: ${kort}`); continue; }
    const r = laatste.get(wie);
    if(r && r.state === 'APPROVED' && r.commit_id === sha) regels.push(`OK   goedgekeurd door ${naam(wie)} (@${wie}): ${kort}`);
    else { ontbreekt.push(wie); regels.push(`NODIG goedkeuring van ${naam(wie)} (@${wie})` + (r && r.state === 'APPROVED' ? ' (opnieuw: er kwam een commit bij na de goedkeuring)' : '') + `: ${kort}`); }
  }
  const tekst = `Pull request #${PR} van @${auteur}\n` + regels.join('\n') + '\n' + (ontbreekt.length ? 'Nog niet klaar om samen te voegen.' : 'In orde: samenvoegen mag zodra de tests slagen.');
  console.log(tekst); if(GITHUB_STEP_SUMMARY) fs.appendFileSync(GITHUB_STEP_SUMMARY, '```\n' + tekst + '\n```\n');
  process.exit(ontbreekt.length ? 1 : 0);
})().catch(e=>{ console.error(e); process.exit(1); });
