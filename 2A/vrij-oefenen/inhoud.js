/* Vrij oefenen 2A (site 2a-vrij): de motor staat in gedeeld/vrij-oefenen.js. Hoofdstuk-id's en bewerking-id's nooit wijzigen
   (ze zitten in de opgeslagen scores); een nieuwe bewerking of een nieuw hoofdstuk komt achteraan (Alles door elkaar blijft laatst). */
(J=>{
  /* de motor laadt de pagina zelf; test/catalogus.js laadt enkel dit bestand */
  const go = () => window.VRIJ.start(J);
  if(window.VRIJ) go(); else { const s = document.createElement('script'); s.src = '../../gedeeld/vrij-oefenen.js'; s.onload = go; document.head.append(s); }
})({
  jaar:'2A', teken:true, geheel:'z', komma:['0,1', '0,2', '0,5', '0,01', '0,001', '0,25', '0,125'], noemers:[2, 3, 4, 5, 6, 8, 9, 10, 12],
  getallen:[['z', 'Gehele getallen'], ['q', 'Breuken'], ['d', 'Kommagetallen'], ['alle', 'Alles door elkaar']],
  /* bij Alles door elkaar: per oefening een soort; qd = breuken en kommagetallen in één oefening */
  modes:['z', 'q', 'd', 'qd'],
  hoofdstukken:[
    /* maal- en deeltafels: de getallen zijn hier de tafels van 2 tot 15 (id = het tafelgetal) */
    { id:'tafel', naam:'Maal- en deeltafels', vraagG:'Welke tafels?', vraagB:'Maal- of deeltafels?', bew:[['mt', 'Maaltafels'], ['dt', 'Deeltafels']],
      getallen:Array.from({ length:14 }, (_, i)=>[String(i + 2), 'Tafel van ' + (i + 2), String(i + 2)]).concat([['alle', 'Alle tafels']]),
      modes:Array.from({ length:14 }, (_, i)=>String(i + 2)) },
    { id:'optel', naam:'Optellen en aftrekken', bew:[['plus', 'Optellen'], ['min', 'Aftrekken'], ['som', 'Gedurige som']] },
    { id:'maal', naam:'Vermenigvuldigen en delen', bew:[['maal', 'Vermenigvuldigen'], ['deel', 'Delen'], ['fact', 'Meer factoren']] },
    { id:'macht', naam:'Machten en vierkantswortels', bew:[['macht', 'Macht'], ['mmin', 'Macht met minteken'], ['wortel', 'Vierkantswortel']] },
    { id:'volg', naam:'Volgorde van bewerkingen', bew:[['zh', 'Zonder haakjes'], ['mh', 'Met haakjes'], ['mw', 'Met machten en wortels']] },
    { id:'mix', naam:'Alles door elkaar' }
  ]
});
