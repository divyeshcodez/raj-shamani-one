const $ = s => document.querySelector(s);
const screens = document.querySelectorAll(".screen");
let selectedMinutes = 90, currentMode = "study", timerId = null, remaining = 5400, startedAt = null, paused = false;
const KEY = "clutchData";

const data = JSON.parse(localStorage.getItem(KEY) || '{"focus":0,"tasks":0,"days":{},"lastDay":null}');
const todayKey = new Date().toISOString().slice(0,10);

function save(){ localStorage.setItem(KEY, JSON.stringify(data)); updateStats(); }
function show(id){ screens.forEach(s=>s.classList.remove("active")); $("#"+id).classList.add("active"); window.scrollTo(0,0); }
function updateStats(){
  $("#focusToday").textContent = Math.round((data.days[todayKey]?.focus || 0)/60) + "m";
  $("#tasksToday").textContent = data.days[todayKey]?.tasks || 0;
  let streak = 0, d = new Date();
  while(data.days[d.toISOString().slice(0,10)]?.tasks || data.days[d.toISOString().slice(0,10)]?.focus){
    streak++; d.setDate(d.getDate()-1);
  }
  $("#streak").textContent = streak;
}
function greeting(){
  const h=new Date().getHours();
  $("#greeting").textContent = h<12?"GOOD MORNING":h<17?"GOOD AFTERNOON":"GOOD EVENING";
  $("#date").textContent = new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});
}
function ensureDay(){ if(!data.days[todayKey]) data.days[todayKey]={focus:0,tasks:0}; }

document.querySelectorAll(".action-card").forEach(btn=>{
  btn.onclick=()=>{
    currentMode=btn.dataset.mode;
    if(currentMode==="recover"){ show("recovery"); return; }
    if(currentMode==="shutdown"){ show("shutdown"); return; }
    $("#modeLabel").textContent=currentMode.toUpperCase();
    $("#taskInput").value="";
    $("#worryInput").value="";
    show("setup"); $("#taskInput").focus();
  };
});
document.querySelectorAll(".time-options button").forEach(btn=>{
  btn.onclick=()=>{document.querySelectorAll(".time-options button").forEach(b=>b.classList.remove("selected"));btn.classList.add("selected");selectedMinutes=+btn.dataset.min;}
});
$("#backHome").onclick=()=>show("home");
$("#recoveryBack").onclick=()=>show("home");
$("#shutdownBack").onclick=()=>show("home");
$("#cancelFocus").onclick=()=>{clearInterval(timerId);show("home");};

function fmt(sec){return `${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`}
function startFocus(){
  const task=$("#taskInput").value.trim() || "Focused work";
  const worry=$("#worryInput").value.trim();
  remaining=selectedMinutes*60; startedAt=Date.now(); paused=false;
  $("#focusMode").textContent=currentMode.toUpperCase();
  $("#focusTask").textContent=task;
  $("#parkedNote").textContent=worry ? `Parked: “${worry}”` : "";
  $("#pauseBtn").textContent="PAUSE";
  $("#timer").textContent=fmt(remaining);
  show("focus");
  clearInterval(timerId);
  timerId=setInterval(tick,1000);
}
function tick(){
  if(paused)return;
  remaining--;
  $("#timer").textContent=fmt(remaining);
  if(remaining<=0) finishFocus(true);
}
function finishFocus(auto=false){
  clearInterval(timerId);
  ensureDay();
  const elapsed = selectedMinutes*60 - remaining;
  data.days[todayKey].focus += Math.max(0,elapsed);
  if(auto) data.days[todayKey].tasks += 1;
  save();
  $("#completeTitle").textContent=auto?"Clutch complete.":"Work banked.";
  $("#completeMeta").textContent=`${Math.round(Math.max(0,elapsed)/60)} minutes focused • ${currentMode}`;
  show("complete");
}
$("#startBtn").onclick=startFocus;
$("#pauseBtn").onclick=()=>{
  paused=!paused;
  $("#pauseBtn").textContent=paused?"RESUME":"PAUSE";
};
$("#finishBtn").onclick=()=>finishFocus(false);
$("#homeBtn").onclick=()=>show("home");

let recoveryLeft=600,recoveryId=null;
$("#recoveryStart").onclick=()=>{
  if(recoveryId)return;
  recoveryLeft=600; $("#recoveryStart").textContent="RECOVERY IN PROGRESS";
  recoveryId=setInterval(()=>{
    recoveryLeft--; $("#recoveryTimer").textContent=fmt(recoveryLeft);
    if(recoveryLeft<=0){clearInterval(recoveryId);recoveryId=null;$("#recoveryStart").textContent="RECOVERY COMPLETE";$("#recoveryStart").disabled=true;}
  },1000);
};

$("#saveShutdown").onclick=()=>{
  ensureDay();
  localStorage.setItem("clutchTomorrow",$("#tomorrowInput").value.trim());
  data.days[todayKey].shutdown=true; save();
  $("#completeTitle").textContent="Day closed.";
  $("#completeMeta").textContent="Tomorrow has a first move. You can stop thinking about today.";
  show("complete");
};

greeting(); updateStats();
