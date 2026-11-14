const PLACES = [
  {name:"Alberic",lat:39.116,lon:-0.516},
  {name:"Alzira",lat:39.151,lon:-0.436},
  {name:"Carcaixent",lat:39.122,lon:-0.449},
  {name:"Algemesí",lat:39.191,lon:-0.435},
  {name:"La Pobla Llarga",lat:39.083,lon:-0.556},
  {name:"Carlet",lat:39.226,lon:-0.522},
  {name:"Guadassuar",lat:39.187,lon:-0.478},
  {name:"L'Alcúdia",lat:39.197,lon:-0.506},
  {name:"Antella",lat:39.079,lon:-0.590},
  {name:"Sumacàrcer",lat:39.102,lon:-0.630}
];
const MODELS = [
  {id:"ecmwf_ifs",name:"ECMWF IFS",org:"Centro Europeo"},
  {id:"ncep_gfs_seamless",name:"GFS",org:"NOAA · Estados Unidos"},
  {id:"icon_seamless",name:"ICON",org:"DWD · Alemania"},
  {id:"meteofrance_arpege_europe",name:"ARPEGE",org:"Météo-France"}
];
const $ = id => document.getElementById(id);
let results = [];
let selected = PLACES[0];
let forecastDays = 7;
const fmt = (n,d=0) => Number.isFinite(n) ? n.toFixed(d) : "—";
const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : NaN;
const weatherText = code => ({0:"Despejado",1:"Mayormente despejado",2:"Parcialmente nuboso",3:"Nuboso",45:"Niebla",48:"Niebla",51:"Llovizna",53:"Llovizna",55:"Llovizna intensa",61:"Lluvia débil",63:"Lluvia",65:"Lluvia fuerte",80:"Chubascos",81:"Chubascos",82:"Chubascos fuertes",95:"Tormenta",96:"Tormenta con granizo",99:"Tormenta fuerte"})[code] || "Variable";
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400)}
function init(){
  $("placeSelect").innerHTML=PLACES.map((p,i)=>`<option value="${i}">${p.name}</option>`).join("");
  $("placeSelect").addEventListener("change",e=>{selected=PLACES[+e.target.value];load()});
  $("periodSelect").addEventListener("change",e=>{forecastDays=+e.target.value;load()});
  $("refreshBtn").addEventListener("click",load);
  if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});
  load();
}
async function fetchModel(model){
  const params=new URLSearchParams({
    latitude:selected.lat,longitude:selected.lon,timezone:"Europe/Madrid",
    forecast_days:String(forecastDays),
    current:"temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code",
    hourly:"temperature_2m,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,weather_code",
    daily:"weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
    models:model.id
  });
  const response=await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if(!response.ok) throw new Error(`${model.name}: HTTP ${response.status}`);
  return {...model,data:await response.json()};
}
async function load(){
  $("updated").textContent="Actualizando modelos meteorológicos…";
  $("modelGrid").innerHTML='<div class="loading panel">Consultando los modelos internacionales…</div>';
  try{
    const settled=await Promise.allSettled(MODELS.map(fetchModel));
    results=settled.filter(x=>x.status==="fulfilled").map(x=>x.value);
    if(!results.length) throw new Error("No se han podido obtener datos meteorológicos.");
    render();
    const errors=settled.filter(x=>x.status==="rejected").length;
    $("updated").textContent=`Actualizado: ${new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})} · ${results.length}/${MODELS.length} modelos disponibles`;
    if(errors) toast(`${errors} modelo(s) no disponibles en esta consulta`);
  }catch(err){$("updated").textContent="No se pudo actualizar. Comprueba la conexión."; $("modelGrid").innerHTML=`<div class="loading panel">${err.message}</div>`;toast(err.message)}
}
function render(){
  const currentTemps=results.map(r=>r.data.current?.temperature_2m).filter(Number.isFinite);
  const winds=results.map(r=>r.data.current?.wind_speed_10m).filter(Number.isFinite);
  const rain=results.map(r=>(r.data.hourly?.precipitation||[]).slice(0,24).reduce((a,b)=>a+(b||0),0)).filter(Number.isFinite);
  const rainChance=results.map(r=>Math.max(...(r.data.hourly?.precipitation_probability||[]).slice(0,24).filter(Number.isFinite))).filter(Number.isFinite);
  const tempSpread=currentTemps.length>1?Math.max(...currentTemps)-Math.min(...currentTemps):0;
  $("currentTemp").textContent=`${fmt(avg(currentTemps))}°`;
  $("currentDesc").textContent=weatherText(results[0].data.current?.weather_code);
  $("rain24").innerHTML=`${fmt(avg(rain),1)} <small>mm</small>`;
  $("rainChance").textContent=`Probabilidad máxima ${fmt(avg(rainChance))}%`;
  $("windNow").innerHTML=`${fmt(avg(winds))} <small>km/h</small>`;
  const agreement=tempSpread<1.5?"Alto":tempSpread<3?"Medio":"Bajo";
  $("agreement").textContent=agreement;
  $("agreementText").textContent=`Diferencia térmica: ${fmt(tempSpread,1)} °C`;
  const wet=avg(rain);
  let narrative=`Los ${results.length} modelos disponibles ofrecen una temperatura actual media de ${fmt(avg(currentTemps),1)} °C. `;
  narrative+=wet>=5?`Señalan una cantidad apreciable de lluvia en las próximas 24 horas (media ${fmt(wet,1)} mm). Conviene vigilar la evolución.`:wet>=1?`Aparece posibilidad de lluvia débil o irregular durante las próximas 24 horas.`:`No aparece una señal importante de precipitación en el promedio de las próximas 24 horas.`;
  narrative+=` El acuerdo térmico es ${agreement.toLowerCase()}; esto mide coincidencia, no una probabilidad estadística de acierto.`;
  $("aiSummary").textContent=narrative;
  $("modelCount").textContent=`${results.length}/${MODELS.length}`;
  $("modelGrid").innerHTML=results.map(r=>{
    const c=r.data.current||{}, h=r.data.hourly||{};
    const mm=(h.precipitation||[]).slice(0,24).reduce((a,b)=>a+(b||0),0);
    const prob=Math.max(0,...(h.precipitation_probability||[]).slice(0,24).filter(Number.isFinite));
    return `<article class="model-card panel"><div class="model-top"><div><div class="model-name">${r.name}</div><div class="model-org">${r.org}</div></div><div class="model-temp">${fmt(c.temperature_2m)}°</div></div><div class="model-details"><span>☔ ${fmt(mm,1)} mm</span><span>💧 ${fmt(prob)}%</span><span>↗ ${fmt(c.wind_speed_10m)} km/h</span></div><div class="model-status">● Datos recibidos</div></article>`;
  }).join("");
  renderHourly();renderDaily();
}
function renderHourly(){
  const base=results[0].data.hourly;
  const count=Math.min(24,base.time.length);
  const temps=Array.from({length:count},(_,i)=>avg(results.map(r=>r.data.hourly.temperature_2m[i]).filter(Number.isFinite)));
  const rains=Array.from({length:count},(_,i)=>avg(results.map(r=>r.data.hourly.precipitation[i]).filter(Number.isFinite)));
  const maxRain=Math.max(1,...rains.filter(Number.isFinite));
  $("hourlyChart").innerHTML=Array.from({length:count},(_,i)=>{
    const time=base.time[i].slice(11,16);
    const bar=Math.max(0,Math.min(100,(rains[i]||0)/maxRain*100));
    return `<div class="hour"><span>${time}</span><strong>${fmt(temps[i])}°</strong><div class="rainbar"><i style="height:${bar}%"></i></div><span>${fmt(rains[i],1)} mm</span></div>`;
  }).join("");
}
function renderDaily(){
  const days=results[0].data.daily;
  const rows=days.time.map((date,i)=>{
    const max=avg(results.map(r=>r.data.daily.temperature_2m_max[i]).filter(Number.isFinite));
    const min=avg(results.map(r=>r.data.daily.temperature_2m_min[i]).filter(Number.isFinite));
    const mm=avg(results.map(r=>r.data.daily.precipitation_sum[i]).filter(Number.isFinite));
    const prob=avg(results.map(r=>r.data.daily.precipitation_probability_max[i]).filter(Number.isFinite));
    const codes=results.map(r=>r.data.daily.weather_code[i]).filter(Number.isFinite);
    const code=codes.length?codes[Math.floor(codes.length/2)]:-1;
    const day=new Date(date+"T12:00:00").toLocaleDateString("es-ES",{weekday:"short",day:"numeric",month:"short"});
    return `<div class="day"><div><div class="day-name">${day}</div><div class="day-desc">${weatherText(code)}</div></div><div>${weatherText(code)}</div><div class="day-temp">${fmt(max)}° / ${fmt(min)}°</div><div class="day-rain">${fmt(mm,1)} mm<br>${fmt(prob)}%</div></div>`;
  });
  $("dailyList").innerHTML=rows.join("");
}
document.addEventListener("DOMContentLoaded",init);
