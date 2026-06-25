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
  { id:'profiles', icon:'8', title:'Profily ambasadorů', sub:'LinkedIn Analytics — data přímo z platformy', person:false },
  { id:'social',   icon:'9', title:'Sociální sítě',      sub:'Facebook & Instagram — statistiky 2026',       person:false },
  { id:'ambs',     icon:'↔', title:'Komparace LinkedIn',  sub:'Jan Řežáb vs Jan Sadil — grafy vedle sebe',   person:false, year:false },
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
  $('#yearWrap').style.display   = sec.year === false ? 'none' : '';
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('is-active'));
  $('#s-'+sec.id).classList.add('is-active');
  $('#yearSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('is-active', String(b.dataset.year)===String(state.year)));
  $('#personSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('is-active', b.dataset.person===state.person));

  ({ overview:renderOverview, reach:renderReach, timing:renderTiming,
     network:renderNetwork, compare:renderCompare, top:renderTop, pipeline:renderPipeline,
     profiles:renderProfiles, social:renderSocial, ambs:renderAmbs })[sec.id]();
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
  // síť LinkedIn — sledující ke konci zvoleného roku (síť roste v čase)
  const netUpTo = (person) => {
    const series = DATA.network[person]?.LinkedIn?.series;
    if(!series || !series.length) return null;
    const first = series.find(p=>p.foll!=null) || series[0];
    const filt = (state.year==='all') ? series : series.filter(p=>yearOf(p.date)<=Number(state.year));
    const last = [...(filt.length?filt:series.slice(0,1))].reverse().find(p=>p.foll!=null) || first;
    return { start:first.foll, foll:last.foll, date:last.date };
  };
  const netPersons = (state.person==='all') ? ['Jan Řežáb','Jan Sadil','JRD'] : [state.person];
  let follNow=0, follGain=0, lastDate='';
  for(const p of netPersons){ const v=netUpTo(p); if(v){ follNow+=v.foll; follGain+=(v.foll-v.start); if(v.date>lastDate) lastDate=v.date; } }
  const follLabel = state.year==='all'
    ? `Sledující na LinkedIn (k ${lastDate?fmtDate(lastDate):'dnešku'})`
    : `Sledující na LinkedIn (k ${lastDate?fmtDate(lastDate):'konci '+state.year})`;

  const tiles = [
    { dark:true, label:'Celkový dosah', value:fmt(k.reach), sub:delta(k.reach, pk&&pk.reach) || 'zobrazení příspěvků' },
    { label:'Publikované příspěvky', value:fmt(k.posts), sub:delta(k.posts, pk&&pk.posts) || 'za období' },
    { label:'Průměrný dosah / příspěvek', value:fmt(k.avg), sub:delta(k.avg, pk&&pk.avg) || 'zobrazení' },
    { label:'Míra zapojení', value:(k.engagement||0).toLocaleString('cs-CZ')+' %', sub:'lajky + komentáře / dosah' },
    { label:follLabel, value:fmt(follNow), sub:`<span class="kpi__delta up">▲ +${fmt(follGain)}</span><span>od začátku</span>` },
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

// ---- 8. PROFILY AMBASADORŮ ----
let profTab = 'Jan Řežáb';

function renderProfiles(){
  const persons = ['Jan Řežáb','Jan Sadil'];
  $('#profTabs').innerHTML = persons.map(p=>`<button class="subtab${p===profTab?' is-active':''}" data-prof="${p}">${p}</button>`).join('');
  $('#profTabs').querySelectorAll('.subtab').forEach(b=>b.onclick=()=>{ profTab=b.dataset.prof; renderProfiles(); });

  const a = DATA.linkedin_analytics[profTab];
  if(!a){ $('#profContent').innerHTML='<div class="note">Žádná data.</div>'; return; }

  const color = profTab==='Jan Řežáb' ? C.teal : C.koromiko;
  const colorRgb = profTab==='Jan Řežáb' ? '95,140,148' : '255,177,78';

  // Follower series filtered to 2026
  const netSeries = (DATA.network[profTab]?.LinkedIn?.series||[]).filter(p=>p.date>='2026-01-01');
  const firstNet = netSeries.find(p=>p.foll!=null);
  const lastNet = [...netSeries].reverse().find(p=>p.foll!=null);
  const follGain = (firstNet && lastNet) ? lastNet.foll - firstNet.foll : 0;

  // Monthly 2026 content data (only months with data)
  const monthly2026raw = DATA.monthly[`2026|${profTab}`] || new Array(12).fill(0);
  const monthlyLabels = MONTHS_SHORT.filter((_,i) => monthly2026raw[i] > 0);
  const monthlyData   = monthly2026raw.filter(v => v > 0);

  // Photo or initials
  const photoHtml = a.photo
    ? `<img src="${a.photo}" alt="${profTab}" class="prof-photo">`
    : `<div class="prof-initials" style="background:${color}">${profTab.split(' ').map(w=>w[0]).join('')}</div>`;

  const viewDelta = a.content.views_change_pct;
  const viewSign  = viewDelta >= 0 ? '▲' : '▼';
  const viewCls   = viewDelta >= 0 ? 'up' : 'down';

  // Demographic horizontal bars
  const demoBar = items => {
    const maxP = Math.max(...items.map(x=>x.pct), 1);
    return `<div class="demo-list">${items.map(item=>`
      <div class="demo-row">
        <div class="demo-row__top">
          <span class="demo-row__label">${item.label}</span>
          <span class="demo-row__pct">${item.pct} %</span>
        </div>
        <div class="demo-row__bar-wrap">
          <div class="demo-row__bar" style="width:${Math.round(item.pct/maxP*100)}%;background:rgba(${colorRgb},0.75)"></div>
        </div>
      </div>`).join('')}</div>`;
  };

  const engRows = [
    ['Reakce',              a.engagement.reactions],
    ['Komentáře',           a.engagement.comments],
    ['Přesdílení',          a.engagement.reshares],
    ['Uložení',             a.engagement.saves],
    ['Odeslání na LinkedIn',a.engagement.sends],
    ['Kliknutí na odkaz',   a.engagement.link_clicks],
  ];

  const hasImages = a.top_posts?.some(p => p.file);
  const topPostsHtml = (a.top_posts?.length) ? `
    <div class="card section-gap">
      <div class="card__head">
        <div class="card__title">Nejúspěšnější příspěvky</div>
        <div class="card__hint">dle zobrazení · ${a.period}</div>
      </div>
      ${hasImages ? `
      <div class="top-posts-grid">
        ${a.top_posts.map((p,i)=>`
          <div class="top-post-card">
            <div class="top-post-rank">#${i+1}</div>
            <img src="${p.file}" alt="Příspěvek ${i+1}" class="top-post-img" loading="lazy">
            <div class="top-post-body">
              <div class="top-post-text">${p.text}</div>
              <div class="top-post-views">${fmt(p.views)} <span>zobrazení</span></div>
            </div>
          </div>`).join('')}
      </div>` : `
      <table class="tbl">
        <thead><tr><th>#</th><th>Příspěvek</th><th class="num">Zobrazení</th></tr></thead>
        <tbody>${a.top_posts.map((p,i)=>`
          <tr>
            <td class="rank">${i+1}</td>
            <td style="font-size:13px;color:var(--text-body)">${p.text}</td>
            <td class="num">${fmt(p.views)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`}
    </div>` : '';

  $('#profContent').innerHTML = `

    <!-- Profilový header -->
    <div class="card prof-header">
      ${photoHtml}
      <div class="prof-header__info">
        <div class="prof-header__name">${profTab}</div>
        <div class="prof-header__tagline">${a.tagline}</div>
        <div class="prof-header__period">LinkedIn Analytics &middot; ${a.period}</div>
      </div>
      <div class="prof-header__stats">
        <div class="prof-stat">
          <div class="prof-stat__val">${fmt(a.content.views)}</div>
          <div class="prof-stat__lbl">Zobrazení</div>
          <div class="prof-stat__delta ${viewCls}">${viewSign} ${Math.abs(viewDelta)}&thinsp;%</div>
        </div>
        <div class="prof-stat">
          <div class="prof-stat__val">${fmt(a.followers.total)}</div>
          <div class="prof-stat__lbl">Sledující</div>
          <div class="prof-stat__delta up">▲ ${a.followers.change_pct}&thinsp;%</div>
        </div>
        <div class="prof-stat">
          <div class="prof-stat__val">${fmt(a.content.members_reached)}</div>
          <div class="prof-stat__lbl">Oslovení</div>
          <div class="prof-stat__delta neutral">členové</div>
        </div>
        <div class="prof-stat">
          <div class="prof-stat__val">${fmt(a.engagement.total)}</div>
          <div class="prof-stat__lbl">Interakcí</div>
          <div class="prof-stat__delta neutral">celkem</div>
        </div>
      </div>
    </div>

    <!-- Grafy růstu -->
    <div class="grid grid--2 section-gap">
      <div class="card">
        <div class="card__head">
          <div class="card__title">Růst sledujících</div>
          <div class="card__hint">2026 &middot; +${fmt(follGain)} nových</div>
        </div>
        <div class="chart-wrap"><canvas id="profFollowers"></canvas></div>
      </div>
      <div class="card">
        <div class="card__head">
          <div class="card__title">Zobrazení obsahu po měsících</div>
          <div class="card__hint">2026 &middot; zdroj: LinkedIn Analytics</div>
        </div>
        <div class="chart-wrap"><canvas id="profViews"></canvas></div>
      </div>
    </div>

    <!-- Zapojení + Pracovní tituly -->
    <div class="grid grid--2 section-gap">
      <div class="card">
        <div class="card__head"><div class="card__title">Zapojení publika</div><div class="card__hint">detail aktivit za období</div></div>
        <table class="tbl">
          <thead><tr><th>Typ aktivity</th><th class="num">Počet</th></tr></thead>
          <tbody>
            ${engRows.map(r=>`<tr><td>${r[0]}</td><td class="num">${fmt(r[1])}</td></tr>`).join('')}
            <tr style="font-weight:700;border-top:2px solid var(--border-default)">
              <td>Celkem sociální</td><td class="num">${fmt(a.engagement.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <div class="card__head"><div class="card__title">Pracovní tituly sledujících</div><div class="card__hint">demografická data LinkedIn</div></div>
        ${demoBar(a.demographics.job_title)}
      </div>
    </div>

    <!-- Lokalita + Služební věk -->
    <div class="grid grid--2 section-gap">
      <div class="card">
        <div class="card__head"><div class="card__title">Lokalita sledujících</div><div class="card__hint">top regiony</div></div>
        ${demoBar(a.demographics.location)}
      </div>
      <div class="card">
        <div class="card__head"><div class="card__title">Služební věk sledujících</div><div class="card__hint">seniorita publika</div></div>
        ${demoBar(a.demographics.seniority)}
      </div>
    </div>

    <!-- Obor + Velikost firmy -->
    <div class="grid grid--2 section-gap">
      <div class="card">
        <div class="card__head"><div class="card__title">Obor sledujících</div><div class="card__hint">top sektory</div></div>
        ${demoBar(a.demographics.industry)}
      </div>
      <div class="card">
        <div class="card__head"><div class="card__title">Velikost firmy sledujících</div><div class="card__hint">struktura publika dle velikosti firmy</div></div>
        ${demoBar(a.demographics.company_size)}
      </div>
    </div>

    ${topPostsHtml}
  `;

  // Chart: follower growth (2026)
  if(netSeries.length > 0){
    const gradColor = `rgba(${colorRgb},0.15)`;
    mkChart('profFollowers',{
      type:'line',
      data:{
        labels: netSeries.map(p=>p.date),
        datasets:[{
          label:'Sledující',
          data: netSeries.map(p=>p.foll),
          borderColor: color,
          backgroundColor: gradColor,
          fill: true, tension:0.35, pointRadius:2, pointHoverRadius:5,
          borderWidth:2.5
        }]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          tooltip:{...tip, callbacks:{label:c=>fmt(c.parsed.y)+' sledujících'}}
        },
        scales:{
          x:{ grid:{display:false}, ticks:{maxTicksLimit:7, font:{size:10}} },
          y:{ grid:{color:C.grid}, border:{display:false}, ticks:{callback:v=>fmtK(v)} }
        }
      }
    });
  }

  // Chart: monthly views 2026
  if(monthlyData.length > 0){
    mkChart('profViews',{
      type:'bar',
      data:{
        labels: monthlyLabels,
        datasets:[{
          label:'Zobrazení',
          data: monthlyData,
          backgroundColor:`rgba(${colorRgb},0.8)`,
          borderRadius:4
        }]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          tooltip:{...tip, callbacks:{label:c=>fmt(c.parsed.y)+' zobrazení'}},
          datalabels:{
            display:true, anchor:'end', align:'end',
            formatter: v => fmtK(v),
            font:{family:"'Montserrat'",weight:'700',size:10},
            color: C.ink
          }
        },
        scales:baseScales()
      }
    });
  }
}

// ---- 10. KOMPARACE AMBASADORŮ ----
function renderAmbs(){
  const rezab = DATA.linkedin_analytics['Jan Řežáb'];
  const sadil = DATA.linkedin_analytics['Jan Sadil'];

  const rSeries = (DATA.network['Jan Řežáb']?.LinkedIn?.series||[]).filter(p=>p.date>='2026-01-01');
  const sSeries = (DATA.network['Jan Sadil']?.LinkedIn?.series||[]).filter(p=>p.date>='2026-01-01');

  const rPosts = DATA.kpis['2026|Jan Řežáb']?.posts ?? '—';
  const sPosts = DATA.kpis['2026|Jan Sadil']?.posts ?? '—';

  const rViews = DATA.monthly['2026|Jan Řežáb'] || new Array(12).fill(0);
  const sViews = DATA.monthly['2026|Jan Sadil'] || new Array(12).fill(0);
  const rVLabels = MONTHS_SHORT.filter((_,i)=>rViews[i]>0);
  const rVData   = rViews.filter(v=>v>0);
  const sVLabels = MONTHS_SHORT.filter((_,i)=>sViews[i]>0);
  const sVData   = sViews.filter(v=>v>0);

  const follLabel = s => { const [,m,d]=s.date.split('-'); return `${+d}.${+m}.`; };

  const diffCell = (a,b) => {
    const d = a - b;
    return `<span class="${d>0?'up':'down'}">${d>0?'▲':'▼'} ${fmt(Math.abs(d))}</span>`;
  };

  $('#ambsContent').innerHTML = `
    <!-- Profil karty -->
    <div class="grid grid--2">
      <div class="card ambs-card" style="border-top:4px solid ${C.teal}">
        <div class="ambs-prof-row">
          <img src="${rezab.photo}" class="prof-photo" alt="Jan Řežáb">
          <div>
            <div class="ambs-name">Jan Řežáb</div>
            <div class="ambs-tag">${rezab.tagline}</div>
          </div>
        </div>
        <div class="ambs-kpis">
          <div class="ambs-kpi"><div class="ambs-kpi__val">${fmt(rezab.followers.total)}</div><div class="ambs-kpi__lbl">Sledující</div><div class="ambs-kpi__d up">▲ ${rezab.followers.change_pct} %</div></div>
          <div class="ambs-kpi"><div class="ambs-kpi__val">${rPosts}</div><div class="ambs-kpi__lbl">Příspěvků</div><div class="ambs-kpi__d" style="color:var(--text-faint)">v roce 2026</div></div>
          <div class="ambs-kpi"><div class="ambs-kpi__val">${fmtK(rezab.content.views)}</div><div class="ambs-kpi__lbl">Zobrazení</div></div>
          <div class="ambs-kpi"><div class="ambs-kpi__val">${fmt(rezab.engagement.total)}</div><div class="ambs-kpi__lbl">Interakcí</div></div>
          <div class="ambs-kpi"><div class="ambs-kpi__val">${fmt(rezab.content.members_reached)}</div><div class="ambs-kpi__lbl">Oslovení</div></div>
        </div>
      </div>
      <div class="card ambs-card" style="border-top:4px solid ${C.koromiko}">
        <div class="ambs-prof-row">
          <img src="${sadil.photo}" class="prof-photo" alt="Jan Sadil">
          <div>
            <div class="ambs-name">Jan Sadil</div>
            <div class="ambs-tag">${sadil.tagline}</div>
          </div>
        </div>
        <div class="ambs-kpis">
          <div class="ambs-kpi"><div class="ambs-kpi__val">${fmt(sadil.followers.total)}</div><div class="ambs-kpi__lbl">Sledující</div><div class="ambs-kpi__d up">▲ ${sadil.followers.change_pct} %</div></div>
          <div class="ambs-kpi"><div class="ambs-kpi__val">${sPosts}</div><div class="ambs-kpi__lbl">Příspěvků</div><div class="ambs-kpi__d" style="color:var(--text-faint)">v roce 2026</div></div>
          <div class="ambs-kpi"><div class="ambs-kpi__val">${fmtK(sadil.content.views)}</div><div class="ambs-kpi__lbl">Zobrazení</div></div>
          <div class="ambs-kpi"><div class="ambs-kpi__val">${fmt(sadil.engagement.total)}</div><div class="ambs-kpi__lbl">Interakcí</div></div>
          <div class="ambs-kpi"><div class="ambs-kpi__val">${fmt(sadil.content.members_reached)}</div><div class="ambs-kpi__lbl">Oslovení</div></div>
        </div>
      </div>
    </div>

    <!-- Sledující vedle sebe -->
    <div class="grid grid--2 section-gap">
      <div class="card">
        <div class="card__head">
          <div class="card__title" style="color:${C.teal}">Růst sledujících — Jan Řežáb</div>
          <div class="card__hint">${fmt(rSeries[0]?.foll)} → ${fmt(rSeries[rSeries.length-1]?.foll)} sledujících · 2026</div>
        </div>
        <div class="chart-wrap"><canvas id="ambsFollR"></canvas></div>
      </div>
      <div class="card">
        <div class="card__head">
          <div class="card__title" style="color:${C.koromiko}">Růst sledujících — Jan Sadil</div>
          <div class="card__hint">${fmt(sSeries[0]?.foll)} → ${fmt(sSeries[sSeries.length-1]?.foll)} sledujících · 2026</div>
        </div>
        <div class="chart-wrap"><canvas id="ambsFollS"></canvas></div>
      </div>
    </div>

    <!-- Zobrazení vedle sebe -->
    <div class="grid grid--2 section-gap">
      <div class="card">
        <div class="card__head">
          <div class="card__title" style="color:${C.teal}">Zobrazení po měsících — Jan Řežáb</div>
          <div class="card__hint">2026 · LinkedIn Analytics</div>
        </div>
        <div class="chart-wrap"><canvas id="ambsViewsR"></canvas></div>
      </div>
      <div class="card">
        <div class="card__head">
          <div class="card__title" style="color:${C.koromiko}">Zobrazení po měsících — Jan Sadil</div>
          <div class="card__hint">2026 · LinkedIn Analytics</div>
        </div>
        <div class="chart-wrap"><canvas id="ambsViewsS"></canvas></div>
      </div>
    </div>

    <!-- Srovnávací tabulka -->
    <div class="card section-gap">
      <div class="card__head">
        <div class="card__title">Klíčové ukazatele vedle sebe</div>
        <div class="card__hint">${rezab.period}</div>
      </div>
      <table class="tbl">
        <thead>
          <tr>
            <th>Ukazatel</th>
            <th class="num" style="color:${C.teal}">Jan Řežáb</th>
            <th class="num" style="color:${C.koromiko}">Jan Sadil</th>
            <th class="num">Rozdíl</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Příspěvků v roce 2026</td><td class="num">${rPosts}</td><td class="num">${sPosts}</td><td class="num">${diffCell(sPosts,rPosts)}</td></tr>
          <tr><td>Sledující celkem</td><td class="num">${fmt(rezab.followers.total)}</td><td class="num">${fmt(sadil.followers.total)}</td><td class="num">${diffCell(rezab.followers.total,sadil.followers.total)}</td></tr>
          <tr><td>Růst sledujících</td><td class="num">▲ ${rezab.followers.change_pct} %</td><td class="num">▲ ${sadil.followers.change_pct} %</td><td class="num">${rezab.followers.change_pct>sadil.followers.change_pct?'<span class="up">▲ Řežáb</span>':'<span class="up">▲ Sadil</span>'}</td></tr>
          <tr><td>Zobrazení obsahu</td><td class="num">${fmt(rezab.content.views)}</td><td class="num">${fmt(sadil.content.views)}</td><td class="num">${diffCell(rezab.content.views,sadil.content.views)}</td></tr>
          <tr><td>Oslovení členové</td><td class="num">${fmt(rezab.content.members_reached)}</td><td class="num">${fmt(sadil.content.members_reached)}</td><td class="num">${diffCell(rezab.content.members_reached,sadil.content.members_reached)}</td></tr>
          <tr><td>Interakce celkem</td><td class="num">${fmt(rezab.engagement.total)}</td><td class="num">${fmt(sadil.engagement.total)}</td><td class="num">${diffCell(rezab.engagement.total,sadil.engagement.total)}</td></tr>
          <tr><td>Reakce</td><td class="num">${fmt(rezab.engagement.reactions)}</td><td class="num">${fmt(sadil.engagement.reactions)}</td><td class="num">${diffCell(rezab.engagement.reactions,sadil.engagement.reactions)}</td></tr>
          <tr><td>Komentáře</td><td class="num">${fmt(rezab.engagement.comments)}</td><td class="num">${fmt(sadil.engagement.comments)}</td><td class="num">${diffCell(rezab.engagement.comments,sadil.engagement.comments)}</td></tr>
        </tbody>
      </table>
    </div>`;

  // Grafy sledujících
  const follCfg = (series, color) => ({
    type:'line',
    data:{
      labels: series.map(follLabel),
      datasets:[{
        data: series.map(p=>p.foll),
        borderColor:color, backgroundColor:color+'22',
        fill:true, tension:0.35, pointRadius:0, borderWidth:2
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{display:false},
        tooltip:{...tip, callbacks:{label:c=>`Sledující: ${fmt(c.parsed.y)}`}},
        datalabels:{display:false}
      },
      scales:{
        x:{grid:{display:false}, ticks:{font:{size:10}, maxTicksLimit:8, maxRotation:0}},
        y:{grid:{color:C.grid}, border:{display:false}, ticks:{font:{size:11}, callback:v=>fmtK(v)}}
      }
    }
  });
  mkChart('ambsFollR', follCfg(rSeries, C.teal));
  mkChart('ambsFollS', follCfg(sSeries, C.koromiko));

  // Grafy zobrazení
  const barCfg = (labels, data, color) => ({
    type:'bar',
    data:{
      labels,
      datasets:[{data, backgroundColor:color+'cc', borderRadius:6}]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{display:false},
        tooltip:{...tip, callbacks:{label:c=>`${fmt(c.parsed.y)} zobrazení`}},
        datalabels:{
          display:true, anchor:'end', align:'end',
          formatter:v=>fmtK(v),
          font:{family:"'Montserrat'",weight:'700',size:10},
          color:C.ink
        }
      },
      scales:baseScales()
    }
  });
  mkChart('ambsViewsR', barCfg(rVLabels, rVData, C.teal));
  mkChart('ambsViewsS', barCfg(sVLabels, sVData, C.koromiko));
}

// ---- 9. SOCIÁLNÍ SÍTĚ (FB + IG) ----
function renderSocial(){
  const sm = DATA.social_media;
  if(!sm){ $('#socialContent').innerHTML='<div class="note">Žádná data.</div>'; return; }

  const C_FB  = '#1877F2';
  const C_IG  = '#E1306C';
  const C_LI  = '#0A66C2';
  const C_FB_rgb = '24,119,242';
  const C_IG_rgb = '225,48,108';

  const fbSeries = DATA.network.JRD.Facebook.series || [];
  const igSeries = DATA.network.JRD.Instagram.series || [];
  const allDates = [...new Set([...fbSeries.map(p=>p.date), ...igSeries.map(p=>p.date)])].sort();
  const fbByDate = Object.fromEntries(fbSeries.map(p=>[p.date, p.foll]));
  const igByDate = Object.fromEntries(igSeries.map(p=>[p.date, p.foll]));

  const fbChange = sm.follower_change_since_start.Facebook;
  const igChange = sm.follower_change_since_start.Instagram;
  const pby = sm.posts_by_platform || {};

  // Procentní změna s šipkou a barvou
  const pctBadge = p => {
    if(p == null) return '';
    const up = p >= 0;
    const col = up ? 'var(--ob-teal-600)' : '#e53e3e';
    const sign = up ? '▲' : '▼';
    return `<span class="soc-pct" style="color:${col}">${sign} ${Math.abs(p).toFixed(1).replace('.',',')} %</span>`;
  };

  // Řádek metriky: název | číslo | % změna
  const metricRow = (label, value, pct) =>
    `<div class="soc-metric-row">
      <span class="soc-metric-lbl">${label}</span>
      <span class="soc-metric-val">${fmt(value)}</span>
      ${pctBadge(pct)}
    </div>`;

  // Split bar (podíl organika vs. reklamy)
  const splitBar = (org, paid, total, colorOrg, colorPaid) => {
    const pOrg  = Math.round(org/total*100);
    const pPaid = 100 - pOrg;
    return `<div class="soc-split-bar" style="margin-top:14px">
      <div style="width:${pOrg}%;background:${colorOrg}" title="Organika ${pOrg}%"></div>
      <div style="width:${pPaid}%;background:${colorPaid}" title="Reklamy ${pPaid}%"></div>
    </div>
    <div class="soc-split-legend">
      <span><span class="soc-dot" style="background:${colorOrg}"></span>Organika ${pOrg} %</span>
      <span><span class="soc-dot" style="background:${colorPaid}"></span>Reklamy ${pPaid} %</span>
    </div>`;
  };

  const fb = sm.facebook || {};
  const ig = sm.instagram || {};
  const li = sm.linkedin_jrd || {};

  // Body: highlighted start/end points for follower chart
  const fbData = allDates.map(d=>fbByDate[d]??null);
  const igData = allDates.map(d=>igByDate[d]??null);
  const lastIdx = allDates.length - 1;
  const fbRadii = allDates.map((_,i)=> i===0||i===lastIdx ? 6 : 0);
  const igRadii = allDates.map((_,i)=> i===0||i===lastIdx ? 6 : 0);

  $('#socialContent').innerHTML = `

    <!-- 0. Celkové KPI -->
    <div class="grid grid--kpi" style="margin-bottom:24px">
      <div class="kpi-card">
        <div class="kpi__val">${sm.posts_count}</div>
        <div class="kpi__lbl">Příspěvků</div>
        <div class="kpi__sub">${sm.period}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi__val">${fmtMln(sm.stats_2026.views)}</div>
        <div class="kpi__lbl">Zobrazení celkem</div>
        <div class="kpi__sub">FB + IG dohromady</div>
      </div>
      <div class="kpi-card">
        <div class="kpi__val">${fmtK(sm.stats_2026.reach)}</div>
        <div class="kpi__lbl">Dosah</div>
        <div class="kpi__sub">unikátní uživatelé</div>
      </div>
      <div class="kpi-card">
        <div class="kpi__val">${fmt(sm.stats_2026.interactions)}</div>
        <div class="kpi__lbl">Interakcí</div>
        <div class="kpi__sub">reakce, komentáře, sdílení</div>
      </div>
    </div>

    <!-- 1. Příspěvky po platformách -->
    <div class="soc-platforms-row">
      <div class="soc-platform-card" style="border-top:4px solid ${C_FB}">
        <div class="soc-platform-icon" style="background:${C_FB}">f</div>
        <div class="soc-platform-name">Facebook</div>
        <div class="soc-platform-posts">${pby.Facebook ?? '—'}</div>
        <div class="soc-platform-lbl">příspěvků 2026</div>
      </div>
      <div class="soc-platform-card" style="border-top:4px solid ${C_IG}">
        <div class="soc-platform-icon" style="background:${C_IG}">▶</div>
        <div class="soc-platform-name">Instagram</div>
        <div class="soc-platform-posts">${pby.Instagram ?? '—'}</div>
        <div class="soc-platform-lbl">příspěvků 2026</div>
      </div>
      <div class="soc-platform-card" style="border-top:4px solid ${C_LI}">
        <div class="soc-platform-icon" style="background:${C_LI}">in</div>
        <div class="soc-platform-name">LinkedIn</div>
        <div class="soc-platform-posts">${pby.LinkedIn ?? '—'}</div>
        <div class="soc-platform-lbl">příspěvků 2026</div>
      </div>
    </div>

    <!-- 2. Facebook + Instagram organika vs. reklamy -->
    <div class="grid grid--2 section-gap">
      <div class="card">
        <div class="card__head">
          <div class="card__title" style="color:${C_FB}">Facebook — zobrazení 2026</div>
          <div class="card__hint">${sm.period}</div>
        </div>
        <div class="soc-metrics">
          ${metricRow('Z organiky',       fb.views_organic, fb.views_organic_pct)}
          ${metricRow('Z reklam',         fb.views_paid,    fb.views_paid_pct)}
          ${metricRow('Celkem zobrazení', fb.views_total,   fb.views_total_pct)}
          ${metricRow('Diváci (dosah)',   fb.reach,         null)}
          ${metricRow('Interakce',        fb.interactions,  fb.interactions_pct)}
        </div>
        ${splitBar(fb.views_organic, fb.views_paid, fb.views_total, C_FB+'cc', C_FB+'44')}
      </div>
      <div class="card">
        <div class="card__head">
          <div class="card__title" style="color:${C_IG}">Instagram — zobrazení 2026</div>
          <div class="card__hint">${sm.period}</div>
        </div>
        <div class="soc-metrics">
          ${metricRow('Z organiky',       ig.views_organic, ig.views_organic_pct)}
          ${metricRow('Z reklam',         ig.views_paid,    ig.views_paid_pct)}
          ${metricRow('Celkem zobrazení', ig.views_total,   ig.views_total_pct)}
          ${metricRow('Dosah',            ig.reach,         ig.reach_pct)}
          ${metricRow('Interakce',        ig.interactions,  ig.interactions_pct)}
        </div>
        ${splitBar(ig.views_organic, ig.views_paid, ig.views_total, C_IG+'cc', C_IG+'44')}
      </div>
    </div>

    <!-- 3. Graf sledujících -->
    <div class="card section-gap">
      <div class="card__head">
        <div class="card__title">Vývoj sledujících — od začátku spolupráce</div>
        <div class="card__hint">
          <span style="color:${C_FB};font-weight:700">Facebook</span> ${fbChange>=0?'▲':'▼'} ${Math.abs(fbChange)} · aktuálně ${fmt(fbSeries[fbSeries.length-1]?.foll)}&ensp;|&ensp;
          <span style="color:${C_IG};font-weight:700">Instagram</span> ${igChange>=0?'▲':'▼'} ${Math.abs(igChange)} · aktuálně ${fmt(igSeries[igSeries.length-1]?.foll)}
        </div>
      </div>
      <div class="chart-wrap chart-wrap--tall"><canvas id="socFollowers"></canvas></div>
    </div>

    <!-- 4. LinkedIn JRD — statistiky + TOP 3 příspěvky -->
    ${li.top_posts?.length ? `
    <div class="card section-gap">
      <div class="card__head">
        <div class="card__title" style="color:${C_LI}">LinkedIn JRD — firemní stránka</div>
        <div class="card__hint">${sm.period} · ${li.posts ?? 31} příspěvků</div>
      </div>
      ${li.stats ? `<div class="soc-platform-stats" style="margin-bottom:20px">
        <div class="soc-pstat">
          <span class="soc-pstat__val" style="color:${C_LI}">${fmt(li.stats.impressions_total)}</span>
          <span class="soc-pstat__lbl">Zobrazení celkem</span>
        </div>
        <div class="soc-pstat">
          <span class="soc-pstat__val" style="color:${C_LI}">${fmt(li.stats.impressions_avg)}</span>
          <span class="soc-pstat__lbl">Průměr / příspěvek</span>
        </div>
        <div class="soc-pstat">
          <span class="soc-pstat__val" style="color:${C_LI}">${fmt(li.stats.likes)}</span>
          <span class="soc-pstat__lbl">Likes</span>
        </div>
        <div class="soc-pstat">
          <span class="soc-pstat__val" style="color:${C_LI}">${fmt(li.stats.comments)}</span>
          <span class="soc-pstat__lbl">Komentáře</span>
        </div>
        <div class="soc-pstat">
          <span class="soc-pstat__val" style="color:${C_LI}">${fmt(li.stats.interactions)}</span>
          <span class="soc-pstat__lbl">Interakcí celkem</span>
        </div>
      </div>` : ''}
      <div class="card__head" style="margin-bottom:12px">
        <div class="card__title" style="font-size:var(--fs-sm);color:${C_LI}">TOP 3 příspěvky</div>
      </div>
      <div class="top-posts-grid" style="grid-template-columns:repeat(3,1fr)">
        ${li.top_posts.map((p,i)=>`
          <div class="top-post-card">
            <div class="top-post-rank" style="background:${C_LI}">#${i+1}</div>
            <img src="${p.file}" alt="LinkedIn příspěvek ${i+1}" class="top-post-img" loading="lazy">
            <div class="top-post-body">
              <div class="top-post-text">${p.text}</div>
              ${p.views ? `<div class="top-post-views">${fmt(p.views)} <span>zobrazení</span></div>` : ''}
            </div>
          </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- 5. Meta TOP 3 příspěvky (FB + IG) -->
    <div class="card section-gap">
      <div class="card__head">
        <div class="card__title">TOP 3 příspěvky — Facebook &amp; Instagram</div>
        <div class="card__hint">podle zobrazení · ${sm.period}</div>
      </div>
      <div class="soc-top3">
        ${sm.top_posts.map((p,i)=>`
          <div class="soc-post-card">
            <div class="soc-post-rank">#${i+1}</div>
            <img src="${p.file}" alt="Top ${i+1}" class="soc-post-img" loading="lazy">
            <div class="soc-post-stats">
              <div class="soc-post-stat"><span class="soc-post-stat__val">${fmtK(p.views)}</span><span class="soc-post-stat__lbl">zobrazení</span></div>
              <div class="soc-post-stat"><span class="soc-post-stat__val">${fmt(p.reach)}</span><span class="soc-post-stat__lbl">dosah</span></div>
              <div class="soc-post-stat"><span class="soc-post-stat__val">${p.interactions}</span><span class="soc-post-stat__lbl">interakcí</span></div>
            </div>
          </div>`).join('')}
      </div>
    </div>

    <!-- 6. IG Feed -->
    <div class="card section-gap">
      <div class="card__head">
        <div class="card__title">Současný Instagram feed</div>
        <div class="card__hint">vizuální přehled profilu</div>
      </div>
      <div class="soc-feed-wrap">
        <img src="${sm.ig_feed}" alt="Instagram feed" class="soc-feed-img" loading="lazy">
      </div>
    </div>`;

  const labels = allDates.map(d => { const [y,m,day]=d.split('-'); return `${+day}.${+m}.${y.slice(2)}`; });

  mkChart('socFollowers', {
    type:'line',
    data:{
      labels,
      datasets:[
        {
          label:'Facebook',
          data: fbData,
          yAxisID: 'yFB',
          borderColor: C_FB,
          backgroundColor: `rgba(${C_FB_rgb},0.12)`,
          fill: true, tension: 0.35,
          borderWidth: 3,
          pointRadius: fbRadii,
          pointBackgroundColor: C_FB,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          spanGaps: true,
          datalabels: {
            display: ctx => ctx.dataIndex === 0 || ctx.dataIndex === lastIdx,
            anchor: ctx => ctx.dataIndex === 0 ? 'start' : 'end',
            align: ctx => ctx.dataIndex === 0 ? 'right' : 'left',
            formatter: v => fmt(v),
            font: { family:"'Montserrat'", weight:'700', size:12 },
            color: C_FB,
            backgroundColor: 'rgba(255,255,255,0.85)',
            borderRadius: 4,
            padding: { top:3, bottom:3, left:6, right:6 }
          }
        },
        {
          label:'Instagram',
          data: igData,
          yAxisID: 'yIG',
          borderColor: C_IG,
          backgroundColor: `rgba(${C_IG_rgb},0.12)`,
          fill: true, tension: 0.35,
          borderWidth: 3,
          pointRadius: igRadii,
          pointBackgroundColor: C_IG,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          spanGaps: true,
          datalabels: {
            display: ctx => ctx.dataIndex === 0 || ctx.dataIndex === lastIdx,
            anchor: ctx => ctx.dataIndex === 0 ? 'start' : 'end',
            align: ctx => ctx.dataIndex === 0 ? 'right' : 'left',
            formatter: v => fmt(v),
            font: { family:"'Montserrat'", weight:'700', size:12 },
            color: C_IG,
            backgroundColor: 'rgba(255,255,255,0.85)',
            borderRadius: 4,
            padding: { top:3, bottom:3, left:6, right:6 }
          }
        }
      ]
    },
    options:{
      responsive: true, maintainAspectRatio: false,
      interaction: { mode:'index', intersect:false },
      plugins:{
        legend: { display:true, labels:{ font:{size:13}, padding:16 } },
        tooltip: { ...tip, callbacks:{ label: c=>`${c.dataset.label}: ${fmt(c.parsed.y)} sledujících` } },
        datalabels: {}
      },
      scales:{
        x:{
          grid:{ display:false },
          ticks:{ font:{size:10}, maxTicksLimit:14, maxRotation:0 }
        },
        yFB:{
          position:'left',
          grid:{ color:C.grid },
          border:{ display:false },
          ticks:{ font:{size:11}, callback:v=>fmtK(v) },
          title:{ display:true, text:'Facebook', color:C_FB, font:{size:11,weight:'600'} }
        },
        yIG:{
          position:'right',
          grid:{ drawOnChartArea:false },
          border:{ display:false },
          ticks:{ font:{size:11}, callback:v=>fmtK(v) },
          title:{ display:true, text:'Instagram', color:C_IG, font:{size:11,weight:'600'} }
        }
      }
    }
  });
}

init();
