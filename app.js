/* Grand Kizara Esports: one page app with hash routes. Matches, bookings, slot counts and standings are live shared data kept in the artifact database. */
var CONFIG = { demoPayments: false, upiId: "astikchaudhary4687@oksbi", payeeName: "Grand Kizara" };
var GAMES = { ff: "Free Fire", pubg: "PUBG", coc: "Clash of Clans" };

/* Game logo images supplied by the owner. */
var LOGOS = { ff: "logos/ff.png", pubg: "logos/pubg.jpg", coc: "logos/coc.jpg" };
var ICONS = {
  ff: '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="M25 4c1 9 11 12 11 23a12 12 0 0 1-24 0c0-6 3-10 6-13 0 5 2 7 5 8-2-7-1-12 2-18z"/></svg>',
  pubg: '<svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3"><circle cx="24" cy="24" r="12"/><path d="M24 6v10M24 32v10M6 24h10M32 24h10"/><circle cx="24" cy="24" r="1.5" fill="currentColor"/></svg>',
  coc: '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="M24 5l14 5v11c0 9-6 15-14 19-8-4-14-10-14-19V10z"/></svg>'
};
var SOCIALS = [
  { key:"discord", name:"Discord", handle:"Grand Kizara server", text:"Join the server for match updates, team finding and support.", url:"https://discord.gg/7XvxR5SyhD",
    icon:'<img src="logos/discord.png" alt="">' },
  { key:"youtube", name:"YouTube", handle:"@KAIZER_682", text:"Watch match highlights, live streams and tournament results.", url:"https://www.youtube.com/@KAIZER_682",
    icon:'<img src="logos/youtube.png" alt="">' },
  { key:"instagram", name:"Instagram", handle:"@grand_kizara_4687", text:"Follow for match posters, winners and announcements.", url:"https://www.instagram.com/grand_kizara_4687?cplk=eGtiZXkzZTN2dG50",
    icon:'<img src="logos/instagram.png" alt="">' }
];
function socialLinks(cls){
  return SOCIALS.map(function(x){
    return '<a class="'+cls+'" href="'+x.url+'" target="_blank" rel="noopener noreferrer"><span class="sico">'+x.icon+'</span><span>'+x.name+'</span></a>';
  }).join("");
}
var FORMATS = { solo:["Solo",1], duo:["Duo (2)",2], squad:["Squad (4)",4], clan:["Clan war (5)",5] };

var RULES = {
  ff: [
    ["Room entry","The room ID and password arrive 15 minutes before the start. Join within 10 minutes of the room opening or your slot is released."],
    ["Accounts","Play on the account whose UID you gave at booking. No account sharing, and no swapping players after the room opens."],
    ["Scoring","Placement points plus 1 point for every kill. The highest total across all rounds wins. Ties go to the team with more kills."],
    ["Devices","Mobile only. Emulators, macros, mods and any third-party tools lead to an instant ban from all Grand Kizara matches."],
    ["Teaming","No teaming with other squads, no intentional feeding and no stream sniping. Reported teams are reviewed from screenshots and recordings."],
    ["Disconnects","Lag and disconnects are your own responsibility. Matches are not replayed for a single team."],
    ["Disputes","Send your result screenshot within 15 minutes of the match ending. Later claims are not reviewed."]
  ],
  pubg: [
    ["Room entry","The room ID and password arrive 15 minutes before the start. Late players cannot be added once the lobby is locked."],
    ["Accounts","Your in-game ID must match the one on your booking. The captain's phone number receives all room details."],
    ["Scoring","Placement points plus 1 point per kill. Total points across the listed matches decide the winner, and kills break ties."],
    ["Perspective and map","Each listing states the map and whether it is TPP or FPP. Settings are fixed by the organiser and cannot be changed in the lobby."],
    ["Fair play","No hacks, cheats, mobile emulators on mobile rooms, or teaming. Anyone caught is banned and forfeits fee and prize."],
    ["Streaming","Streaming is allowed with a 2 minute delay. Sharing room details publicly is not allowed."],
    ["Disputes","Raise a dispute with a clip or screenshot within 15 minutes of the result. The organiser's decision is final."]
  ],
  coc: [
    ["Registration","Your player tag must match your booking and your Town Hall must meet the level on the listing."],
    ["Clan wars","Every member gets 2 attacks. Teams are ranked by total stars, then by average destruction percentage."],
    ["Solo base rush","Attack the set base within the time window. The most stars in the shortest time wins."],
    ["Army and layout","Base layouts are locked once the war starts. Changing a layout after the preparation time ends disqualifies the base."],
    ["Fair play","No account sharing, no pre-agreed attacks, no private servers or modified clients."],
    ["Results","Post your war log or attack screenshots to the organiser right after the war ends. Points are published once checked."],
    ["Disputes","Raise any dispute within 30 minutes of the war ending. The organiser's decision is final."]
  ]
};

/* ---------- helpers ---------- */
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function rs(n){ return "₹" + (+n||0).toLocaleString("en-IN"); }
function when(d){ return d.toLocaleString("en-IN",{weekday:"short",day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}); }
function toast(t){ var el=$("toast"); el.textContent=t; el.hidden=false; setTimeout(function(){ el.hidden=true; },2400); }
function gameLogo(g, size){
  var img = LOGOS[g] ? '<img src="'+LOGOS[g]+'" alt="'+GAMES[g]+' logo">' : ICONS[g];
  var sz=size||40, w=LOGOS[g] ? Math.round(sz*({ff:3.8,pubg:1.1,coc:1.9})[g]) : sz;
  return '<span class="glogo'+(LOGOS[g]?' img':'')+'" style="--s:'+sz+'px;--w:'+w+'px;color:var(--'+g+')" role="img" aria-label="'+GAMES[g]+'">'+img+'</span>';
}

/* ---------- live data ---------- */
var MATCHES = [], CLAIMS = {}, STANDINGS = [], MY = [], ALLB = [];
var PROFILE = null;
var live = { ready:false, db:null, uid:null, name:"", email:"", avatar:"", isOwner:false, isEditor:false, canWrite:null, canAdmin:false, unlocked:false };
var ORGCFG = null, ORGLOADED = false, ORG_EMAIL = "astikchaudhary2007@gmail.com";
function orgUI(){ return live.canAdmin && live.unlocked; }
function find(id){ return MATCHES.filter(function(m){return m.id===id;})[0]; }
function recompute(){
  var c={}; Object.keys(CLAIMS).forEach(function(k){ var x=CLAIMS[k]; c[x.matchId]=(c[x.matchId]||0)+(x.qty|0); });
  MATCHES.forEach(function(m){ m.filled=Math.min(m.slots,c[m.id]||0); });
}
function upcoming(){ var cut=Date.now()-3*3600*1000; return MATCHES.filter(function(m){ return m.start.getTime()>cut; }); }
function changed(){ recompute(); renderNav(); if(view && view.update) view.update(); }
function oops(e){ toast("Live data error: "+((e&&e.code)||"unknown")); }

async function startLive(){
  try {
    var db = window.claude && window.claude.use ? await window.claude.use("db") : null;
    var user = window.claude && window.claude.use ? await window.claude.use("user") : null;
    live.db = db;
    if(user){
      try {
        var me = await user.me();
        live.uid = me.id || null; live.name = me.name || ""; live.email = (me.email || "").toLowerCase(); live.avatar = me.avatarUrl || "";
        live.isOwner = me.isOwner === true; live.isEditor = me.canEdit === true;
      } catch(e) {}
      /* Organiser tools show only for the account that owns this page. */
      live.canAdmin = live.isOwner;
      try { live.canWrite = await user.can("data.write"); } catch(e) {}
    }
    live.ready = true;
    if(!db){ changed(); return; }
    db.collection("matches").onSnapshot(function(s){
      MATCHES = s.docs.map(function(d){ var x=d.data()||{}; return { id:d.id, game:x.game, title:x.title||"Match", mode:x.mode||"", team:+x.team||1, map:x.map||"", start:new Date(x.start), fee:+x.fee||0, prize:+x.prize||0, slots:+x.slots||0, filled:0 }; })
        .filter(function(m){ return GAMES[m.game] && !isNaN(m.start.getTime()); })
        .sort(function(a,b){ return a.start-b.start; });
      changed();
    }, oops);
    db.collection("claims").onSnapshot(function(s){
      CLAIMS={}; s.docs.forEach(function(d){ CLAIMS[d.id]=d.data(); }); changed();
    }, oops);
    db.collection("standings").onSnapshot(function(s){
      STANDINGS = s.docs.map(function(d){ var x=d.data()||{}; return { id:d.id, team:x.team||"", game:x.game, points:+x.points||0 }; })
        .filter(function(r){ return GAMES[r.game]; }).sort(function(a,b){ return b.points-a.points; });
      changed();
    }, oops);
    if(live.uid){
      db.doc("bookings/"+live.uid).onSnapshot(function(s){
        var it = (s.exists && s.data().items) || {};
        MY = Object.keys(it).map(function(k){ return it[k]; }).sort(function(a,b){ return String(b.at).localeCompare(String(a.at)); });
        changed();
      }, oops);
    }
    if(live.uid){
      db.doc("data/users/"+live.uid+"/profile").onSnapshot(function(s){ PROFILE = s.exists ? s.data() : null; changed(); }, oops);
    }
    if(live.canAdmin){
      db.doc("config/organiser").onSnapshot(function(s){ ORGCFG = s.exists ? s.data() : null; ORGLOADED = true; changed(); }, oops);
      db.collection("bookings").onSnapshot(function(s){
        ALLB=[]; s.docs.forEach(function(d){ var it=(d.data()||{}).items||{}; Object.keys(it).forEach(function(k){ ALLB.push(it[k]); }); });
        ALLB.sort(function(a,b){ return String(b.at).localeCompare(String(a.at)); });
        changed();
      }, oops);
    }
    changed();
  } catch(e) { live.ready=true; changed(); }
}
function stateNote(){
  if(!live.ready) return "Loading live data…";
  if(!live.db) return "Live data is not available in this view. Open the page from its shared link while signed in.";
  return "";
}
function emptyMatches(){
  var n=stateNote(); if(n) return '<div class="empty">'+n+'</div>';
  return '<div class="empty">'+(orgUI() ? 'No matches are scheduled yet. <a href="#admin" data-route="admin" style="color:var(--accent)">Add your first match</a> in the organiser console.' : 'No matches are scheduled yet. Check back soon.')+'</div>';
}

/* ---------- frame ---------- */
var PAGES = [["home","Home"],["matches","Matches"],["rules","Rules and booking"],["standings","Standings"],["bookings","My bookings"]];
var route = "home", view = null;
function renderNav(){
  var page = route.split("-")[0];
  var items = PAGES.slice(); items.push(["account", live.uid ? "Account" : "Sign in"]); if(live.canAdmin) items.push(["admin", live.unlocked ? "Organiser" : "Organiser login"]);
  $("bar").className = "bar";
  $("bar").innerHTML = '<div class="bar-in"><a class="brand" href="#home" data-route="home" style="text-decoration:none"><img class="logo" src="logo.png" alt="Grand Kizara Esports logo" width="44" height="44"><b>GRAND KIZARA</b><span>ESPORTS</span></a><nav aria-label="Main">'+
    items.map(function(p){ return '<a href="#'+p[0]+'" data-route="'+p[0]+'"'+(p[0]===page?' aria-current="page"':'')+'>'+p[1]+'</a>'; }).join("")+
    '<span class="livepill'+(live.db?' on':'')+'" title="'+(live.db?'Connected to live data':'Live data not connected')+'"><i></i>'+(live.db?'Live':(live.ready?'Offline':'Connecting'))+'</span></nav>'+(orgUI()?'<div class="orgstrip"><span>Organiser mode \u00B7 only you can see and change this</span><button type="button" data-orglogout>Lock</button></div>':'')+'</div>';
}
function renderFooter(){
  $("foot").innerHTML = '<footer><img class="logo" src="logo.png" alt="" width="64" height="64"><div><b style="color:var(--fg)">Grand Kizara Esports</b> runs custom-room tournaments for Free Fire, PUBG and Clash of Clans.</div>'+
    '<div class="flinks">'+socialLinks("flink")+'</div>'+
    '<div>Free Fire, PUBG and Clash of Clans are trademarks of their respective owners. This site is an independent organiser and is not affiliated with or endorsed by them.</div></footer>';
}
function ensureUI(){
  var o=document.createElement("div"); o.className="overlay"; o.id="overlay"; o.hidden=true;
  o.innerHTML='<div class="panel" role="dialog" aria-modal="true" aria-labelledby="pTitle" id="panel"></div>';
  document.body.appendChild(o);
  var t=document.createElement("div"); t.className="toast"; t.id="toast"; t.hidden=true; document.body.appendChild(t);
  o.addEventListener("click", function(e){ if(e.target===o) closeBooking(); });
  document.addEventListener("keydown", function(e){ if(e.key==="Escape" && !o.hidden) closeBooking(); });
  document.addEventListener("click", function(e){
    if(adminClick(e)) return;
    var b=e.target.closest("[data-book]"); if(b){ openBooking(b.getAttribute("data-book")); return; }
    var a=e.target.closest("[data-route]"); if(a){ e.preventDefault(); closeBooking(); go(a.getAttribute("data-route")); }
  });
  window.addEventListener("hashchange", function(){ var h=(location.hash||"").slice(1); if(h && h!==route) go(h,true); });
}
var VIEWS = {};
function go(r, fromHash){
  var page=r.split("-")[0]; if(!VIEWS[page]){ page="home"; r="home"; }
  route=r;
  if(!fromHash){ try { location.hash = r; } catch(e) {} }
  renderNav();
  view = VIEWS[page]; view.mount(r.indexOf("-")>0 ? r.slice(r.indexOf("-")+1) : ""); if(view.update) view.update();
  try { window.scrollTo(0,0); } catch(e) {}
}

/* ---------- shared renderers ---------- */
function orgRow(m){
  var pend=ALLB.filter(function(b){ return b.matchId===m.id && b.status==="pending"; }).length;
  return '<div class="orgrow"><span>Organiser \u00B7 '+m.filled+' booked \u00B7 '+pend+' to check</span><a href="#admin" data-route="admin">Open console</a></div>';
}
function matchCard(m){
  var left=m.slots-m.filled, pct=m.slots?Math.round(m.filled/m.slots*100):0, full=left<=0;
  return '<article class="card" data-game="'+m.game+'">'+
    '<div class="tag" style="color:var(--'+m.game+')">'+gameLogo(m.game,32)+'<span>'+GAMES[m.game]+'</span></div>'+
    '<h3>'+esc(m.title)+'</h3>'+
    '<dl class="meta"><dt>Starts</dt><dd>'+when(m.start)+'</dd><dt>Format</dt><dd>'+esc(m.mode)+'</dd><dt>Map / level</dt><dd>'+esc(m.map||"-")+'</dd></dl>'+
    '<div class="slots"><div class="row"><span>'+(full?'Sold out':left+' of '+m.slots+' slots left')+'</span><span>'+pct+'%</span></div>'+
    '<div class="track"><div class="fill'+(pct>=75?' hot':'')+'" style="width:'+pct+'%"></div></div></div>'+
    (orgUI() ? orgRow(m) : '')+'<div class="card-foot"><div style="display:flex;gap:20px"><div class="price"><small>Entry</small><b>'+rs(m.fee)+'</b></div>'+
    '<div class="price prize"><small>Prize</small><b>'+rs(m.prize)+'</b></div></div>'+
    '<button class="btn primary" data-book="'+esc(m.id)+'"'+(full?' disabled':'')+'>'+(full?'Full':'Book slot')+'</button></div></article>';
}
function renderStats(el){
  if(!el) return;
  var up=upcoming(), pool=0, open=0;
  up.forEach(function(m){ pool+=m.prize; open+=m.slots-m.filled; });
  var booked=Object.keys(CLAIMS).reduce(function(a,k){ return a+(CLAIMS[k].qty|0); },0);
  el.innerHTML = '<div><b>'+up.length+'</b><span>Upcoming matches</span></div><div><b>'+rs(pool)+'</b><span>Prize pool</span></div>'+
    '<div><b>'+open+'</b><span>Open slots</span></div><div><b>'+booked+'</b><span>Slots booked</span></div>';
}
var cdTimer=null, cdMatch=null;
function setCountdown(m){
  cdMatch=m; if(cdTimer){ clearInterval(cdTimer); cdTimer=null; }
  function p(n){ return String(n).padStart(2,"0"); }
  function tick(){
    var s=cdMatch?Math.max(0,Math.floor((cdMatch.start-new Date())/1000)):0;
    var ids={"cd-d":Math.floor(s/86400),"cd-h":Math.floor(s%86400/3600),"cd-m":Math.floor(s%3600/60),"cd-s":s%60};
    for(var k in ids){ var el=$(k); if(el) el.textContent=p(ids[k]); }
  }
  tick(); if(m) cdTimer=setInterval(tick,1000);
}
function myList(el){
  if(!el) return;
  var n=stateNote(); if(n){ el.innerHTML='<div class="empty">'+n+'</div>'; return; }
  if(!live.uid){ el.innerHTML='<div class="empty">Sign in to see your bookings.</div>'; return; }
  if(!MY.length){ el.innerHTML='<div class="empty">No bookings yet. Book a match and it will appear here with your booking ID.</div>'; return; }
  el.innerHTML = MY.map(function(b){
    return '<div class="item"><div><div class="id">'+esc(b.id)+'</div><div>'+esc(b.title)+'</div></div><div style="text-align:right"><div>'+esc(b.whenText)+'</div><div style="color:var(--muted);font-size:13px">'+esc(b.team)+' · '+rs(b.fee)+' · '+statusLabel(b)+'</div></div></div>';
  }).join("");
}
function setTabs(sel, attr, val){
  var all=document.querySelectorAll(sel+" .tab");
  for(var i=0;i<all.length;i++) all[i].setAttribute("aria-pressed", all[i].getAttribute(attr)===val ? "true":"false");
}

/* ---------- views ---------- */
VIEWS.home = {
  mount: function(){
    $("view").innerHTML =
    '<header class="hero"><div>'+
      '<img class="logo hero-logo" src="logo.png" alt="Grand Kizara Esports logo" width="132" height="132">'+
      '<div class="eyebrow">Presented by Grand Kizara</div>'+
      '<h1>Pick a lobby. <em>Book the slot.</em> Play for the prize.</h1>'+
      '<p>Paid custom rooms for Free Fire, PUBG and Clash of Clans. Choose a match, reserve your team\'s slot, pay the entry fee and get your room details before the start.</p>'+
      '<div class="cta-row"><a class="btn primary" href="#matches" data-route="matches">See open matches</a><a class="btn" href="#rules" data-route="rules">Rules &amp; booking options</a></div></div>'+
    '<aside class="next"><div class="eyebrow">Next match starts in</div><h2 id="nextTitle"></h2><div class="sub" id="nextSub"></div>'+
      '<div class="clock"><div><b id="cd-d">00</b><small>Days</small></div><div><b id="cd-h">00</b><small>Hrs</small></div><div><b id="cd-m">00</b><small>Min</small></div><div><b id="cd-s">00</b><small>Sec</small></div></div>'+
      '<button class="btn primary" id="nextBtn" style="width:100%;margin-top:14px">Book this match</button></aside></header>'+
    '<div class="stats" id="stats"></div>'+
    '<section><div class="sec-head"><h2>Choose your game</h2></div><div class="gcards" id="gcards"></div></section>'+
    '<section><div class="sec-head"><h2>Starting soon</h2><a class="btn" href="#matches" data-route="matches">All matches</a></div><div class="grid" id="soon"></div></section>'+
    '<section><div class="sec-head"><h2>Join the community</h2></div><div class="socials">'+
      SOCIALS.map(function(x){ return '<a class="social" href="'+x.url+'" target="_blank" rel="noopener noreferrer"><span class="sico">'+x.icon+'</span><div><h3>'+x.name+'</h3><div class="handle">'+x.handle+'</div><p>'+x.text+'</p></div><span class="go">Open '+x.name+' \u2197</span></a>'; }).join("")+'</div></section>'+
    '<section><div class="sec-head"><h2>How it works</h2><a class="btn" href="#rules" data-route="rules">Full rules</a></div><ul class="rules">'+
      '<li><b>Book</b><span>Pick a match, enter your team and in-game IDs, and pay the entry fee. Your slot is held once payment goes through.</span></li>'+
      '<li><b>Room details</b><span>The room ID and password are sent to the phone number on your booking 15 minutes before the start.</span></li>'+
      '<li><b>Prizes</b><span>Prize money is paid by UPI within 24 hours of the result being confirmed.</span></li></ul></section>';
  },
  update: function(){
    renderStats($("stats"));
    var up=upcoming(), gc="";
    ["ff","pubg","coc"].forEach(function(g){
      var ms=up.filter(function(m){return m.game===g;}), pool=0, openSlots=0;
      ms.forEach(function(m){ pool+=m.prize; openSlots+=m.slots-m.filled; });
      gc+='<a class="gcard" href="#matches-'+g+'" data-route="matches-'+g+'">'+gameLogo(g,46)+'<h3>'+GAMES[g]+'</h3>'+
        '<div class="nums"><div><b>'+ms.length+'</b>matches</div><div><b>'+rs(pool)+'</b>prizes</div><div><b>'+openSlots+'</b>slots open</div></div>'+
        '<span class="go">View '+GAMES[g]+' matches →</span></a>';
    });
    $("gcards").innerHTML=gc;
    var open=up.filter(function(m){ return m.slots>m.filled; }), nx=open[0]||up[0];
    if(nx){
      $("nextTitle").textContent=nx.title; $("nextSub").textContent=GAMES[nx.game]+" · "+nx.mode+" · "+when(nx.start);
      $("nextBtn").hidden=false; $("nextBtn").onclick=function(){ openBooking(nx.id); };
    } else {
      $("nextTitle").textContent="No match scheduled"; $("nextSub").textContent=stateNote()||"New matches appear here as soon as they are added."; $("nextBtn").hidden=true;
    }
    if(!cdMatch || !nx || cdMatch.id!==nx.id) setCountdown(nx||null);
    $("soon").innerHTML = open.length ? open.slice(0,3).map(matchCard).join("") : '<div style="grid-column:1/-1">'+emptyMatches()+'</div>';
  }
};

var mfilter="all";
VIEWS.matches = {
  mount: function(arg){
    mfilter = GAMES[arg] ? arg : "all";
    $("view").innerHTML =
    '<header class="pagehead"><div class="eyebrow">Tournament schedule</div><h1>Matches</h1><p>Every open lobby across the three games. Pick a game to narrow the list, then book your slot.</p></header>'+
    '<section style="padding-top:28px"><div class="tabs" id="tabs" role="group" aria-label="Filter by game" style="margin-bottom:20px">'+
      '<button class="tab" data-f="all" aria-pressed="true">All games</button><button class="tab" data-f="ff" aria-pressed="false">Free Fire</button>'+
      '<button class="tab" data-f="pubg" aria-pressed="false">PUBG</button><button class="tab" data-f="coc" aria-pressed="false">Clash of Clans</button></div>'+
      '<div id="banner"></div><div class="grid" id="grid"></div></section>';
    $("tabs").addEventListener("click", function(e){ var t=e.target.closest(".tab"); if(!t) return; mfilter=t.getAttribute("data-f"); VIEWS.matches.update(); });
  },
  update: function(){
    var list=upcoming().filter(function(m){ return mfilter==="all" || m.game===mfilter; });
    $("grid").innerHTML = list.length ? list.map(matchCard).join("") : '<div style="grid-column:1/-1">'+emptyMatches()+'</div>';
    $("banner").innerHTML = mfilter==="all" ? "" :
      '<div class="gbanner">'+gameLogo(mfilter,44)+'<b>'+GAMES[mfilter]+'</b><span style="color:var(--muted);font-size:14px">'+list.length+' matches</span><a href="#rules-'+mfilter+'" data-route="rules-'+mfilter+'">Read the '+GAMES[mfilter]+' rules →</a></div>';
    setTabs("#tabs","data-f",mfilter);
  }
};

var rgame="ff";
VIEWS.rules = {
  mount: function(arg){
    rgame = RULES[arg] ? arg : "ff";
    $("view").innerHTML =
    '<header class="pagehead"><div class="eyebrow">Before you book</div><h1>Rules &amp; booking options</h1><p>How slots work, what each format costs and the rules every player agrees to.</p></header>'+
    '<section style="padding-top:28px"><div class="opts">'+
      '<div class="opt"><span class="eyebrow">1 player</span><h3>Solo</h3><p>One player, one slot, one entry fee. Best for sniper cups and base rush events.</p></div>'+
      '<div class="opt"><span class="eyebrow">2 players</span><h3>Duo</h3><p>You and a partner share one entry fee. Both IDs must match your booking.</p></div>'+
      '<div class="opt"><span class="eyebrow">4 or 5 players</span><h3>Squad and clan war</h3><p>One fee per team, with room for one substitute player added at booking.</p></div>'+
      '<div class="opt"><span class="eyebrow">Up to 3 slots</span><h3>Group booking</h3><p>Reserve several slots in one payment for friends or extra teams. Add their team names in the form.</p></div></div>'+
      '<p class="sample">Payment is by UPI. You pick the number of slots and add a substitute inside the booking form.</p></section>'+
    '<section><div class="sec-head"><h2>Game rules</h2><div class="tabs" id="rtabs" role="group" aria-label="Rules by game">'+
      '<button class="tab" data-r="ff" aria-pressed="true">Free Fire</button><button class="tab" data-r="pubg" aria-pressed="false">PUBG</button><button class="tab" data-r="coc" aria-pressed="false">Clash of Clans</button></div></div>'+
      '<div id="rbanner"></div><ul class="rules" id="rulesList"></ul>'+
      '<div class="more"><a class="btn primary" href="#matches" data-route="matches">Browse matches</a></div></section>'+
    '<section><div class="sec-head"><h2>Payments and refunds</h2></div><ul class="rules">'+
      '<li><b>Entry fee</b><span>One fee per slot, shown on every match card. The total updates when you book more than one slot.</span></li>'+
      '<li><b>Room details</b><span>Sent to the captain\'s mobile number 15 minutes before the start.</span></li>'+
      '<li><b>Paying</b><span>Pay by UPI using the QR code or UPI ID shown at checkout, then enter the 12-digit transaction ID. The organiser checks every payment, and bookings without a matching payment are cancelled.</span></li>'+
      '<li><b>Cancelled matches</b><span>If the organiser cancels a match, the full entry fee is refunded.</span></li>'+
      '<li><b>Your cancellation</b><span>Cancelling yourself closes the slot to others, so fees are not refunded after the room opens.</span></li>'+
      '<li><b>Prizes</b><span>Prize money is paid by UPI within 24 hours of the result being confirmed.</span></li></ul></section>';
    $("rtabs").addEventListener("click", function(e){ var t=e.target.closest(".tab"); if(!t) return; rgame=t.getAttribute("data-r"); VIEWS.rules.update(); });
  },
  update: function(){
    $("rulesList").innerHTML = RULES[rgame].map(function(r){ return '<li><b>'+r[0]+'</b><span>'+r[1]+'</span></li>'; }).join("");
    $("rbanner").innerHTML='<div class="gbanner">'+gameLogo(rgame,44)+'<b>'+GAMES[rgame]+' rules</b><a href="#matches-'+rgame+'" data-route="matches-'+rgame+'">See '+GAMES[rgame]+' matches →</a></div>';
    setTabs("#rtabs","data-r",rgame);
  }
};

VIEWS.standings = {
  mount: function(){
    $("view").innerHTML =
    '<header class="pagehead"><div class="eyebrow">Season so far</div><h1>Standings</h1><p>Top teams by points across all Grand Kizara matches.</p></header>'+
    '<section style="padding-top:28px"><div class="scroll"><table><thead><tr><th>#</th><th>Team</th><th>Game</th><th>Points</th></tr></thead><tbody id="rows"></tbody></table></div>'+
    '<div id="stEmpty"></div><div class="more"><a class="btn primary" href="#matches" data-route="matches">Book a slot and climb the table</a></div></section>';
  },
  update: function(){
    $("rows").innerHTML = STANDINGS.map(function(r,i){
      return '<tr><td>'+(i+1)+'</td><td>'+esc(r.team)+'</td><td><span style="display:inline-flex;align-items:center;gap:10px">'+gameLogo(r.game,30)+GAMES[r.game]+'</span></td><td>'+r.points+'</td></tr>';
    }).join("");
    var n=stateNote();
    $("stEmpty").innerHTML = STANDINGS.length ? "" : '<div class="empty" style="margin-top:16px">'+(n||(orgUI()?'No results yet. Add them from the organiser console after each match.':'Results will appear here after the first matches finish.'))+'</div>';
  }
};

VIEWS.bookings = {
  mount: function(){
    $("view").innerHTML =
    '<header class="pagehead"><div class="eyebrow">Your account</div><h1>My bookings</h1><p>Your confirmed slots and booking IDs. Keep your booking ID handy in case you need help with a match.</p></header>'+
    '<section style="padding-top:28px"><div class="mine" id="mine"></div><div class="more"><a class="btn primary" href="#matches" data-route="matches">Book another match</a></div></section>';
  },
  update: function(){ myList($("mine")); }
};

var accSig = "";
function pfield(k,label,ph,hint){
  return '<div class="field"><label for="pf-'+k+'">'+label+'</label><input id="pf-'+k+'" type="text" placeholder="'+ph+'" autocomplete="off">'+(hint?'<div class="hint">'+hint+'</div>':'')+'<div class="err" id="pferr-'+k+'"></div></div>';
}
VIEWS.account = {
  mount: function(){
    accSig = "";
    $("view").innerHTML =
    '<header class="pagehead"><div class="eyebrow">Sign in and sign up</div><h1>Account</h1><p>Your account is your Claude sign-in. Create your player profile once and every booking form fills itself in.</p></header>'+
    '<section style="padding-top:28px" id="accBody"></section>';
  },
  update: function(){
    var el=$("accBody"); if(!el) return;
    var sig=[live.ready,!!live.db,live.uid,live.name,live.email,orgUI(),JSON.stringify(PROFILE||null)].join("|");
    if(sig===accSig) return; accSig=sig;
    var n=stateNote();
    if(n){ el.innerHTML='<div class="empty">'+esc(n)+'</div>'; return; }
    if(!live.uid){
      el.innerHTML='<div class="empty">You are browsing as a guest. Sign in to Claude and open this page from its shared link to book slots, see your bookings and save a player profile.</div>';
      return;
    }
    var pr=PROFILE||{}, ids=pr.ids||{};
    el.innerHTML =
      '<div class="acc">'+(live.avatar?'<img class="avatar" src="'+esc(live.avatar)+'" alt="" width="64" height="64">':'')+
      '<div><div class="accname">'+esc(live.name||"Player")+'</div>'+(live.email?'<div class="accmail">'+esc(live.email)+'</div>':'')+
      '<span class="rolepill'+(orgUI()?' org':'')+'">'+(orgUI()?'Organiser':'Player')+'</span></div></div>'+
      (orgUI() ? '<div class="note" style="margin-top:20px">You are signed in as the organiser. <a href="#admin" data-route="admin" style="color:var(--accent)">Open the organiser console</a> to add matches and results and to check UPI payments.</div>' : '')+
      '<div class="sec-head" style="margin-top:36px"><h2 style="font-size:32px">Player profile</h2></div>'+
      '<form id="pf" class="formgrid" novalidate>'+
        pfield("name","Player name","Your name","")+
        pfield("phone","Mobile number","10-digit number","Used to send room details")+
        pfield("ff","Free Fire UID","8 to 12 digits","")+
        pfield("pubg","PUBG ID","8 to 12 digits","")+
        pfield("coc","Clash of Clans tag","#2PP0LQ8","")+
        '<div class="field"><div class="err" id="pf-err"></div><button class="btn primary" type="submit" style="justify-self:start">Save profile</button></div>'+
      '</form>';
    $("pf-name").value=pr.name||live.name||""; $("pf-phone").value=pr.phone||"";
    $("pf-ff").value=ids.ff||""; $("pf-pubg").value=ids.pubg||""; $("pf-coc").value=ids.coc||"";
    $("pf").onsubmit=function(e){ e.preventDefault(); saveProfile(); };
  }
};
function saveProfile(){
  var v=function(k){ return $("pf-"+k).value.trim(); }, ok=true;
  function bad(k,m){ $("pferr-"+k).textContent=m||""; if(m) ok=false; }
  bad("name", v("name").length<2 ? "Enter your name." : "");
  bad("phone", v("phone") && !/^[6-9]\d{9}$/.test(v("phone")) ? "Enter a 10-digit Indian mobile number." : "");
  bad("ff", v("ff") && !/^\d{8,12}$/.test(v("ff")) ? "Enter 8 to 12 digits." : "");
  bad("pubg", v("pubg") && !/^\d{8,12}$/.test(v("pubg")) ? "Enter 8 to 12 digits." : "");
  bad("coc", v("coc") && !/^#[0289PYLQGRJCUV]{3,12}$/i.test(v("coc")) ? "Enter a valid tag starting with #." : "");
  if(!ok) return;
  $("pf-err").textContent="";
  live.db.doc("data/users/"+live.uid+"/profile").set({ name:v("name"), phone:v("phone"), ids:{ ff:v("ff"), pubg:v("pubg"), coc:v("coc") } })
    .then(function(){ toast("Profile saved"); }, function(e){ $("pf-err").textContent="Could not save: "+((e&&e.code)||"error"); });
}

var orgSig = "", orgFails = 0, orgLockUntil = 0;
function b64(bytes){ return btoa(String.fromCharCode.apply(null, bytes)); }
async function hashPw(pw, saltB64, iter){
  var salt = Uint8Array.from(atob(saltB64), function(c){ return c.charCodeAt(0); });
  var key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  var bits = await crypto.subtle.deriveBits({ name:"PBKDF2", salt:salt, iterations:iter, hash:"SHA-256" }, key, 256);
  return b64(new Uint8Array(bits));
}
function sameText(a,b){ if(a.length!==b.length) return false; var d=0; for(var i=0;i<a.length;i++) d|=a.charCodeAt(i)^b.charCodeAt(i); return d===0; }
function lfield(k,label,type,ph){
  return '<div class="field"><label for="ol-'+k+'">'+label+'</label><input id="ol-'+k+'" type="'+type+'" placeholder="'+ph+'" autocomplete="'+(type==="password"?"current-password":"username")+'"></div>';
}
function orgLoginScreen(){
  orgSig = [ORGLOADED,!!ORGCFG].join("|");
  var el=$("view");
  if(!ORGLOADED){ el.innerHTML='<header class="pagehead"><div class="eyebrow">Organiser</div><h1>Organiser login</h1></header><section style="padding-top:28px"><div class="empty">Loading...</div></section>'; return; }
  var setup = !ORGCFG;
  el.innerHTML =
    '<header class="pagehead"><div class="eyebrow">Organiser</div><h1>'+(setup?'Set up organiser login':'Organiser login')+'</h1><p>'+
    (setup ? 'Choose the password you will use to open the organiser console. Only a salted hash of it is stored, never the password itself.' : 'Enter your organiser email and password to open the console.')+'</p></header>'+
    '<section style="padding-top:28px"><form id="ol" class="loginbox" novalidate>'+
    lfield("email","Organiser email","email","your email")+
    lfield("pw",setup?"Choose a password":"Password","password","")+
    (setup ? lfield("pw2","Confirm password","password","")+'<div class="hint" style="margin:-6px 0 12px">At least 8 characters. Do not reuse a password you have shared anywhere.</div>' : '')+
    '<div class="err" id="ol-err" style="margin-bottom:10px"></div>'+
    '<button class="btn primary" type="submit" style="justify-self:start">'+(setup?'Create organiser login':'Log in')+'</button></form></section>';
  $("ol").onsubmit = function(e){ e.preventDefault(); if(setup) orgSetup(); else orgLogin(); };
}
function orgErr(m){ var e=$("ol-err"); if(e) e.textContent=m||""; }
async function orgSetup(){
  var email=$("ol-email").value.trim().toLowerCase(), pw=$("ol-pw").value, pw2=$("ol-pw2").value;
  if(email!==ORG_EMAIL){ orgErr("This organiser login is reserved for the organiser's own email."); return; }
  if(pw.length<8){ orgErr("Use at least 8 characters."); return; }
  if(pw!==pw2){ orgErr("The two passwords do not match."); return; }
  if(!(window.crypto && crypto.subtle)){ orgErr("This browser cannot create a secure login. Try another browser."); return; }
  orgErr("Creating...");
  try {
    var salt = new Uint8Array(16); crypto.getRandomValues(salt); var saltB = b64(salt), iter = 150000;
    var hash = await hashPw(pw, saltB, iter);
    await live.db.doc("config/organiser").set({ email:email, salt:saltB, iter:iter, hash:hash });
    live.unlocked = true; toast("Organiser login created"); renderNav(); go("admin");
  } catch(e) { orgErr("Could not create the login ("+((e&&e.code)||"error")+")."); }
}
async function orgLogin(){
  var now=Date.now();
  if(now<orgLockUntil){ orgErr("Too many attempts. Try again in "+Math.ceil((orgLockUntil-now)/1000)+" seconds."); return; }
  var email=$("ol-email").value.trim().toLowerCase(), pw=$("ol-pw").value;
  if(!(window.crypto && crypto.subtle)){ orgErr("This browser cannot check the login. Try another browser."); return; }
  orgErr("Checking...");
  var ok=false;
  try { var h=await hashPw(pw, ORGCFG.salt, ORGCFG.iter||150000); ok = email===ORGCFG.email && sameText(h, ORGCFG.hash); } catch(e) { ok=false; }
  if(ok){ orgFails=0; live.unlocked=true; renderNav(); go("admin"); return; }
  orgFails++; if(orgFails>=5){ orgLockUntil=Date.now()+60000; orgFails=0; orgErr("Too many attempts. Try again in 60 seconds."); return; }
  orgErr("Email or password is incorrect.");
}

/* organiser console: only for the account that owns this page, after the organiser login */


VIEWS.admin = {
  mount: function(){
    if(!live.canAdmin){
      $("view").innerHTML='<header class="pagehead"><div class="eyebrow">Organiser</div><h1>Organiser console</h1><p>'+(live.ready?'This page is only for the organiser of Grand Kizara Esports.':'Loading…')+'</p></header>';
      view = { update:function(){ if(live.canAdmin && route.split("-")[0]==="admin") go("admin",true); } };
      return;
    }
    if(!live.unlocked){
      orgLoginScreen();
      view = { update:function(){ if(live.unlocked){ go("admin",true); return; } if([ORGLOADED,!!ORGCFG].join("|")!==orgSig) orgLoginScreen(); } };
      return;
    }
    view = VIEWS.admin;
    var gopt=Object.keys(GAMES).map(function(g){ return '<option value="'+g+'">'+GAMES[g]+'</option>'; }).join("");
    var fopt=Object.keys(FORMATS).map(function(k){ return '<option value="'+k+'">'+FORMATS[k][0]+'</option>'; }).join("");
    $("view").innerHTML =
    '<header class="pagehead"><div class="eyebrow">Organiser</div><h1>Organiser console</h1><p>Add matches and results, and see every booking with player details. Changes show on the site straight away.</p></header>'+
    '<section style="padding-top:28px"><div class="sec-head"><h2>Add a match</h2></div>'+
    '<form id="mf" class="formgrid" novalidate>'+
      '<div class="field"><label for="m-game">Game</label><select id="m-game">'+gopt+'</select></div>'+
      '<div class="field"><label for="m-title">Match name</label><input id="m-title" type="text" placeholder="e.g. Kizara Cup Squad Clash"></div>'+
      '<div class="field"><label for="m-format">Format</label><select id="m-format">'+fopt+'</select></div>'+
      '<div class="field"><label for="m-map">Map or level</label><input id="m-map" type="text" placeholder="e.g. Bermuda"></div>'+
      '<div class="field"><label for="m-start">Start time</label><input id="m-start" type="datetime-local"></div>'+
      '<div class="field"><label for="m-slots">Team slots</label><input id="m-slots" type="number" min="1" placeholder="e.g. 12"></div>'+
      '<div class="field"><label for="m-fee">Entry fee per slot (₹)</label><input id="m-fee" type="number" min="0" placeholder="e.g. 200"></div>'+
      '<div class="field"><label for="m-prize">Prize pool (₹)</label><input id="m-prize" type="number" min="0" placeholder="e.g. 5000"></div>'+
      '<div class="field" style="grid-column:1/-1"><div class="err" id="m-err"></div><button class="btn primary" type="submit" style="justify-self:start">Publish match</button></div>'+
    '</form></section>'+
    '<section><div class="sec-head"><h2>Scheduled matches</h2></div><div id="admMatches"></div></section>'+
    '<section><div class="sec-head"><h2>Bookings</h2><span class="eyebrow" id="admBookCount"></span></div><div class="scroll" id="admBookings"></div></section>'+
    '<section><div class="sec-head"><h2>Add a result</h2></div>'+
    '<form id="sf" class="formgrid" novalidate>'+
      '<div class="field"><label for="s-team">Team name</label><input id="s-team" type="text"></div>'+
      '<div class="field"><label for="s-game">Game</label><select id="s-game">'+gopt+'</select></div>'+
      '<div class="field"><label for="s-points">Points</label><input id="s-points" type="number" min="0"></div>'+
      '<div class="field"><div class="err" id="s-err"></div><button class="btn primary" type="submit" style="justify-self:start">Add to standings</button></div>'+
    '</form><div id="admStand" style="margin-top:20px"></div></section>';
    $("mf").onsubmit=function(e){ e.preventDefault(); addMatch(); };
    $("sf").onsubmit=function(e){ e.preventDefault(); addStanding(); };
  },
  update: function(){
    if(!$("admMatches")) return;
    $("admMatches").innerHTML = MATCHES.length ? '<div class="scroll"><table><thead><tr><th>Match</th><th>Game</th><th>Starts</th><th>Slots</th><th></th></tr></thead><tbody>'+
      MATCHES.map(function(m){ return '<tr><td>'+esc(m.title)+'</td><td>'+GAMES[m.game]+'</td><td>'+when(m.start)+'</td><td>'+m.filled+' / '+m.slots+'</td><td><button class="btn small" data-del="matches:'+esc(m.id)+'">Delete</button></td></tr>'; }).join("")+'</tbody></table></div>'
      : '<div class="empty">No matches yet. Use the form above to add one.</div>';
    $("admBookCount").textContent = ALLB.length+" bookings";
    $("admBookings").innerHTML = ALLB.length ? '<table><thead><tr><th>ID</th><th>Match</th><th>Team / player</th><th>Game ID</th><th>Phone</th><th>Slots</th><th>Amount</th><th>UTR</th><th>Status</th><th>Booked</th><th></th></tr></thead><tbody>'+
      ALLB.map(function(b){ return '<tr><td style="font-family:var(--mono);font-size:13px">'+esc(b.id)+'</td><td>'+esc(b.title)+'</td><td>'+esc(b.team)+'<div style="color:var(--muted);font-size:13px">'+esc(b.player)+(b.sub?' · sub: '+esc(b.sub):'')+(b.extra?' · also: '+esc(String(b.extra).replace(/\n+/g,", ")):'')+'</div></td><td>'+esc(b.ign)+'</td><td>'+esc(b.phone)+'</td><td>'+(b.qty||1)+'</td><td>'+rs(b.fee)+'</td><td style="font-family:var(--mono);font-size:13px">'+esc(b.utr||"")+dupFlag(b)+'</td><td>'+statusLabel(b)+'</td><td>'+esc(b.at?new Date(b.at).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}):"")+'</td><td>'+actionBtns(b)+'</td></tr>'; }).join("")+'</tbody></table>'
      : '<div class="empty">No bookings yet. They appear here the moment a player books.</div>';
    $("admStand").innerHTML = STANDINGS.length ? '<div class="scroll"><table><thead><tr><th>Team</th><th>Game</th><th>Points</th><th></th></tr></thead><tbody>'+
      STANDINGS.map(function(r){ return '<tr><td>'+esc(r.team)+'</td><td>'+GAMES[r.game]+'</td><td>'+r.points+'</td><td><button class="btn small" data-del="standings:'+esc(r.id)+'">Delete</button></td></tr>'; }).join("")+'</tbody></table></div>' : "";
  }
};
function dupFlag(b){
  if(!b.utr) return "";
  return ALLB.filter(function(x){ return x.utr===b.utr; }).length>1 ? ' <span style="color:var(--bad);font-family:var(--body)">duplicate</span>' : "";
}
function actionBtns(b){
  if(!b.uid) return "";
  var k=esc(b.uid)+":"+esc(b.id);
  if(b.status==="paid") return '<button class="btn small" data-pay="no:'+k+'">Reject</button>';
  if(b.status==="rejected") return "";
  return '<button class="btn small" data-pay="ok:'+k+'">Mark paid</button> <button class="btn small" data-pay="no:'+k+'">Reject</button>';
}
function adminClick(e){
  if(e.target.closest("[data-orglogout]")){ live.unlocked=false; renderNav(); go("home"); return true; }
  var d=e.target.closest("[data-del]");
  if(d){
    if(d.getAttribute("data-armed")!=="1"){ d.setAttribute("data-armed","1"); d.textContent="Click again to delete"; setTimeout(function(){ if(d.isConnected){ d.removeAttribute("data-armed"); d.textContent="Delete"; } },3000); return true; }
    var p=d.getAttribute("data-del").split(":"); live.db.doc(p[0]+"/"+p[1]).delete().then(function(){ toast("Deleted"); },function(){ toast("Could not delete"); });
    return true;
  }
  var q=e.target.closest("[data-pay]");
  if(q){ var x=q.getAttribute("data-pay").split(":"); setPayStatus(x[1], x[2], x[0]==="ok" ? "paid" : "rejected"); return true; }
  return false;
}
async function setPayStatus(uid, id, status){
  try {
    var ref=live.db.doc("bookings/"+uid), snap=await ref.get();
    var items=Object.assign({}, (snap.exists && snap.data().items) || {});
    if(!items[id]) return;
    items[id]=Object.assign({}, items[id], { status:status });
    await ref.set({ items:items });
    if(status==="rejected"){ try { await live.db.doc("claims/"+id).delete(); } catch(e) {} }
    toast(status==="paid" ? "Marked paid" : "Booking rejected, slots released");
  } catch(e) { toast("Could not update: "+((e&&e.code)||"error")); }
}
function newId(p){ return p+Date.now().toString(36)+Math.random().toString(36).slice(2,5); }
function addMatch(){
  var v=function(k){ return $("m-"+k).value.trim(); }, err=$("m-err");
  var slots=+v("slots"), fee=+v("fee"), prize=+v("prize"), st=new Date(v("start"));
  if(v("title").length<3){ err.textContent="Enter a match name."; return; }
  if(isNaN(st.getTime())){ err.textContent="Pick a start date and time."; return; }
  if(!(slots>=1)){ err.textContent="Enter the number of team slots."; return; }
  if(!(fee>=0) || v("fee")===""){ err.textContent="Enter the entry fee (0 for free)."; return; }
  if(!(prize>=0) || v("prize")===""){ err.textContent="Enter the prize pool."; return; }
  err.textContent="";
  var f=FORMATS[v("format")];
  live.db.collection("matches").doc(newId("m")).set({ game:v("game"), title:v("title"), mode:f[0], team:f[1], map:v("map"), start:st.toISOString(), fee:fee, prize:prize, slots:slots })
    .then(function(){ toast("Match published"); $("mf").reset(); }, function(e){ err.textContent="Could not publish: "+((e&&e.code)||"error"); });
}
function addStanding(){
  var team=$("s-team").value.trim(), pts=$("s-points").value, err=$("s-err");
  if(team.length<2){ err.textContent="Enter a team name."; return; }
  if(pts==="" || +pts<0){ err.textContent="Enter the points."; return; }
  err.textContent="";
  live.db.collection("standings").doc(newId("s")).set({ team:team, game:$("s-game").value, points:+pts })
    .then(function(){ toast("Result added"); $("sf").reset(); }, function(e){ err.textContent="Could not save: "+((e&&e.code)||"error"); });
}

/* ---------- booking flow ---------- */
var current = null, step = 1, form = {};
function openBooking(id){
  current = find(id); if(!current) return;
  step = 1; form = {};
  renderPanel(); $("overlay").hidden = false;
  document.body.style.overflow = "hidden";
}
function closeBooking(){ $("overlay").hidden = true; document.body.style.overflow = ""; }

function head(m, title){
  return '<div class="panel-head"><div><div class="tag" style="color:var(--'+m.game+')">'+gameLogo(m.game,32)+'<span>'+GAMES[m.game]+'</span></div><h2 id="pTitle">'+title+'</h2></div>'+
    '<button class="x" id="closeBtn" aria-label="Close booking">×</button></div>'+
    '<div class="steps"><span class="on"></span><span class="'+(step>=2?'on':'')+'"></span><span class="'+(step>=3?'on':'')+'"></span></div>';
}
function summary(m){
  var q=form.qty||1;
  return '<div class="sum"><div><span>Match</span><span>'+esc(m.title)+'</span></div><div><span>Starts</span><span>'+when(m.start)+'</span></div>'+
    '<div><span>Format</span><span>'+esc(m.mode)+'</span></div>'+
    '<div><span>Slots</span><span>'+q+' × '+rs(m.fee)+'</span></div>'+
    '<div class="total"><span>Total to pay</span><span>'+rs(m.fee*q)+'</span></div></div>';
}
function idLabel(g){ return g==="coc" ? "Player tag" : "In-game UID"; }
function idHint(g){ return g==="coc" ? "Starts with #, for example #2PP0LQ8" : "The numeric ID shown on your profile, 8 to 12 digits"; }
function field(k,label,type,ph,hint){
  return '<div class="field"><label for="in-'+k+'">'+label+'</label><input id="in-'+k+'" name="'+k+'" type="'+type+'" placeholder="'+ph+'" autocomplete="off">'+
    (hint?'<div class="hint">'+hint+'</div>':'')+'<div class="err" id="err-'+k+'"></div></div>';
}
function pm(v,t,s,checked){
  return '<label><input type="radio" name="pm" value="'+v+'"'+(checked?' checked':'')+'><span>'+t+'<small>'+s+'</small></span></label>';
}
function setErr(k,msg){ var e=$("err-"+k); if(e) e.textContent=msg||""; return !msg; }

function renderPanel(){
  var m=current, p=$("panel");
  if(step===1){
    var left=m.slots-m.filled, maxq=Math.min(3,left), qo="";
    for(var q=1;q<=maxq;q++) qo+='<option value="'+q+'">'+q+(q===1?' slot':' slots')+'</option>';
    var warn = stateNote() || (live.uid ? (live.canWrite===false ? "Your access level does not allow booking. Ask the organiser for Contributor access to this page." : "") : "Sign in to book a slot.");
    p.innerHTML = head(m,"Your details") + (warn?'<div class="note">'+esc(warn)+'</div>':'') + '<div id="sumWrap">'+summary(m)+'</div>' +
      '<form id="f1" novalidate>'+
      (m.team>1 ? field("team",(m.game==="coc"?"Clan name":"Team name"),"text","e.g. Kizara Wolves","") : '')+
      field("player","Captain / player name","text","Your name","")+
      field("ign",idLabel(m.game),"text",m.game==="coc"?"#2PP0LQ8":"123456789",idHint(m.game))+
      field("phone","Mobile number","tel","10-digit number","Room ID and password are sent here")+
      (m.team>1 ? field("sub","Substitute player (optional)","text","Name and in-game ID","One substitute is allowed per team") : '')+
      '<div class="field"><label for="in-qty">Number of slots</label><select id="in-qty">'+qo+'</select>'+
      '<div class="hint">Book up to 3 slots in one payment. '+left+' left in this match.</div></div>'+
      '<div class="field" id="extraBox" hidden><label for="in-extra">Names of the other teams</label>'+
      '<textarea id="in-extra" placeholder="One name per line"></textarea><div class="err" id="err-extra"></div></div>'+
      '<label class="check"><input type="checkbox" id="in-rules"><span>I have read the <a href="#rules-'+m.game+'" data-route="rules-'+m.game+'">rules</a> for '+GAMES[m.game]+' and agree to follow them.</span></label>'+
      '<div class="err" id="err-rules" style="margin-bottom:14px"></div>'+
      '<div class="actions"><button type="button" class="btn" id="cancelBtn">Cancel</button><button class="btn primary" type="submit">Continue to payment</button></div></form>';
    ["team","player","ign","phone","sub","extra"].forEach(function(k){ var el=$("in-"+k); if(el && form[k]) el.value=form[k]; });
    var pr=PROFILE||{}, pids=pr.ids||{};
    [["player",pr.name||live.name],["phone",pr.phone],["ign",pids[m.game]]].forEach(function(x){ var el=$("in-"+x[0]); if(el && !el.value && x[1]) el.value=x[1]; });
    $("in-qty").value = String(Math.min(form.qty||1, maxq));
    $("extraBox").hidden = ($("in-qty").value|0) < 2;
    $("in-qty").onchange = function(){ form.qty = this.value|0; $("extraBox").hidden = form.qty<2; $("sumWrap").innerHTML = summary(m); };
    $("f1").onsubmit = function(e){ e.preventDefault(); validate1(); };
    $("cancelBtn").onclick = closeBooking;
  } else if(step===2){
    form.bookingId = form.bookingId || ("GK-" + Math.random().toString(36).slice(2,8).toUpperCase());
    var amt = m.fee*(form.qty||1), upiLink = upiUrl(amt, form.bookingId);
    p.innerHTML = head(m,"Pay by UPI") + summary(m) +
      '<div class="paybox"><div class="eyebrow">Pay exactly '+rs(amt)+' to</div>'+
      '<div class="upiid"><span id="upiIdText">'+esc(CONFIG.upiId)+'</span><button type="button" id="copyUpi">Copy</button></div>'+
      '<div class="qrwrap"><div id="qr"></div></div>'+
      '<a class="btn primary" id="upiOpen" href="'+upiLink+'" style="text-align:center">Open my UPI app</a>'+
      '<div class="hint" style="text-align:center">If nothing opens, scan the QR code with any UPI app or copy the UPI ID. Add <b>'+form.bookingId+'</b> as the payment note.</div></div>'+
      '<div class="note">After paying, enter the 12-digit UPI transaction ID (UTR) from your payment app. Your slot is held once you submit it, and the organiser checks it against the payment received.</div>'+
      field("utr","UPI transaction ID (UTR)","text","12 digit number","Find it in your payment app under the completed payment")+
      '<div class="err" id="payErr" style="margin-bottom:10px"></div>'+
      '<div class="actions"><button class="btn" id="backBtn">Back</button><button class="btn primary" id="payBtn">I have paid, confirm booking</button></div>';
    try { new QRCode($("qr"), { text:upiLink, width:176, height:176, colorDark:"#000000", colorLight:"#ffffff", correctLevel:QRCode.CorrectLevel.M }); } catch(e) {}
    $("copyUpi").onclick = function(){
      try { navigator.clipboard.writeText(CONFIG.upiId).then(function(){ toast("UPI ID copied"); },function(){ toast("Select the UPI ID and copy it"); }); }
      catch(e){ toast("Select the UPI ID and copy it"); }
    };
    $("backBtn").onclick = function(){ step=1; renderPanel(); };
    $("payBtn").onclick = startPayment;
  } else {
    p.innerHTML = head(m,"Booking received") +
      '<div class="ok" aria-hidden="true">✓</div>'+
      '<div class="eyebrow">Booking ID</div>'+
      '<div class="bid"><span id="bidText"></span><button id="copyBtn">Copy</button></div>'+
      summary(m)+
      '<div class="note"><strong>Payment check.</strong> Your slot is held. The organiser verifies your UPI payment and marks your booking paid. Keep your booking ID.</div>'+
      '<div class="note">Room ID and password are sent to <strong id="cPhone"></strong> 15 minutes before the start. Be in the lobby on time.'+(CONFIG.demoPayments?' Payment is in demo mode, so no money was charged.':'')+'</div>'+
      '<div class="note">Join our <a href="'+SOCIALS[0].url+'" target="_blank" rel="noopener noreferrer" style="color:var(--accent)">Discord server</a> for match updates and support.</div>'+
      '<div class="actions"><a class="btn" href="#bookings" data-route="bookings" style="text-align:center">My bookings</a><button class="btn primary" id="doneBtn">Done</button></div>';
    $("bidText").textContent = form.bookingId;
    $("cPhone").textContent = form.phone;
    $("copyBtn").onclick = function(){
      try { navigator.clipboard.writeText(form.bookingId).then(function(){ toast("Booking ID copied"); },function(){ toast("Select the ID and copy it"); }); }
      catch(e){ toast("Select the ID and copy it"); }
    };
    $("doneBtn").onclick = closeBooking;
  }
  $("closeBtn").onclick = closeBooking;
  var first = p.querySelector("input:not([type=radio]):not([type=checkbox]),button.btn.primary"); if(first) first.focus();
}

function validate1(){
  var m=current, ok=true;
  var v=function(k){ var el=$("in-"+k); return el ? el.value.trim() : ""; };
  if(m.team>1) ok = setErr("team", v("team").length<2 ? "Enter a team name.":"") && ok;
  ok = setErr("player", v("player").length<2 ? "Enter your name.":"") && ok;
  var ign=v("ign"), igOk = m.game==="coc" ? /^#[0289PYLQGRJCUV]{3,12}$/i.test(ign) : /^\d{8,12}$/.test(ign);
  ok = setErr("ign", igOk ? "" : (m.game==="coc" ? "Enter a valid tag starting with #." : "Enter 8 to 12 digits.")) && ok;
  ok = setErr("phone", /^[6-9]\d{9}$/.test(v("phone")) ? "" : "Enter a 10-digit Indian mobile number.") && ok;
  var qty=$("in-qty").value|0;
  if(qty>1){
    var lines=v("extra").split("\n").filter(function(x){ return x.trim().length>1; });
    ok = setErr("extra", lines.length<qty-1 ? "Enter "+(qty-1)+" more name"+(qty>2?"s":"")+", one per line." : "") && ok;
  } else setErr("extra","");
  ok = setErr("rules", $("in-rules").checked ? "" : "Tick the box to confirm you accept the rules.") && ok;
  if(!ok) return;
  form.qty = qty;
  ["team","player","ign","phone","sub","extra"].forEach(function(k){ form[k]=v(k); });
  step=2; renderPanel();
}

function upiUrl(amount, ref){
  return "upi://pay?pa=" + CONFIG.upiId + "&pn=" + encodeURIComponent(CONFIG.payeeName) + "&am=" + Number(amount).toFixed(2) + "&cu=INR&tn=" + encodeURIComponent(ref);
}
function statusLabel(b){
  return b.status==="paid" ? "paid" : b.status==="rejected" ? "payment not found" : b.status==="pending" ? "payment being checked" : "";
}
function startPayment(){
  var u = ($("in-utr").value||"").replace(/\s+/g,"");
  if(!/^\d{12}$/.test(u)){ setErr("utr","Enter the 12-digit transaction ID from your payment app."); return; }
  setErr("utr","");
  form.utr = u;
  var btn=$("payBtn"); btn.disabled=true; btn.textContent="Saving…";
  completeBooking();
}
async function completeBooking(){
  var payErr=$("payErr"), btn=$("payBtn");
  function fail(msg){ payErr.textContent=msg; btn.disabled=false; btn.textContent="I have paid, confirm booking"; }
  var m=find(current.id), qty=form.qty||1;
  if(!m){ fail("This match is no longer available."); return; }
  if(!live.db || !live.uid){ fail(stateNote() || "Sign in to book a slot."); return; }
  if(qty>m.slots-m.filled){ fail("Only "+Math.max(0,m.slots-m.filled)+" slots are left. Go back and change the number of slots."); return; }
  var id=form.bookingId, at=new Date().toISOString();
  var rec={ id:id, uid:live.uid, matchId:m.id, title:m.title, game:m.game, whenText:when(m.start), team:(form.team||form.player)+(qty>1?' +'+(qty-1)+' more':''), player:form.player, ign:form.ign, phone:form.phone, sub:form.sub||"", extra:form.extra||"", qty:qty, fee:m.fee*qty, method:"upi", payment:"upi", utr:form.utr, status:"pending", at:at };
  var claimRef=live.db.doc("claims/"+id), claimed=false;
  try {
    await claimRef.set({ matchId:m.id, qty:qty, at:at }); claimed=true;
    var ref=live.db.doc("bookings/"+live.uid), snap=await ref.get();
    var items=Object.assign({}, (snap.exists && snap.data().items) || {}); items[id]=rec;
    await ref.set({ items:items });
  } catch(e) {
    if(claimed){ try { await claimRef.delete(); } catch(x) {} }
    fail(e && e.code==="invalid_argument" ? "Your access level does not allow booking. Ask the organiser for Contributor access." : "Could not save your booking ("+((e&&e.code)||"error")+"). Please try again.");
    return;
  }
  step=3; renderPanel();
}

/* ---------- start ---------- */
ensureUI(); renderFooter();
(function(){ var h=(location.hash||"").slice(1); go(h||"home", true); })();
startLive();
