/* Vrij oefenen 1A (site 1a-vrij): de motor staat in gedeeld/vrij-oefenen.js. Enkel positieve getallen en geen machten
   (die komen in 1A nog niet aan bod). Hoofdstuk-id's en bewerking-id's nooit wijzigen (ze zitten in de opgeslagen scores). */
(J=>{
  /* de motor laadt de pagina zelf; test/catalogus.js laadt enkel dit bestand */
  const go = () => window.VRIJ.start(J);
  if(window.VRIJ) go(); else { const s = document.createElement('script'); s.src = '../../gedeeld/vrij-oefenen.js'; s.onload = go; document.head.append(s); }
})({
  jaar:'1A', teken:false, geheel:'n', noemers:[2, 3, 4, 5, 6, 8, 10],
  getallen:[['n', 'Natuurlijke getallen'], ['d', 'Kommagetallen'], ['q', 'Breuken'], ['alle', 'Alles door elkaar']],
  modes:['n', 'd', 'q', 'qd'],
  hoofdstukken:[
    { id:'optel', naam:'Optellen en aftrekken', bew:[['plus', 'Optellen'], ['min', 'Aftrekken'], ['som', 'Gedurige som']] },
    { id:'maal', naam:'Vermenigvuldigen en delen', bew:[['maal', 'Vermenigvuldigen'], ['deel', 'Delen'], ['fact', 'Meer factoren']] },
    { id:'volg', naam:'Volgorde van bewerkingen', bew:[['zh', 'Zonder haakjes'], ['mh', 'Met haakjes']] },
    { id:'mix', naam:'Alles door elkaar' }
  ]
});
