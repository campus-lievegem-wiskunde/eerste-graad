/* Nep-Google Classroom voor de tests: vervangt het script van Google Identity Services en de Classroom API (classroom.googleapis.com)
   in een Playwright-context. Alles zit in het geheugen van Node; de test leest het terug via nep.staat.
   Gebruik: const nep = await require('./fake/classroom').installeer(ctx, { klassen:[{ id, name, section, leerlingen:[{ email, naam }] }] }) */
const GIS = `window.google = { accounts:{ oauth2:{
  initTokenClient(cfg){ return { requestAccessToken(){ window.__crAanvragen = (window.__crAanvragen || 0) + 1;
    setTimeout(()=>window.__crWeiger ? cfg.error_callback && cfg.error_callback({ type:'popup_closed' }) : cfg.callback({ access_token:'nep-token', expires_in:3600, scope:cfg.scope }), 30); } }; },
  hasGrantedAllScopes(){ return true; } } } };`;

async function installeer(ctx, opts = {}){
  const st = { klassen:[], werk:{}, inzending:{}, aanroepen:[], n:0 };
  (opts.klassen || []).forEach(k=>st.klassen.push({ id:k.id, name:k.name, section:k.section || '', courseState:'ACTIVE', alternateLink:'https://classroom.google.com/c/' + k.id,
    leerlingen:(k.leerlingen || []).map((l, i)=>({ userId:k.id + '-u' + i, profile:{ emailAddress:l.email, name:{ fullName:l.naam || l.email } } })) }));
  const id = p => p + (++st.n);
  await ctx.route(/accounts\.google\.com\/gsi\/client/, r=>r.fulfill({ contentType:'text/javascript', body:GIS }));
  await ctx.route(/classroom\.googleapis\.com\/v1\//, async r=>{
    const q = r.request(), u = new URL(q.url()), m = q.method();
    const cors = { 'access-control-allow-origin':'*', 'access-control-allow-headers':'authorization, content-type', 'access-control-allow-methods':'GET, POST, PATCH, OPTIONS' };
    if(m === 'OPTIONS') return r.fulfill({ status:204, headers:cors });
    const stuur = (status, body)=>r.fulfill({ status, headers:cors, contentType:'application/json', body:JSON.stringify(body) });
    if((q.headers().authorization || '') !== 'Bearer nep-token') return stuur(401, { error:{ message:'Request had invalid authentication credentials.' } });
    const pad = u.pathname.replace('/v1/', '').split('/'), body = q.postData() ? JSON.parse(q.postData()) : null;
    st.aanroepen.push(m + ' ' + u.pathname + (u.searchParams.get('updateMask') ? '?updateMask=' + u.searchParams.get('updateMask') : ''));
    const klas = st.klassen.find(k=>k.id === pad[1]);
    if(pad[0] === 'courses' && pad.length === 1) return stuur(200, { courses:st.klassen.map(({ leerlingen, ...k })=>k) });
    if(!klas) return stuur(404, { error:{ message:'Requested entity was not found.' } });
    if(pad[2] === 'students') return stuur(200, { students:klas.leerlingen });
    if(pad[2] !== 'courseWork') return stuur(404, { error:{ message:'onbekend pad' } });
    if(pad.length === 3 && m === 'POST'){
      const nu = Date.now(), due = body.dueDate ? Date.UTC(body.dueDate.year, body.dueDate.month - 1, body.dueDate.day, (body.dueTime || {}).hours || 0, (body.dueTime || {}).minutes || 0) : null;
      if(due && due < nu - 60000) return stuur(400, { error:{ message:'@DueDateInPast' } });
      const cw = Object.assign({}, body, { id:id('cw'), courseId:klas.id, alternateLink:`https://classroom.google.com/c/${klas.id}/a/${st.n}` });
      st.werk[cw.id] = cw; st.inzending[cw.id] = klas.leerlingen.map(l=>({ id:id('s'), userId:l.userId, courseWorkId:cw.id, state:'CREATED' }));
      return stuur(200, cw);
    }
    const cw = st.werk[pad[3]];
    if(!cw || cw.courseId !== klas.id) return stuur(404, { error:{ message:'Requested entity was not found.' } });
    if(pad.length === 4){
      if(m === 'GET') return stuur(200, cw);
      if(m === 'PATCH'){ (u.searchParams.get('updateMask') || '').split(',').filter(Boolean).forEach(k=>{ if(k in body) cw[k] = body[k]; else delete cw[k]; }); return stuur(200, cw); }
    }
    if(pad[4] === 'studentSubmissions'){
      if(pad.length === 5) return stuur(200, { studentSubmissions:st.inzending[cw.id] });
      const [sid, actie] = pad[5].split(':'); const s = st.inzending[cw.id].find(x=>x.id === sid);
      if(!s) return stuur(404, { error:{ message:'Requested entity was not found.' } });
      if(actie === 'return' && m === 'POST'){ s.state = 'RETURNED'; return stuur(200, {}); }
      if(m === 'PATCH'){ (u.searchParams.get('updateMask') || '').split(',').forEach(k=>{ s[k] = body[k]; }); return stuur(200, s); }
    }
    return stuur(404, { error:{ message:'onbekend pad' } });
  });
  return { staat:st, werk:()=>Object.values(st.werk), inzendingen:cw=>st.inzending[cw] || [] };
}
module.exports = { installeer };
