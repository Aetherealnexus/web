(function(){
  // Immersive orbit animator using the existing canvas #pageBgCanvas
  const canvas = document.getElementById('pageBgCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let width, height;
  const nodes = [];
  const NODE_COUNT = 32;
  const colors = ['#8be8ff','#9fe4ff','#68d1ff','#5ec0ff'];
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }

  function rand(min,max){ return Math.random()*(max-min)+min; }

  function init(){
    resize();
    for(let i=0;i<NODE_COUNT;i++){
      nodes.push({
        angle: Math.random()*Math.PI*2,
        radius: rand(40, Math.min(width,height)/2 - 60),
        speed: rand(0.0006,0.0024) * (Math.random()>.5?1:-1),
        size: rand(0.6,3.6),
        color: colors[Math.floor(Math.random()*colors.length)],
        wobble: rand(0.002,0.012)
      });
    }
    if(!prefersReduced) requestAnimationFrame(loop);
    else { drawStatic(); }
  }

  let pointer = {x:0,y:0,tx:0,ty:0};

  function drawStatic(){
    ctx.clearRect(0,0,width,height);
    const cx = width/2, cy = height/2;
    for(const n of nodes){
      const parallax = 1 + ((pointer.tx-0.5)*0.08 + (pointer.ty-0.5)*0.08) * (n.size/3);
      const x = cx + Math.cos(n.angle)*n.radius * parallax;
      const y = cy + Math.sin(n.angle)*n.radius * parallax;
      ctx.beginPath();
      const g = ctx.createRadialGradient(x,y,n.size*0.1,x,y,n.size*6);
      g.addColorStop(0, n.color);
      g.addColorStop(1, 'rgba(10,14,20,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - n.size*6, y - n.size*6, n.size*12, n.size*12);
    }
  }

  function loop(t){
    ctx.clearRect(0,0,width,height);
    const cx = width/2, cy = height/2;
    for(const n of nodes){
      n.angle += n.speed * (1 + Math.sin(t * n.wobble) * 0.6);
      const parallax = 1 + ((pointer.tx-0.5)*0.08 + (pointer.ty-0.5)*0.08) * (n.size/3);
      const x = cx + Math.cos(n.angle)*n.radius * parallax;
      const y = cy + Math.sin(n.angle)*n.radius * parallax;
      // glow
      const g = ctx.createRadialGradient(x,y,n.size*0.1,x,y,n.size*6);
      g.addColorStop(0, n.color);
      g.addColorStop(1, 'rgba(10,14,20,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - n.size*6, y - n.size*6, n.size*12, n.size*12);
    }
    requestAnimationFrame(loop);
  }

  // Pointer / touch parallax smoothing
  function attachPointer(){
    const el = canvas;
    function onMove(e){
      const r = el.getBoundingClientRect();
      const x = ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width;
      const y = ((e.touches ? e.touches[0].clientY : e.clientY) - r.top) / r.height;
      pointer.tx = Math.max(0, Math.min(1, x));
      pointer.ty = Math.max(0, Math.min(1, y));
    }
    el.addEventListener('pointermove', onMove, {passive:true});
    el.addEventListener('touchmove', onMove, {passive:true});
    // gentle lerp
    (function tick(){
      pointer.x += (pointer.tx*width - pointer.x) * 0.08;
      pointer.y += (pointer.ty*height - pointer.y) * 0.08;
      requestAnimationFrame(tick);
    })();
  }

  function createControls(){
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '8px';

    const themeBtn = document.createElement('button');
    themeBtn.className = 'immersive-toggle';
    themeBtn.setAttribute('aria-label','Toggle theme (T)');

    const audioBtn = document.createElement('button');
    audioBtn.className = 'immersive-toggle';
    audioBtn.setAttribute('aria-label','Toggle ambient audio (M)');

    let theme = localStorage.getItem('aen_theme') || 'dark';
    function applyTheme(t){
      document.body.setAttribute('data-theme', t);
      themeBtn.textContent = t === 'dark' ? 'Dark' : 'Light';
      themeBtn.setAttribute('aria-pressed', (t==='dark').toString());
    }
    applyTheme(theme);
    themeBtn.addEventListener('click', ()=>{ theme = theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('aen_theme', theme); applyTheme(theme); });

    // Ambient procedural audio
    let audioOn = localStorage.getItem('aen_audio') === '1';
    let audioCtx = null, masterGain = null, osc = null, noise = null;
    function createAudio(){
      try{
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain(); masterGain.gain.value = 0.0; masterGain.connect(audioCtx.destination);
        // two layered detuned oscillators
        osc = audioCtx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 55; const osc2 = audioCtx.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = 67;
        const oscGain = audioCtx.createGain(); oscGain.gain.value = 0.02;
        osc.connect(oscGain); osc2.connect(oscGain); oscGain.connect(masterGain);
        // gentle noise via script processor fallback
        const bufferSize = 2 * audioCtx.sampleRate; const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate); const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * 0.002;
        noise = audioCtx.createBufferSource(); noise.buffer = noiseBuffer; noise.loop = true; const noiseGain = audioCtx.createGain(); noiseGain.gain.value = 0.12; noise.connect(noiseGain); noiseGain.connect(masterGain);
        osc.start(); osc2.start(); noise.start();
      }catch(e){ console.warn('Audio not available', e); }
    }
    function setAudio(on){
      audioOn = !!on;
      localStorage.setItem('aen_audio', audioOn ? '1' : '0');
      audioBtn.textContent = audioOn ? 'Audio: On' : 'Audio: Off';
      audioBtn.setAttribute('aria-pressed', audioOn.toString());
      if(audioOn){ if(!audioCtx) createAudio(); if(masterGain) masterGain.gain.setTargetAtTime(0.9, audioCtx.currentTime, 0.5); }
      else if(masterGain){ masterGain.gain.setTargetAtTime(0.0, audioCtx.currentTime, 0.3); }
    }
    setAudio(audioOn);
    audioBtn.addEventListener('click', ()=> setAudio(!audioOn));

    container.appendChild(themeBtn);
    container.appendChild(audioBtn);
    container.style.position = 'fixed'; container.style.right = '18px'; container.style.top = '18px'; container.style.zIndex = '1400';
    container.style.backdropFilter = 'blur(8px)';
    document.body.appendChild(container);

    // keyboard shortcuts
    document.addEventListener('keydown', function(e){
      if(e.key === 't' || e.key === 'T'){ theme = theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('aen_theme', theme); applyTheme(theme); }
      if(e.key === 'm' || e.key === 'M'){ setAudio(!audioOn); }
    });
  }

  // Hook living field hover to add small interaction
  function attachTrigger(){
    const trigger = document.getElementById('nexusV2Trigger');
    if(!trigger) return;
    trigger.addEventListener('mouseenter', ()=> trigger.setAttribute('data-immersive','active'));
    trigger.addEventListener('mouseleave', ()=> trigger.removeAttribute('data-immersive'));
  }

  window.addEventListener('resize', ()=>{ resize(); });
  // Defer initialization to idle to avoid LCP impact
  if('requestIdleCallback' in window){ requestIdleCallback(init, {timeout: 500}); }
  else { setTimeout(init, 600); }
  // create controls in idle
  if('requestIdleCallback' in window){ requestIdleCallback(createControls, {timeout:800}); }
  else { setTimeout(createControls, 1000); }
  if('requestIdleCallback' in window){ requestIdleCallback(attachTrigger, {timeout:900}); requestIdleCallback(attachPointer, {timeout:900}); }
  else { setTimeout(attachTrigger, 1200); setTimeout(attachPointer, 1200); }
})();
