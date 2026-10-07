const KEY="wcc_tournament_v1";

const defaultTeams=[
 {id:"india",name:"India",flag:"🇮🇳",players:[
  ["Rohit Sharma",48],["Virat Kohli",65],["Shubman Gill",42],["Jasprit Bumrah",18],["Hardik Pandya",31]]},
 {id:"australia",name:"Australia",flag:"🇦🇺",players:[
  ["Travis Head",57],["Steve Smith",44],["Glenn Maxwell",39],["Pat Cummins",21],["Mitchell Starc",16]]},
 {id:"south-africa",name:"South Africa",flag:"🇿🇦",players:[
  ["Quinton de Kock",51],["Aiden Markram",38],["David Miller",45],["Kagiso Rabada",19],["Marco Jansen",27]]},
 {id:"new-zealand",name:"New Zealand",flag:"🇳🇿",players:[
  ["Kane Williamson",54],["Devon Conway",41],["Daryl Mitchell",36],["Trent Boult",20],["Mitchell Santner",25]]},
 {id:"west-indies",name:"West Indies",flag:"🏝️",players:[
  ["Shai Hope",46],["Nicholas Pooran",59],["Andre Russell",35],["Alzarri Joseph",17],["Jason Holder",23]]},
 {id:"england",name:"England",flag:"🏴",players:[
  ["Jos Buttler",62],["Joe Root",50],["Harry Brook",47],["Jofra Archer",15],["Liam Livingstone",33]]}
];

function load(){
 try{
  const saved=JSON.parse(localStorage.getItem(KEY));
  if(saved) return saved;
 }catch(e){}
 return {teams:defaultTeams.map(t=>({...t,players:t.players.map((p,i)=>({id:t.id+"-"+i,name:p[0],score:p[1],photo:""}))})),
 matches:[]};
}
let state=load();

function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function total(t){return t.players.reduce((a,p)=>a+Number(p.score||0),0)}
function team(id){return state.teams.find(t=>t.id===id)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function renderDashboard(){
 const grid=document.getElementById("teamGrid");
 grid.innerHTML=state.teams.map(t=>`<div class="team-card"><div class="flag">${t.flag}</div><h3>${esc(t.name)}</h3><div class="total">${total(t)}</div><div class="muted">${t.players.length} players • Total points</div></div>`).join("");
 const live=document.getElementById("liveMatch");
 if(state.matches.length){
  const m=state.matches[0],a=team(m.a),b=team(m.b);
  live.innerHTML=`<div class="versus"><div>${a.flag} ${esc(a.name)}<br><strong>${m.sa}</strong></div><div>VS</div><div>${b.flag} ${esc(b.name)}<br><strong>${m.sb}</strong></div></div>`;
 }else{
  const a=state.teams[0],b=state.teams[1];
  live.innerHTML=`<div class="versus"><div>${a.flag} ${a.name}<br><strong>${total(a)}</strong></div><div>VS</div><div>${b.flag} ${b.name}<br><strong>${total(b)}</strong></div></div>`;
 }
}

function renderTeams(){
 document.getElementById("teamManager").innerHTML=state.teams.map(t=>`
 <div class="team-card">
  <div class="flag">${t.flag}</div><h3>${esc(t.name)}</h3>
  <div class="total">${total(t)}</div><div class="muted">Team total from player scores</div>
  <div class="players">${t.players.map(p=>`
   <div class="player">
    ${p.photo?`<img class="avatar" src="${esc(p.photo)}">`:`<div class="avatar">👤</div>`}
    <div class="player-name">${esc(p.name)}</div>
    <div class="score">${p.score}
      <button onclick="changeScore('${t.id}','${p.id}',1)">+</button>
      <button onclick="changeScore('${t.id}','${p.id}',-1)">−</button>
    </div>
   </div>`).join("")}</div>
  <div class="team-actions">
   <button class="secondary" onclick="addPlayer('${t.id}')">+ Player</button>
   <button class="secondary" onclick="editTeam('${t.id}')">Edit Team</button>
   <button class="danger" onclick="deleteTeam('${t.id}')">Delete</button>
  </div>
 </div>`).join("");
}

function renderMatches(){
 if(state.teams.length<2){document.getElementById("matchList").innerHTML="<p>Add at least two teams.</p>";return}
 if(!state.matches.length) state.matches=[{id:"m1",a:state.teams[0].id,b:state.teams[1].id,sa:0,sb:0,status:"LIVE"}];
 document.getElementById("matchList").innerHTML=state.matches.map(m=>{
  const a=team(m.a),b=team(m.b);
  return `<div class="match-card"><div class="match-row">
   <div class="match-team">${a.flag}<br>${esc(a.name)}</div>
   <div class="match-score">${m.sa} - ${m.sb}</div>
   <div class="match-team">${b.flag}<br>${esc(b.name)}</div>
  </div>
  <div class="match-controls">
   <button class="primary" onclick="matchScore('${m.id}','a',1)">+ ${esc(a.name)}</button>
   <button class="primary" onclick="matchScore('${m.id}','b',1)">+ ${esc(b.name)}</button>
   <button class="secondary" onclick="resetMatch('${m.id}')">Reset</button>
  </div></div>`;
 }).join("");
 save();
}

function renderBracket(){
 const names=state.teams.map(t=>`${t.flag} ${esc(t.name)}`);
 let q="";
 for(let i=0;i<names.length;i+=2) q+=`<div class="bracket-match"><div>${names[i]||"TBD"}</div><div>${names[i+1]||"TBD"}</div></div>`;
 document.getElementById("bracketView").innerHTML=`<div class="round"><h3>QUARTER / ROUND 1</h3>${q||"<p>No teams</p>"}</div><div class="round"><h3>SEMIFINAL</h3><div class="bracket-match"><div>TBD</div><div>TBD</div></div><div class="bracket-match"><div>TBD</div><div>TBD</div></div></div><div class="round"><h3>FINAL</h3><div class="bracket-match"><div>TBD</div><div>TBD</div></div></div>`;
}

function renderStreamer(){
 const m=state.matches[0];
 if(!m){document.getElementById("streamerView").innerHTML="<h2>Waiting for live match...</h2>";return}
 const a=team(m.a),b=team(m.b);
 document.getElementById("streamerView").innerHTML=`<div class="muted">WORLD CRICKET CHAMPIONSHIP • LIVE</div><div class="big-score">${a.flag} ${a.name} ${m.sa} &nbsp;—&nbsp; ${m.sb} ${b.name} ${b.flag}</div><div>LIVE SCOREBOARD</div>`;
}

function renderAll(){renderDashboard();renderTeams();renderMatches();renderBracket();renderStreamer();}

function changeScore(tid,pid,delta){
 const p=team(tid).players.find(x=>x.id===pid); p.score=Math.max(0,Number(p.score)+delta); save();renderAll();
}
function matchScore(mid,side,delta){const m=state.matches.find(x=>x.id===mid);m[side==="a"?"sa":"sb"]+=delta;save();renderAll()}
function resetMatch(mid){const m=state.matches.find(x=>x.id===mid);m.sa=0;m.sb=0;save();renderAll()}

function addPlayer(tid){
 const name=prompt("Player name:");
 if(!name)return;
 const score=Number(prompt("Starting score:","0"))||0;
 const photo=prompt("Photo URL (optional):","")||"";
 team(tid).players.push({id:tid+"-"+Date.now(),name,score,photo});save();renderAll();
}
function deleteTeam(id){if(confirm("Delete this team?")){state.teams=state.teams.filter(t=>t.id!==id);state.matches=[];save();renderAll()}}
function editTeam(id){const t=team(id);const n=prompt("Team name:",t.name);if(n){t.name=n;save();renderAll()}}
function openTeamModal(){document.getElementById("modal").classList.remove("hidden");document.getElementById("teamForm").dataset.id=""}
function editTeamModal(id){const t=team(id);document.getElementById("teamName").value=t.name;document.getElementById("teamFlag").value=t.flag;document.getElementById("teamForm").dataset.id=id;document.getElementById("modal").classList.remove("hidden")}
function saveTeam(e){e.preventDefault();const form=e.target,id=form.dataset.id,name=document.getElementById("teamName").value.trim(),flag=document.getElementById("teamFlag").value.trim()||"🏏";if(!name)return;if(id){const t=team(id);t.name=name;t.flag=flag}else state.teams.push({id:"team-"+Date.now(),name,flag,players:[]});save();document.getElementById("modal").classList.add("hidden");form.reset();renderAll()}
window.editTeam=editTeamModal;

document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{
 document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
 document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));document.getElementById(btn.dataset.page).classList.add("active");
}));
document.getElementById("addTeamBtn").addEventListener("click",openTeamModal);
document.getElementById("closeModal").addEventListener("click",()=>document.getElementById("modal").classList.add("hidden"));
document.getElementById("teamForm").addEventListener("submit",saveTeam);

renderAll();
