(function(){
  // Immersive orbit animator using the existing canvas #pageBgCanvas
  const canvas = document.getElementById('pageBgCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let width, height;
  const nodes = [];
  const NODE_COUNT = 28;
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

  function drawStatic(){
    ctx.clearRect(0,0,width,height);
    const cx = width/2, cy = height/2;
    for(const n of nodes){
      const x = cx + Math.cos(n.angle)*n.radius;
      const y = cy + Math.sin(n.angle)*n.radius;
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
      const x = cx + Math.cos(n.angle)*n.radius;
      const y = cy + Math.sin(n.angle)*n.radius;
      // glow
      const g = ctx.createRadialGradient(x,y,n.size*0.1,x,y,n.size*6);
      g.addColorStop(0, n.color);
      g.addColorStop(1, 'rgba(10,14,20,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - n.size*6, y - n.size*6, n.size*12, n.size*12);
    }
    requestAnimationFrame(loop);
  }

  // Theme toggle
  function createToggle(){
    const btn = document.createElement('button');
    btn.className = 'immersive-toggle';
    btn.setAttribute('aria-pressed','false');
    btn.title = 'Toggle theme';
    function applyTheme(t){
      document.body.setAttribute('data-theme', t);
      btn.textContent = t === 'dark' ? 'Dark' : 'Light';
      btn.setAttribute('aria-pressed', (t==='dark').toString());
    }
    // initial
    let t = localStorage.getItem('aen_theme') || 'dark';
    applyTheme(t);
    btn.addEventListener('click', ()=>{
      t = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem('aen_theme', t);
      applyTheme(t);
    });
    document.body.appendChild(btn);
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
  // create toggle in idle
  if('requestIdleCallback' in window){ requestIdleCallback(createToggle, {timeout:800}); }
  else { setTimeout(createToggle, 1000); }
  if('requestIdleCallback' in window){ requestIdleCallback(attachTrigger, {timeout:900}); }
  else { setTimeout(attachTrigger, 1200); }
})();
