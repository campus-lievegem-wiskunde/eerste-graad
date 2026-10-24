/* Voorbeeld voor de tests (test/opdrachten.js); dezelfde vorm als een echte toets. */
window.OPGAVE = {
  id:'test-toets',
  inleiding:'<p>Werk netjes. Gebruik een komma voor kommagetallen.</p>',
  delen:[
    { titel:'Deel 1 · Rekenen', vragen:[
      { id:'v1', type:'getal', punten:2, vraag:'<p>Een rechthoek is 7 cm lang en 4 cm breed. Hoe groot is de omtrek?</p>', eenheid:'cm' },
      { id:'v2', type:'keuze', punten:1, vraag:'<p>Welk getal is een priemgetal?</p>', opties:['21', '27', '29', '33'] },
      { id:'v3', type:'meer', punten:1, vraag:'<p>Duid alle even getallen aan.</p>', opties:['14', '17', '30', '45'] },
    ] },
    { titel:'Deel 2 · Meetkunde', vragen:[
      { id:'v4', type:'tekst', punten:1, vraag:'<p>Hoe heet een driehoek met twee even lange zijden?</p>' },
      { id:'v5', type:'open', punten:3, vraag:'<p>Leg uit waarom een vierkant ook een rechthoek is.</p>', regels:4 },
    ] },
  ]
};
