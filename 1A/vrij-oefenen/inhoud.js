/* Vrij oefenen 1A (site 1a-vrij): de motor staat in gedeeld/vrij-oefenen.js. Negatieve getallen enkel bij de gehele getallen,
   eenvoudig van −20 tot +20 (zMax). Eenvoudige machten tot 20² (kwadraat) en vierkantswortels tot √400, geen negatieve exponenten.
   Kommagetallen vermenigvuldigen en delen enkel met de factoren in komma. Negatieve breuken (qn) enkel bij optel en maal. Hoofdstuk-id's en bewerking-id's nooit wijzigen (ze zitten in de opgeslagen scores). */
(J=>{
  /* de motor laadt de pagina zelf; test/catalogus.js laadt enkel dit bestand */
  const go = () => window.VRIJ.start(J);
  if(window.VRIJ) go(); else { const s = document.createElement('script'); s.src = '../../gedeeld/vrij-oefenen.js'; s.onload = go; document.head.append(s); }
})({
  jaar:'1A', teken:false, geheel:'n', zMax:20, kwadraat:20, komma:['0,1', '0,2', '0,5', '0,01', '0,001'], noemers:[2, 3, 4, 5, 6, 8, 10],
  getallen:[['n', 'Natuurlijke getallen'], ['z', 'Gehele getallen'], ['d', 'Kommagetallen'], ['q', 'Breuken'], ['alle', 'Alles door elkaar']],
  modes:['n', 'z', 'd', 'q', 'qd'],
  hoofdstukken:[
    /* maal- en deeltafels: de getallen zijn hier de tafels van 2 tot 15 (id = het tafelgetal) */
    { id:'tafel', naam:'Maal- en deeltafels', vraagG:'Welke tafels?', vraagB:'Maal- of deeltafels?', bew:[['mt', 'Maaltafels'], ['dt', 'Deeltafels']],
      getallen:Array.from({ length:14 }, (_, i)=>[String(i + 2), 'Tafel van ' + (i + 2), String(i + 2)]).concat([['alle', 'Alle tafels']]),
      modes:Array.from({ length:14 }, (_, i)=>String(i + 2)) },
    { id:'optel', naam:'Optellen en aftrekken', bew:[['plus', 'Optellen'], ['min', 'Aftrekken'], ['som', 'Gedurige som']],
      /* negatieve breuken enkel bij optellen/aftrekken en vermenigvuldigen/delen */
      getallen:[['n', 'Natuurlijke getallen'], ['z', 'Gehele getallen'], ['d', 'Kommagetallen'], ['q', 'Breuken'], ['qn', 'Negatieve breuken'], ['alle', 'Alles door elkaar']], modes:['n', 'z', 'd', 'q', 'qn', 'qd'] },
    { id:'maal', naam:'Vermenigvuldigen en delen', bew:[['maal', 'Vermenigvuldigen'], ['deel', 'Delen'], ['fact', 'Meer factoren']],
      /* negatieve breuken enkel bij optellen/aftrekken en vermenigvuldigen/delen */
      getallen:[['n', 'Natuurlijke getallen'], ['z', 'Gehele getallen'], ['d', 'Kommagetallen'], ['q', 'Breuken'], ['qn', 'Negatieve breuken'], ['alle', 'Alles door elkaar']], modes:['n', 'z', 'd', 'q', 'qn', 'qd'] },
    { id:'macht', naam:'Machten en vierkantswortels', bew:[['macht', 'Machten'], ['wortel', 'Vierkantswortels']] },
    { id:'volg', naam:'Volgorde van bewerkingen', bew:[['zh', 'Zonder haakjes'], ['mh', 'Met haakjes'], ['mw', 'Met machten en wortels']] },
    { id:'mix', naam:'Alles door elkaar' }
  ]
});
