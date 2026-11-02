import{t as e}from"./content-OgwpjxzP.js";var t=new BroadcastChannel(`hello-claude`),n=document.getElementById(`app`);n.innerHTML=`
  <header>
    <div class="p-step"><span class="p-num">–</span><span class="p-total"></span></div>
    <div class="p-act"></div>
    <div class="p-status"></div>
    <div class="p-clock"><span class="p-chrono">00:00</span><span class="p-target">/ ${e.meta.targetMinutes}:00</span><button class="p-reset" title="Remettre le chrono à zéro">↺</button></div>
  </header>
  <main>
    <section class="p-current">
      <div class="p-label">Étape en cours</div>
      <h1 class="p-title"></h1>
      <div class="p-speech"></div>
      <div class="p-notes"></div>
    </section>
    <aside class="p-next">
      <div class="p-label">Étape suivante</div>
      <div class="p-preview"><iframe title="aperçu" tabindex="-1"></iframe><div class="p-preview-end">Fin de la présentation</div></div>
      <div class="p-next-title"></div>
      <div class="p-next-speech"></div>
    </aside>
  </main>
  <footer>
    <button data-cmd="prev">← Précédent</button>
    <button data-cmd="next" class="primary">Suivant →</button>
    <span class="sep"></span>
    ${e.acts.map((e,t)=>`<button data-act="${t}">${e.number}. ${e.title}</button>`).join(``)}
    <span class="sep"></span>
    <button data-cmd="blackout">Noir (B)</button>
    <button data-cmd="mute">Son (M)</button>
    <button data-cmd="gestures">Gestes (G)</button>
  </footer>
  <div class="p-offline">En attente de la fenêtre principale… (ouvrez index.html dans le même navigateur, puis touche P)</div>`;var r=e=>n.querySelector(e),i=r(`iframe`),a=null,o=null,s=-1;function c(e,n){t.postMessage({type:`cmd`,cmd:e,arg:n})}n.querySelectorAll(`[data-cmd]`).forEach(e=>e.addEventListener(`click`,()=>c(e.dataset.cmd))),n.querySelectorAll(`[data-act]`).forEach(e=>e.addEventListener(`click`,()=>c(`act`,Number(e.dataset.act)))),r(`.p-reset`).addEventListener(`click`,()=>c(`resetChrono`)),window.addEventListener(`keydown`,e=>{let t=e.key;if(t===`ArrowRight`||t===`PageDown`||t===` `||t===`Enter`)c(`next`);else if(t===`ArrowLeft`||t===`PageUp`)c(`prev`);else if(/^[1-5]$/.test(t))c(`act`,Number(t)-1);else if(t===`b`||t===`B`||t===`.`)c(`blackout`);else if(t===`r`||t===`R`)c(`restart`);else if(t===`m`||t===`M`)c(`mute`);else return;e.preventDefault()}),t.addEventListener(`message`,e=>{let t=e.data;t.type===`state`&&(a=t,o=t.chronoStart,l())});function l(){let e=a;document.body.classList.add(`online`),r(`.p-num`).textContent=e.index+1,r(`.p-total`).textContent=` / `+e.total;let t=e.current;r(`.p-act`).textContent=`Acte ${t.actNumber} · ${t.actTitle} — étape ${t.local+1}/${t.actSteps}`,r(`.p-title`).textContent=t.title,r(`.p-speech`).textContent=t.speech||``,r(`.p-notes`).textContent=t.notes||``;let n=/silence/i.test(t.speech||``)||/silence/i.test(t.notes||``);if(r(`.p-current`).classList.toggle(`silence`,n),r(`.p-status`).innerHTML=[e.blackout?`<span class="warn">ÉCRAN NOIR</span>`:``,e.muted?`<span>son coupé</span>`:``,e.gestures?`<span>gestes actifs</span>`:``].join(``),e.next){if(r(`.p-next-title`).textContent=`${e.next.actNumber}.${e.next.local+1} · ${e.next.title}`,r(`.p-next-speech`).textContent=e.next.speech||``,r(`.p-preview`).classList.remove(`end`),s!==e.next.index){s=e.next.index;let t=`index.html?preview#${e.next.index+1}`;i.src?i.contentWindow.location.hash=`#`+(e.next.index+1):i.src=t}}else r(`.p-next-title`).textContent=`—`,r(`.p-next-speech`).textContent=``,r(`.p-preview`).classList.add(`end`)}function u(){if(o){let t=Math.max(0,Math.floor((Date.now()-o)/1e3)),n=String(Math.floor(t/60)).padStart(2,`0`),i=String(t%60).padStart(2,`0`);r(`.p-chrono`).textContent=`${n}:${i}`,r(`.p-clock`).classList.toggle(`over`,t>e.meta.targetMinutes*60)}requestAnimationFrame(u)}u(),t.postMessage({type:`hello`}),setInterval(()=>{a||t.postMessage({type:`hello`})},1e3);