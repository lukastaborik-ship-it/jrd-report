/* ============================================================
   JRD LinkedIn Dashboard — logika
   ============================================================ */
const C = {
  teal:'#5f8c94', koromiko:'#ffb14e', salmon:'#fa8775',
  punch:'#ea5f94', orchid:'#ec7ed8', grape:'#54399a',
  black:'#000000', ink:'#1c1f22', gray:'#888d92', grid:'#ebedee',
};
const PERSON_COLOR = { 'Jan Řežáb': C.teal, 'Jan Sadil': C.koromiko, 'JRD': C.grape };
const MONTHS_SHORT = ['Led','Úno','Bře','Dub','Kvě','Čvn','Čvc','Srp','Zář','Říj','Lis','Pro'];

const SECTIONS = [
  { id:'overview', icon:'1', title:'Přehled',          sub:'Jak se nám daří na první pohled',          person:true  },
  { id:'reach',    icon:'2', title:'Dosah v čase',      sub:'Vývoj a růst dosahu příspěvků',            person:true  },
  { id:'timing',   icon:'3', title:'Nejlepší čas',      sub:'Kdy publikovat pro maximální dosah',       person:true  },
  { id:'network',  icon:'4', title:'Růst sítě',         sub:'Sledující a spojení v čase',               person:false },
  { id:'compare',  icon:'5', title:'Srovnání profilů',  sub:'Jan Řežáb vs Jan Sadil',                   person:false },
  { id:'top',      icon:'6', title:'TOP příspěvky',     sub:'Nejúspěšnější příspěvky podle dosahu',     person:false },
  { id:'pipeline', icon:'7', title:'Stav obsahu',       sub:'Publikováno vs. rozpracováno',             person:false },
];

let DATA = null;
let state = { section:'overview', year:'all', person:'all', netTab:'Jan Řežáb' };
const charts = {};

const fmt = n => (n==null?'—':Math.round(n).toLocaleString('cs-CZ'));
const fmtK = n => n>=1000 ? (n/1000).toLocaleString('cs-CZ',{maximumFractionDigits:1})+' tis.' : fmt(n);
const fmtMln = n => n>=1e6 ? (n/1e6).toLocaleString('cs-CZ',{maximumFractionDigits:2})+' mil.' : fmtK(n);
const fmtDate = iso => { const [y,m,d]=iso.split('-'); return `${+d}.${+m}.${y}`; };
const yearOf = iso => Number(iso.slice(0,4));
const $ = s => document.querySelector(s);

Chart.register(ChartDataLabels);
Chart.defaults.font.family = "'Open Sans','Helvetica Neue',Arial,sans-serif";
Chart.defaults.color = C.ink;
Chart.defaults.plugins.datalabels.display = false;
Chart.defaults.plugins.legend.labels.font = { family:"'Montserrat',sans-serif", weight:'600', size:12 };
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.boxWidth = 8;

function mkChart(id, cfg){ if(charts[id]) charts[id].destroy(); charts[id]=new Chart($('#'+id), cfg); }
const baseScales = (pct=false) => ({
  x:{ grid:{display:false}, ticks:{font:{size:11}} },
  y:{ grid:{color:C.grid}, border:{display:false},
      ticks:{ font:{size:11}, callback:v=> pct? v+'%' : fmtK(v) } }
});
const tip = { backgroundColor:C.black, padding:12, titleFont:{family:"'Montserrat'",weight:'700'},
  bodyFont:{family:"'Open Sans'"}, cornerRadius:4, displayColors:true, boxPadding:4 };

// ----------------------------------------------------------------------------
async function init(){
  DATA = await (await fetch('data.json')).json();
  const q = new URLSearchParams(location.search);
  if(q.get('s') && SECTIONS.some(x=>x.id===q.get('s'))) state.section = q.get('s');
  if(q.get('year')) state.year = q.get('year');
  if(q.get('person')) state.person = q.get('person');
  if(q.get('net')) state.netTab = q.get('net');
  buildNav();
  buildYearSeg();
  buildPersonSeg();
  buildFoot();
  render();
}

function buildNav(){
  $('#nav').innerHTML = SECTIONS.map(s=>`
    <button class="nav__item${s.id===state.section?' is-active':''}" data-sec="${s.id}">
      <span class="nav__num">${s.icon}</span><span>${s.title}</span>
    </button>`).join('');
  $('#nav').querySelectorAll('.nav__item').forEach(b=>b.onclick=()=>{ state.section=b.dataset.sec; render(); });
}
function buildYearSeg(){
  const yrs = ['all', ...DATA.meta.years];
  $('#yearSeg').innerHTML = yrs.map(y=>`<button data-year="${y}"${String(y)===String(state.year)?' class="is-active"':''}>${y==='all'?'Vše':y}</button>`).join('');
  $('#yearSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{ state.year=b.dataset.year; render(); });
}
function buildPersonSeg(){
  const labels = { 'all':'Vše', 'Jan Řežáb':'J. Řežáb', 'Jan Sadil':'J. Sadil' };
  $('#personSeg').innerHTML = DATA.meta.persons.map(p=>`<button data-person="${p}"${p===state.person?' class="is-active"':''}>${labels[p]||p}</button>`).join('');
  $('#personSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{ state.person=b.dataset.person; render(); });
}
function buildFoot(){
  const m=DATA.meta;
  $('#foot').innerHTML = `Zdroj: ${m.source_file}<br>Aktualizováno: ${m.generated_at}<br>Data k ${m.data_until}`;
}

// ----------------------------------------------------------------------------
function render(){
  const sec = SECTIONS.find(s=>s.id===state.section);
  $('#nav').querySelectorAll('.nav__item').forEach(b=>b.classList.toggle('is-active', b.dataset.sec===state.section));
  $('#secTitle').textContent = sec.title;
  $('#secSub').textContent = sec.sub;
  $('#personWrap').style.display = sec.person ? '' : 'none';
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('is-active'));
  $('#s-'+sec.id).classList.add('is-active');
  $('#yearSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('is-active', String(b.dataset.year)===String(state.year)));
  $('#personSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('is-active', b.dataset.person===state.person));

  ({ overview:renderOverview, reach:renderReach, timing:renderTiming,
     network:renderNetwork, compare:renderCompare, top:renderTop, pipeline:renderPipeline })[sec.id]();
}

const kkey = () => `${state.year}|${state.person}`;
const prevYearKey = () => {
  if(state.year==='all') return null;
  const i = DATA.meta.years.indexOf(Number(state.year));
  return i>0 ? `${DATA.meta.years[i-1]}|${state.person}` : null;
};

// ---- 1. OVERVIEW ----
function renderOverview(){
  const k = DATA.kpis[kkey()] || {reach:0,posts:0,avg:0,engagement:0};
  const pk = prevYearKey() ? DATA.kpis[prevYearKey()] : null;
  const delta = (cur,prev) => {
    if(!pk || !prev) return '';
    const d = Math.round((cur-prev)/prev*100);
    const cls = d>=0?'up':'down';
    const arrow = d>=0?'▲':'▼';
    return `<span class="kpi__delta ${cls}">${arrow} ${Math.abs(d)} %</span><span>vs ${DATA.meta.years[DATA.meta.years.indexOf(Number(state.year))-1]}</span>`;
  };
  // síť LinkedIn — sledující celkem k dnešku
  let follNow=0, follGain=0;
  for(const p of ['Jan Řežáb','Jan Sadil','JRD']){
    const s = DATA.network[p]?.LinkedIn?.summary; if(s){ follNow+=s.foll_now||0; follGain+=s.foll_gain||0; }
  }
  const tiles = [
    { dark:true, label:'Celkový dosah', value:fmt(k.reach), sub:delta(k.reach, pk&&pk.reach) || 'zobrazení příspěvků' },
    { label:'Publikované příspěvky', value:fmt(k.posts), sub:delta(k.posts, pk&&pk.posts) || 'za období' },
    { label:'Průměrný dosah / příspěvek', value:fmt(k.avg), sub:delta(k.avg, pk&&pk.avg) || 'zobrazení' },
    { label:'Míra zapojení', value:(k.engagement||0).toLocaleString('cs-CZ')+' %', sub:'lajky + komentáře / dosah' },
    { label:'Sledující na LinkedIn (k dnešku)', value:fmt(follNow), sub:`<span class="kpi__delta up">▲ +${fmt(follGain)}</span><span>od začátku</span>` },
  ];
  $('#kpiGrid').innerHTML = tiles.map(t=>`
    <div class="kpi${t.dark?' kpi--dark':''}">
      <div class="kpi__label">${t.label}</div>
      <div class="kpi__value">${t.value}</div>
      <div class="kpi__sub">${t.sub}</div>
    </div>`).join('');

  // monthly chart (if year specific) else yearly
  if(state.year==='all'){
    $('#ovChartHint').textContent = 'souhrn po letech';
    const yrs = DATA.meta.years;
    mkChart('ovMonthly',{ type:'bar', data:{ labels:yrs.map(String),
      datasets:[{ label:'Celkový dosah', data:yrs.map(y=>{
        const a=DATA.yearly[y]||{}; return (a['Jan Řežáb']||0)+(a['Jan Sadil']||0); }),
        backgroundColor:C.teal, borderRadius:3 }]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:{...tip,callbacks:{label:c=>fmt(c.parsed.y)+' zobrazení'}}}, scales:baseScales() }});
  } else {
    $('#ovChartHint').textContent = `rok ${state.year}`;
    const m = DATA.monthly[kkey()] || new Array(12).fill(0);
    mkChart('ovMonthly',{ type:'bar', data:{ labels:MONTHS_SHORT,
      datasets:[{ label:'Dosah', data:m, backgroundColor:C.teal, borderRadius:3 }]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:{...tip,callbacks:{label:c=>fmt(c.parsed.y)+' zobrazení'}}}, scales:baseScales() }});
  }
}

// ---- 2. REACH ----
function renderReach(){
  const yearForCharts = state.year==='all' ? DATA.meta.years[DATA.meta.years.length-1] : Number(state.year);
  const m = DATA.monthly[`${yearForCharts}|${state.person}`] || new Array(12).fill(0);
  mkChart('reachMonthly',{ type:'bar', data:{ labels:MONTHS_SHORT,
    datasets:[{ label:`Dosah ${yearForCharts}`, data:m, backgroundColor:C.teal, borderRadius:3 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:{...tip,callbacks:{label:c=>fmt(c.parsed.y)}}}, scales:baseScales() }});

  const cum = (DATA.cumulative[yearForCharts]||{}).cumulative || new Array(12).fill(0);
  mkChart('reachCumulative',{ type:'line', data:{ labels:MONTHS_SHORT,
    datasets:[{ label:`Kumulativně ${yearForCharts}`, data:cum, borderColor:C.teal, backgroundColor:'rgba(95,140,148,0.12)',
      fill:true, tension:0.3, pointRadius:3, pointBackgroundColor:C.teal, borderWidth:2.5 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:{...tip,callbacks:{label:c=>'Dohromady: '+fmt(c.parsed.y)}}}, scales:baseScales() }});

  const stacks = DATA.monthly_stacked[String(yearForCharts)]||{};
  const ds = Object.keys(stacks).map(p=>({ label:p, data:stacks[p], backgroundColor:PERSON_COLOR[p], borderRadius:2, stack:'s' }));
  mkChart('reachStacked',{ type:'bar', data:{ labels:MONTHS_SHORT, datasets:ds },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'top'}, tooltip:{...tip,callbacks:{label:c=>c.dataset.label+': '+fmt(c.parsed.y)}}},
      scales:{ x:{stacked:true,grid:{display:false}}, y:{stacked:true,grid:{color:C.grid},border:{display:false},ticks:{callback:v=>fmtK(v)}} } }});

  const yrs = DATA.meta.years;
  mkChart('reachYearly',{ type:'bar', data:{ labels:yrs.map(String),
    datasets:[
      {label:'Jan Řežáb', data:yrs.map(y=>(DATA.yearly[y]||{})['Jan Řežáb']||0), backgroundColor:C.teal, borderRadius:3, stack:'s'},
      {label:'Jan Sadil', data:yrs.map(y=>(DATA.yearly[y]||{})['Jan Sadil']||0), backgroundColor:C.koromiko, borderRadius:3, stack:'s'},
    ]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'top'}, tooltip:{...tip,callbacks:{label:c=>c.dataset.label+': '+fmt(c.parsed.y)}},
      datalabels:{display:ctx=>ctx.datasetIndex===1, anchor:'end',align:'end',formatter:(v,ctx)=>{const i=ctx.dataIndex;const a=DATA.yearly[yrs[i]]||{};return fmtMln((a['Jan Řežáb']||0)+(a['Jan Sadil']||0));},font:{family:"'Montserrat'",weight:'700',size:11},color:C.black}},
      scales:{ x:{stacked:true,grid:{display:false}}, y:{stacked:true,grid:{color:C.grid},border:{display:false},ticks:{callback:v=>fmtK(v)}} } }});
}

// ---- 3. TIMING ----
function renderTiming(){
  const t = DATA.timing[kkey()];
  if(!t){ return; }
  const colorByVal = (arr,max) => arr.map(v=> `rgba(95,140,148,${0.25+0.75*(v/max||0)})`);
  // day
  const dMax = Math.max(...t.day.map(d=>d.avg));
  mkChart('timeDay',{ type:'bar', data:{ labels:t.day.map(d=>d.label),
    datasets:[{ data:t.day.map(d=>d.avg), backgroundColor:colorByVal(t.day.map(d=>d.avg),dMax), borderRadius:3 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},
      tooltip:{...tip,callbacks:{label:c=>fmt(c.parsed.y)+' prům. dosah',afterLabel:c=>`${t.day[c.dataIndex].n} příspěvků`+(t.day[c.dataIndex].low?' (malý vzorek)':'')}}},
      scales:baseScales() }});
  // hour
  const hours = t.hour.filter(h=>h.n>0);
  const hMax = Math.max(...hours.map(h=>h.avg));
  mkChart('timeHour',{ type:'bar', data:{ labels:hours.map(h=>h.hour+':00'),
    datasets:[{ data:hours.map(h=>h.avg), backgroundColor:colorByVal(hours.map(h=>h.avg),hMax), borderRadius:3 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},
      tooltip:{...tip,callbacks:{label:c=>fmt(c.parsed.y)+' prům. dosah',afterLabel:c=>`${hours[c.dataIndex].n} příspěvků`+(hours[c.dataIndex].low?' (malý vzorek)':'')}}},
      scales:baseScales() }});
  // month
  const mMax = Math.max(...t.month.map(m=>m.avg));
  mkChart('timeMonth',{ type:'bar', data:{ labels:MONTHS_SHORT,
    datasets:[{ data:t.month.map(m=>m.avg), backgroundColor:colorByVal(t.month.map(m=>m.avg),mMax), borderRadius:3 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},
      tooltip:{...tip,callbacks:{label:c=>fmt(c.parsed.y)+' prům. dosah',afterLabel:c=>`${t.month[c.dataIndex].n} příspěvků`}}},
      scales:baseScales() }});
  renderHeatmap(t.heatmap);
  // note
  const best = [...t.day].sort((a,b)=>b.avg-a.avg)[0];
  const bestH = [...t.hour].filter(h=>!h.low&&h.n>0).sort((a,b)=>b.avg-a.avg)[0];
  $('#timeNote').innerHTML = `💡 V tomto výběru vychází nejlépe <b>${best?best.label:'—'}</b> (prům. ${fmt(best?best.avg:0)} zobrazení)` +
    (bestH?` a publikace kolem <b>${bestH.hour}:00</b> (prům. ${fmt(bestH.avg)}).`:'.') +
    ` <span class="lowsample">Hodiny a dny s méně než 10 příspěvky berte orientačně.</span>`;
}

function renderHeatmap(cells){
  const WD = ['Po','Út','St','Čt','Pá','So','Ne'];
  const max = Math.max(...cells.map(c=>c.avg), 1);
  const map = {};
  cells.forEach(c=> map[c.d+'_'+c.h]=c);
  // active hours range
  const hoursPresent = [...new Set(cells.map(c=>c.h))].sort((a,b)=>a-b);
  const hMin = Math.min(...hoursPresent), hMax = Math.max(...hoursPresent);
  let html = '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:11px">';
  html += '<tr><th style="padding:4px;text-align:left"></th>';
  for(let h=hMin;h<=hMax;h++) html+=`<th style="padding:3px 2px;font-family:Montserrat;font-weight:600;color:#888;font-size:10px">${h}</th>`;
  html += '</tr>';
  for(let d=0;d<7;d++){
    html += `<tr><td style="padding:4px 8px 4px 4px;font-family:Montserrat;font-weight:600;color:#1c1f22">${WD[d]}</td>`;
    for(let h=hMin;h<=hMax;h++){
      const c = map[d+'_'+h];
      if(c){
        const op = 0.12 + 0.88*(c.avg/max);
        const txt = c.avg/max>0.55?'#fff':'#1c1f22';
        html += `<td title="${WD[d]} ${h}:00 — prům. ${fmt(c.avg)} (${c.n} přísp.)" style="background:rgba(95,140,148,${op.toFixed(2)});color:${txt};text-align:center;padding:6px 2px;font-size:9px;font-weight:600">${c.avg>=1000?Math.round(c.avg/1000)+'k':c.avg}</td>`;
      } else {
        html += `<td style="background:#f5f6f6;border:1px solid #fff"></td>`;
      }
    }
    html += '</tr>';
  }
  html += '</table></div>';
  $('#heatmap').innerHTML = html;
}

// ---- 4. NETWORK ----
function renderNetwork(){
  // tabs
  $('#netTabs').innerHTML = ['Jan Řežáb','Jan Sadil','JRD'].map(p=>`<button class="subtab${p===state.netTab?' is-active':''}" data-net="${p}">${p}</button>`).join('');
  $('#netTabs').querySelectorAll('.subtab').forEach(b=>b.onclick=()=>{ state.netTab=b.dataset.net; renderNetwork(); });

  const person = state.netTab;
  const li = DATA.network[person].LinkedIn;
  const yr = state.year;

  // Síť roste v čase → při zvoleném roce oříznout řadu ke KONCI toho roku
  // (poslední záznam roku = maximální/aktuální hodnota k danému roku).
  const cut = arr => (yr==='all') ? arr.slice() : arr.filter(p=>yearOf(p.date)<=Number(yr));
  const series = (() => { const c = cut(li.series); return c.length ? c : li.series.slice(0,1); })();
  const firstFoll = li.series.find(p=>p.foll!=null) || li.series[0];
  const firstConn = li.series.find(p=>p.conn!=null) || li.series[0];
  const lastFoll = [...series].reverse().find(p=>p.foll!=null) || firstFoll;
  const lastConn = [...series].reverse().find(p=>p.conn!=null) || firstConn;
  const gain = (a,b)=> a-b;
  const pct  = (a,b)=> b ? Math.round((a-b)/b*100) : 0;

  // summary tiles — hodnota vždy "k datu" posledního záznamu zvoleného období
  const tiles = [
    { l:'Sledující — start', v:fmt(firstFoll.foll), d:fmtDate(firstFoll.date), muted:true },
    { l:`Sledující — k ${fmtDate(lastFoll.date)}`, v:fmt(lastFoll.foll), d:`+${fmt(gain(lastFoll.foll,firstFoll.foll))} (+${pct(lastFoll.foll,firstFoll.foll)} %)` },
    { l:'Spojení — start', v:fmt(firstConn.conn), d:fmtDate(firstConn.date), muted:true },
    { l:`Spojení — k ${fmtDate(lastConn.date)}`, v:fmt(lastConn.conn), d:`+${fmt(gain(lastConn.conn,firstConn.conn))} (+${pct(lastConn.conn,firstConn.conn)} %)` },
  ];
  $('#netSummary').innerHTML = tiles.map(t=>`<div class="ns-tile"><div class="l">${t.l}</div><div class="v">${t.v}</div>${t.d?`<div class="d"${t.muted?' style="color:var(--text-faint)"':''}>${t.d}</div>`:''}</div>`).join('');

  const labels = series.map(p=>p.date);
  mkChart('netFollowers',{ type:'line', data:{ labels,
    datasets:[{ label:'Sledující', data:series.map(p=>p.foll), borderColor:PERSON_COLOR[person],
      backgroundColor:'rgba(95,140,148,0.10)', fill:true, tension:0.25, pointRadius:0, borderWidth:2.5 }]},
    options:netLineOpts() });
  mkChart('netConnections',{ type:'line', data:{ labels,
    datasets:[{ label:'Spojení', data:series.map(p=>p.conn), borderColor:C.koromiko,
      backgroundColor:'rgba(255,177,78,0.12)', fill:true, tension:0.25, pointRadius:0, borderWidth:2.5 }]},
    options:netLineOpts() });

  // přírůstek sledujících po letech (jen roky <= zvolený rok)
  const yg = li.summary.foll_yearly_gain||{};
  let yrs = Object.keys(yg);
  if(yr!=='all') yrs = yrs.filter(y=>Number(y)<=Number(yr));
  mkChart('netYearly',{ type:'bar', data:{ labels:yrs,
    datasets:[{ data:yrs.map(y=>yg[y]), backgroundColor:PERSON_COLOR[person], borderRadius:3 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},
      datalabels:{display:true,anchor:'end',align:'end',formatter:v=>'+'+fmt(v),font:{family:"'Montserrat'",weight:'700',size:11},color:C.black},
      tooltip:{...tip,callbacks:{label:c=>'+'+fmt(c.parsed.y)+' sledujících'}}}, scales:baseScales() }});

  // IG/FB note for JRD — také k datu zvoleného období
  if(person==='JRD'){
    const lastUp = plat => { const c = cut(DATA.network.JRD[plat]?.series||[]).filter(p=>p.foll!=null); return c.length?c[c.length-1]:null; };
    const ig=lastUp('Instagram'), fb=lastUp('Facebook');
    let extra='';
    if(ig) extra+=`Instagram: <b>${fmt(ig.foll)}</b> sledujících (k ${fmtDate(ig.date)}). `;
    if(fb) extra+=`Facebook: <b>${fmt(fb.foll)}</b> sledujících (k ${fmtDate(fb.date)}).`;
    if(!ig && !fb) extra = `Pro zvolené období zatím nejsou data (Instagram a Facebook sledujeme od dubna 2025).`;
    $('#netNote').innerHTML = `📊 <b>Bonus — další platformy JRD.</b> ${extra}`;
    $('#netNote').style.display='';
  } else {
    $('#netNote').style.display='none';
  }
}
function netLineOpts(){
  return { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},
    tooltip:{...tip,callbacks:{label:c=>fmt(c.parsed.y)}}},
    scales:{ x:{grid:{display:false}, ticks:{maxTicksLimit:8,font:{size:10}}}, y:{grid:{color:C.grid},border:{display:false},ticks:{callback:v=>fmtK(v)}} } };
}

// ---- 5. COMPARE ----
function renderCompare(){
  const yr = state.year;
  const persons = ['Jan Řežáb','Jan Sadil'];
  const ks = persons.map(p=> DATA.kpis[`${yr}|${p}`]||{reach:0,posts:0,avg:0,engagement:0});
  mkChart('cmpReach',{ type:'bar', data:{ labels:persons,
    datasets:[{ data:ks.map(k=>k.reach), backgroundColor:[C.teal,C.koromiko], borderRadius:3 }]},
    options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{legend:{display:false},
      datalabels:{display:true,anchor:'end',align:'right',formatter:v=>fmt(v),font:{family:"'Montserrat'",weight:'700'},color:C.ink},
      tooltip:{...tip,callbacks:{label:c=>fmt(c.parsed.x)}}}, scales:{x:{grid:{color:C.grid},border:{display:false},ticks:{callback:v=>fmtK(v)}},y:{grid:{display:false}}} }});
  mkChart('cmpAvg',{ type:'bar', data:{ labels:persons,
    datasets:[{ data:ks.map(k=>k.avg), backgroundColor:[C.teal,C.koromiko], borderRadius:3 }]},
    options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{legend:{display:false},
      datalabels:{display:true,anchor:'end',align:'right',formatter:v=>fmt(v),font:{family:"'Montserrat'",weight:'700'},color:C.ink},
      tooltip:{...tip,callbacks:{label:c=>fmt(c.parsed.x)}}}, scales:{x:{grid:{color:C.grid},border:{display:false},ticks:{callback:v=>fmtK(v)}},y:{grid:{display:false}}} }});

  const rows = persons.map((p,i)=>{
    const k=ks[i]; const net=DATA.network[p]?.LinkedIn?.summary;
    return `<tr><td><span class="badge ${p==='Jan Řežáb'?'badge--jr':'badge--js'}">${p}</span></td>
      <td class="num">${fmt(k.posts)}</td><td class="num">${fmt(k.reach)}</td><td class="num">${fmt(k.avg)}</td>
      <td class="num">${(k.engagement||0).toLocaleString('cs-CZ')} %</td>
      <td class="num">${net?fmt(net.foll_now):'—'}</td>
      <td class="num">${net?'+'+fmt(net.foll_gain):'—'}</td></tr>`;
  }).join('');
  $('#cmpTable').innerHTML = `<thead><tr><th>Profil</th><th class="num">Příspěvků</th><th class="num">Dosah</th><th class="num">Ø dosah</th><th class="num">Zapojení</th><th class="num">Sledující dnes</th><th class="num">Růst sled.</th></tr></thead><tbody>${rows}</tbody>`;
}

// ---- 6. TOP ----
function renderTop(){
  const rows = DATA.top_posts.map((p,i)=>`
    <tr><td class="rank">${i+1}</td>
      <td><span class="badge ${p.name==='Jan Řežáb'?'badge--jr':'badge--js'}">${p.name==='Jan Řežáb'?'J. Řežáb':'J. Sadil'}</span></td>
      <td>${p.date}</td>
      <td>${p.idea||'<span class="muted">—</span>'}</td>
      <td class="num">${fmt(p.imp)}</td>
      <td class="num">${fmt(p.likes)}</td>
      <td class="num">${fmt(p.comments)}</td></tr>`).join('');
  $('#topTable').innerHTML = `<thead><tr><th>#</th><th>Autor</th><th>Datum</th><th>Hlavní myšlenka</th><th class="num">Dosah</th><th class="num">Lajky</th><th class="num">Koment.</th></tr></thead><tbody>${rows}</tbody>`;
}

// ---- 7. PIPELINE ----
function renderPipeline(){
  const pipe = DATA.pipeline;
  const labelMap = { '1 - Done':'Publikováno','8 - Idea':'Nápad','5 - WIP':'Rozpracováno',
    '4 - Client control':'Ke schválení','3 - Edit':'Úprava','99 - Don\'t add':'Nepublikovat','—':'Bez stavu' };
  const entries = Object.entries(pipe).sort((a,b)=>b[1]-a[1]);
  const labels = entries.map(e=>labelMap[e[0]]||e[0]);
  const vals = entries.map(e=>e[1]);
  const cols = entries.map(e=> e[0]==='1 - Done'?C.teal:C.gray);
  mkChart('pipeChart',{ type:'doughnut', data:{ labels, datasets:[{ data:vals, backgroundColor:[C.teal,C.koromiko,C.salmon,C.orchid,C.grape,C.gray,'#cccccc'], borderWidth:2, borderColor:'#fff' }]},
    options:{ responsive:true, maintainAspectRatio:false, cutout:'58%', plugins:{legend:{position:'right'},
      tooltip:{...tip,callbacks:{label:c=>c.label+': '+fmt(c.parsed)}}}} });
  const total = vals.reduce((a,b)=>a+b,0);
  $('#pipeTable').innerHTML = `<thead><tr><th>Stav</th><th class="num">Počet</th><th class="num">Podíl</th></tr></thead><tbody>`+
    entries.map((e,i)=>`<tr><td>${labels[i]}</td><td class="num">${fmt(e[1])}</td><td class="num">${Math.round(e[1]/total*100)} %</td></tr>`).join('')+
    `<tr style="font-weight:700"><td>Celkem</td><td class="num">${fmt(total)}</td><td class="num">100 %</td></tr></tbody>`;
}

init();
