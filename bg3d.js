/* 3D backdrop for Grand Kizara Esports: a gold crown inside orbiting rings, floating blades and sparks, with the logo glowing in the depth behind. */
(function(){
  var cv = document.getElementById("bg3d");
  if(!cv || !window.THREE){ if(cv) cv.style.display="none"; return; }
  var T = window.THREE;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var renderer;
  try { renderer = new T.WebGLRenderer({ canvas:cv, antialias:true, alpha:true }); }
  catch(e){ cv.style.display="none"; return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 1.5));
  renderer.setClearColor(0x000000, 0);

  var scene = new T.Scene();
  var cam = new T.PerspectiveCamera(50, 1, 0.1, 100);
  cam.position.set(0, 0, 10);
  scene.add(new T.AmbientLight(0x7a6530, 0.9));
  var key = new T.DirectionalLight(0xfff0c8, 1.3); key.position.set(4, 6, 6); scene.add(key);
  var rim = new T.PointLight(0xf2b84b, 1.8, 40); rim.position.set(-5, -2, 4); scene.add(rim);

  var gold = new T.MeshPhongMaterial({ color:0xe9a82c, specular:0xfff2c0, shininess:80, flatShading:true, side:T.DoubleSide });
  var silver = new T.MeshPhongMaterial({ color:0xdde3ee, specular:0xffffff, shininess:90, flatShading:true });

  /* crown */
  var crown = new T.Group();
  var band = new T.Mesh(new T.CylinderGeometry(1.25, 1.0, 0.6, 10, 1, true), gold);
  crown.add(band);
  [-0.3, 0.3].forEach(function(y){
    var r = new T.Mesh(new T.TorusGeometry(y<0 ? 1.0 : 1.25, 0.06, 6, 40), gold);
    r.rotation.x = Math.PI/2; r.position.y = y; crown.add(r);
  });
  var N = 9;
  for(var i=0;i<N;i++){
    var a = i/N*Math.PI*2, tall = (i%2===0), h = tall ? 1.5 : 0.95;
    var spike = new T.Mesh(new T.ConeGeometry(0.2, h, 4), gold);
    spike.position.set(Math.cos(a)*1.14, 0.3+h/2, Math.sin(a)*1.14);
    spike.rotation.y = a; crown.add(spike);
    var tip = new T.Mesh(new T.OctahedronGeometry(0.11, 0), silver);
    tip.position.set(Math.cos(a)*1.14, 0.3+h+0.08, Math.sin(a)*1.14); crown.add(tip);
  }
  crown.rotation.x = 0.28;

  /* orbiting rings, echoing the circle behind the GK mark */
  var rings = new T.Group();
  var r1 = new T.Mesh(new T.TorusGeometry(3.1, 0.035, 8, 120, 4.3), gold);
  var r2 = new T.Mesh(new T.TorusGeometry(2.6, 0.025, 8, 100, 3.1), silver);
  r2.rotation.z = 2.2; rings.add(r1); rings.add(r2); rings.rotation.x = 1.15;

  var hero = new T.Group(); hero.add(crown); hero.add(rings); scene.add(hero);

  /* floating blades */
  var blades = [];
  var bg = new T.OctahedronGeometry(1, 0);
  for(var j=0;j<28;j++){
    var m = new T.Mesh(bg, j%4===0 ? silver : gold);
    var s = 0.25 + Math.random()*0.5;
    m.scale.set(0.14*s, s, 0.14*s);
    var rad = 4 + Math.random()*5.5, th = Math.random()*Math.PI*2, ph = Math.acos(2*Math.random()-1);
    m.position.set(rad*Math.sin(ph)*Math.cos(th), rad*Math.sin(ph)*Math.sin(th)*0.7, rad*Math.cos(ph)*0.6 - 1);
    m.rotation.set(Math.random()*6, Math.random()*6, Math.random()*6);
    m.userData = { sx:(Math.random()-0.5)*0.5, sy:(Math.random()-0.5)*0.5, bob:Math.random()*6, amp:0.15+Math.random()*0.3, y0:m.position.y };
    scene.add(m); blades.push(m);
  }

  /* sparks */
  var COUNT = 360, pos = new Float32Array(COUNT*3), spd = new Float32Array(COUNT);
  for(var k=0;k<COUNT;k++){ pos[k*3]=(Math.random()-0.5)*26; pos[k*3+1]=(Math.random()-0.5)*16; pos[k*3+2]=(Math.random()-0.5)*12; spd[k]=0.15+Math.random()*0.4; }
  var sg = new T.BufferGeometry(); sg.setAttribute("position", new T.BufferAttribute(pos,3));
  var sparks = new T.Points(sg, new T.PointsMaterial({ color:0xf2b84b, size:0.055, transparent:true, opacity:0.8, blending:T.AdditiveBlending, depthWrite:false }));
  scene.add(sparks);

  /* the logo, glowing in the depth (its black background disappears with additive blending) */
  var plane = null;
  try {
    new T.TextureLoader().load("logo.png", function(tex){
      plane = new T.Mesh(new T.PlaneGeometry(12, 12), new T.MeshBasicMaterial({ map:tex, transparent:true, opacity:0.2, blending:T.AdditiveBlending, depthWrite:false }));
      plane.position.set(hero.position.x, hero.position.y, -6); scene.add(plane); layout(); if(reduce) draw();
    });
  } catch(e) {}

  var mx = 0, my = 0, wide = true;
  function layout(){
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    cam.aspect = w/h; cam.updateProjectionMatrix();
    wide = w/h > 1.1;
    hero.position.set(wide ? 3.8 : 0, wide ? 0.1 : 2.6, 0);
    var sc = wide ? 1 : 0.62; hero.scale.set(sc, sc, sc);
    if(plane){ plane.position.set(hero.position.x*0.8, hero.position.y, -6); plane.scale.set(wide?1:0.8, wide?1:0.8, 1); }
  }
  window.addEventListener("resize", function(){ layout(); if(reduce) draw(); });
  window.addEventListener("pointermove", function(e){ mx = e.clientX/window.innerWidth - 0.5; my = e.clientY/window.innerHeight - 0.5; }, { passive:true });

  var t0 = performance.now(), ox = 0, oy = 0;
  function draw(){
    var t = (performance.now()-t0)/1000;
    ox += (mx - ox)*0.04; oy += (my - oy)*0.04;
    var sy = Math.min(window.scrollY||0, 4000);
    crown.rotation.y = reduce ? 0.6 : t*0.35 + ox*0.9;
    crown.position.y = Math.sin(t*0.8)*0.12;
    hero.rotation.x = oy*0.35;
    rings.rotation.z = t*0.25; rings.rotation.y = Math.sin(t*0.3)*0.3;
    cam.position.y = -sy*0.0012; cam.position.x = ox*0.6;
    cam.lookAt(0, cam.position.y*0.6, 0);
    if(plane){ plane.rotation.y = ox*0.25; plane.rotation.x = -oy*0.15; }
    blades.forEach(function(b){
      var d = b.userData;
      b.rotation.x += d.sx*0.01; b.rotation.y += d.sy*0.01;
      b.position.y = d.y0 + Math.sin(t*0.6 + d.bob)*d.amp;
    });
    var p = sg.attributes.position.array;
    for(var n=0;n<COUNT;n++){ p[n*3+1] += spd[n]*0.01; if(p[n*3+1] > 8) p[n*3+1] = -8; }
    sg.attributes.position.needsUpdate = true;
    renderer.render(scene, cam);
  }
  function loop(){ if(!document.hidden) draw(); requestAnimationFrame(loop); }
  layout();
  if(reduce) draw(); else loop();
})();
