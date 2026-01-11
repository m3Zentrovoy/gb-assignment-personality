(() => {
  const ROOT_ID = 'avatar-modal-root';
  const AVATAR_ASSET_SUFFIX = '?v=2';
  const shapes = [
    { 
        id: 'triangle',
        label: 'Triangle',
        desc: '“Sharp, quick, focused.”',
        // neutral no-color SVG
        src: 'assets/images/avatars/triangle_neutral.svg' + AVATAR_ASSET_SUFFIX
    },
    { 
        id: 'square',
        label: 'Square',
        desc: '“Solid, steady, balanced.”',
        src: 'assets/images/avatars/square_neutral.svg' + AVATAR_ASSET_SUFFIX
    },
    { 
        id: 'circle',
        label: 'Circle',
        desc: '“Smooth, calm, flowing.”',
        src: 'assets/images/avatars/circle_neutral.svg' + AVATAR_ASSET_SUFFIX
    },
    { 
        id: 'diamond',
        label: 'Diamond',
        desc: '“Precise, bright, dynamic.”',
        src: 'assets/images/avatars/diamond_neutral.svg' + AVATAR_ASSET_SUFFIX
    },
    { 
        id: 'star',
        label: 'Star',
        desc: '“Lively, bold, expressive.”',
        src: 'assets/images/avatars/star_neutral.svg' + AVATAR_ASSET_SUFFIX
    }
];

const tooltipData = {
    triangle: { title: 'Triangle', eng: 'Sharp, quick, focused.' },
    square:   { title: 'Square',   eng: 'Solid, steady, balanced.' },
    circle:   { title: 'Circle',   eng: 'Smooth, calm, flowing.' },
    diamond:  { title: 'Diamond',  eng: 'Precise, bright, dynamic.' },
    star:     { title: 'Star',     eng: 'Lively, bold, expressive.' },
};
  const colors = [
    { id: 'yellow', hex: '#F6D74A', label: 'Yellow' },       // Extraversion, Cheerfulness
    { id: 'blue',   hex: '#296fbfff', label: 'Blue' },         // Conscientiousness
    { id: 'purple', hex: '#C293FF', label: 'Purple' },       // Openness
    { id: 'cyan',   hex: '#31bd46', label: 'Cyan' },         // Agreeableness
    { id: 'beige',  hex: '#F4D9AA', label: 'Beige' },        // Low Extraversion / High Anxiety
  ];

  let modalEl = null;
  let gridEl = null;
  let overlayEl = null;
  let colorGrid = null;
  let colorTitleEl = null;
  let colorSubEl = null;
  let previewWrap = null;
  let previewImg = null;
  let previewPlaceholder = null;
  let startBtnEl = null;
  let colorChosen = false;
  let currentShapeSrc = null;
  const tintedCache = {};
  let step = 'shape';
  let hoverStartAt = null;
  let keyHandlerAttached = false;
  let handleEnterKey = null;

  // globals for telemetry
  window.selectedAvatar = window.selectedAvatar || {};
  window.avatarChosen = window.avatarChosen || false;
  window.AvatarShapeChosen = window.AvatarShapeChosen || null;
  window.AvatarColorChosen = window.AvatarColorChosen || null;
  window.AvatarSelectionTimeTotal = window.AvatarSelectionTimeTotal || 0;
  window.AvatarShapeClickCount = window.AvatarShapeClickCount || 0;
  window.AvatarColorClickCount = window.AvatarColorClickCount || 0;
  window.AvatarHoverTimeShape = window.AvatarHoverTimeShape || 0;
  window.AvatarHoverTimeColor = window.AvatarHoverTimeColor || 0;
  window.AvatarLastDecisionDelay = window.AvatarLastDecisionDelay || 0;
  window.avatarSelectionStartTime = window.avatarSelectionStartTime || null;
  window.avatarLastHoverEndTime = window.avatarLastHoverEndTime || null;
  window.AvatarChosen = window.AvatarChosen || '';
  window.AvatarChoiceTimeMs = window.AvatarChoiceTimeMs || 0;
  window.AvatarHoverCount = window.AvatarHoverCount || 0;
  window.AvatarClickCount = window.AvatarClickCount || 0;
  window.AvatarShapeType = window.AvatarShapeType || '';
  window.AvatarColorCategory = window.AvatarColorCategory || '';
  window.AvatarFinalHesitationMs = window.AvatarFinalHesitationMs || 0;
  window.avatarTelemetry = window.avatarTelemetry || null;

  function ensureModal() {
    if (modalEl) return modalEl;
    const root = document.getElementById(ROOT_ID) || document.body;
    overlayEl = document.createElement('div');
    overlayEl.className = 'avatar-modal hidden';

    const card = document.createElement('div');
    card.className = 'avatar-modal__card';

    const heading = document.createElement('h2');
    heading.textContent = 'Pick an avatar that best represents you.';
    heading.className = 'avatar-modal__title';
    card.appendChild(heading);

    const hint = document.createElement('p');
    hint.textContent = 'First pick a shape, then a color.';
    hint.className = 'avatar-modal__hint';
    card.appendChild(hint);

    gridEl = document.createElement('div');
    gridEl.className = 'avatar-grid';
    card.appendChild(gridEl);

    // Shape cards (neutral)
    shapes.forEach((sh) => {
      const cardEl = document.createElement('button');
      cardEl.className = 'avatar-card avatar-option';
      cardEl.setAttribute('type', 'button');
      cardEl.dataset.avatarId = sh.id;
      cardEl.dataset.step = 'shape';

      const img = document.createElement('img');
      img.src = sh.src;
      img.alt = sh.label;
      img.loading = 'lazy';
      img.style.filter = 'grayscale(100%) brightness(1.15)';
      img.style.width = '66%';
      img.style.height = 'auto';
      img.style.position = 'relative';
      img.style.zIndex = '5';
      cardEl.appendChild(img);

      const label = document.createElement('div');
      label.className = 'avatar-card__label';
      label.textContent = sh.label;
      cardEl.appendChild(label);

      const desc = document.createElement('div');
      desc.className = 'avatar-description';
      desc.textContent = sh.desc || '';
      cardEl.appendChild(desc);

      const tdata = tooltipData[sh.id];
      if (tdata){
        const tip = document.createElement('div');
        tip.className = 'avatar-tooltip';
        tip.innerHTML = `
          <div class="tooltip-title">${tdata.title}</div>
          <div class="tooltip-eng">${tdata.eng}</div>
        `;
        cardEl.appendChild(tip);
      }

      cardEl.addEventListener('mouseenter', ()=>{
        hoverStart('shape');
        window.AvatarHoverCount = (window.AvatarHoverCount||0) + 1;
      });
      cardEl.addEventListener('mouseleave', ()=>{ hoverEnd('shape'); });
      cardEl.addEventListener('click', () => handleShapeSelect(sh, cardEl));
      gridEl.appendChild(cardEl);
    });

    // Color picker section
    const colorWrap = document.createElement('div');
    colorWrap.className = 'color-picker';
    colorTitleEl = document.createElement('h3');
    colorTitleEl.textContent = 'Pick a color for your avatar';
    colorTitleEl.style.margin = '12px 0 4px';
    colorTitleEl.style.display = 'none';
    colorWrap.appendChild(colorTitleEl);
    colorSubEl = document.createElement('p');
    colorSubEl.textContent = 'Now choose how your creature will look.';
    colorSubEl.style.margin = '0 0 10px';
    colorSubEl.style.color = '#475569';
    colorSubEl.style.fontSize = '13px';
    colorSubEl.style.display = 'none';
    colorWrap.appendChild(colorSubEl);
    colorGrid = document.createElement('div');
    colorGrid.className = 'color-grid';
    colorGrid.style.display = 'none';
    colorWrap.appendChild(colorGrid);

    previewWrap = document.createElement('div');
    previewWrap.style.width = '220px';
    previewWrap.style.height = '220px';
    previewWrap.style.margin = '0 auto 12px';
    previewWrap.style.display = 'flex';
    previewWrap.style.alignItems = 'center';
    previewWrap.style.justifyContent = 'center';
    previewWrap.style.position = 'relative';
    previewWrap.style.border = 'none';
    previewWrap.style.boxShadow = 'none';
    previewWrap.style.background = 'transparent';

    previewImg = document.createElement('img');
    previewImg.style.width = '200px';
    previewImg.style.height = '200px';
    previewImg.style.objectFit = 'contain';
    previewImg.style.display = 'block';
    previewImg.style.filter = 'grayscale(100%)';
    previewImg.style.margin = '0 auto';
    previewImg.style.background = 'transparent';
    previewImg.style.visibility = 'hidden';
    previewWrap.appendChild(previewImg);

    previewPlaceholder = document.createElement('div');
    previewPlaceholder.style.position = 'absolute';
    previewPlaceholder.style.inset = '0';
    previewPlaceholder.style.display = 'flex';
    previewPlaceholder.style.alignItems = 'center';
    previewPlaceholder.style.justifyContent = 'center';
    previewPlaceholder.style.fontSize = '13px';
    previewPlaceholder.style.color = '#94a3b8';
    previewPlaceholder.style.textAlign = 'center';
    previewPlaceholder.style.padding = '0 12px';
    previewWrap.appendChild(previewPlaceholder);

    colorWrap.insertBefore(previewWrap, colorTitleEl);

    startBtnEl = document.createElement('button');
    startBtnEl.type = 'button';
    startBtnEl.textContent = 'Start';
    startBtnEl.style.display = 'none';
    startBtnEl.style.margin = '16px auto 0';
    startBtnEl.style.width = '180px';
    startBtnEl.style.padding = '12px 18px';
    startBtnEl.style.borderRadius = '14px';
    startBtnEl.style.border = 'none';
    startBtnEl.style.background = '#e2e8f0';
    startBtnEl.style.color = '#0f172a';
    startBtnEl.style.fontWeight = '800';
    startBtnEl.style.cursor = 'not-allowed';
    startBtnEl.style.boxShadow = '0 14px 30px rgba(248, 113, 113, 0.15)';
    startBtnEl.disabled = true;
    startBtnEl.addEventListener('click', ()=>{
      if (!colorChosen) return;
      const nowPerf = (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() : Date.now();
      if (window.avatarSelectionStartTime){
        window.AvatarChoiceTimeMs = nowPerf - window.avatarSelectionStartTime;
      }
      if (typeof window.computeTimeBeforeStart === 'function') {
        window.computeTimeBeforeStart();
      }
      window.startReady = true;
      hideAvatarSelect();
      if (typeof window.applyAvatarColor === 'function') window.applyAvatarColor();
      if (typeof window.initRoomA === 'function') {
        window.initRoomA();
      } else if (typeof window.startGame === 'function') {
        window.startGame();
      }
    });
    colorWrap.appendChild(startBtnEl);

    // Continue button for shape step
    shapeContinueBtn = document.createElement('button');
    shapeContinueBtn.type = 'button';
    shapeContinueBtn.textContent = 'Continue';
    shapeContinueBtn.style.display = 'block';
    shapeContinueBtn.style.margin = '12px auto 0';
    shapeContinueBtn.style.width = '180px';
    shapeContinueBtn.style.padding = '12px 18px';
    shapeContinueBtn.style.borderRadius = '14px';
    shapeContinueBtn.style.border = 'none';
    shapeContinueBtn.style.background = '#e2e8f0';
    shapeContinueBtn.style.color = '#0f172a';
    shapeContinueBtn.style.fontWeight = '800';
    shapeContinueBtn.style.cursor = 'not-allowed';
    shapeContinueBtn.style.boxShadow = '0 14px 30px rgba(248, 113, 113, 0.15)';
    shapeContinueBtn.disabled = true;
    shapeContinueBtn.addEventListener('click', ()=>{
      if (shapeContinueBtn.disabled) return;
      if (!window.selectedAvatar || !window.selectedAvatar.shapeName) return;
      step = 'color';
      showColorStep();
    });

    colors.forEach((clr) => {
      const sw = document.createElement('button');
      sw.className = 'color-swatch';
      sw.type = 'button';
      sw.dataset.colorId = clr.id;
      sw.style.background = clr.hex;
      sw.addEventListener('mouseenter', ()=>{
        hoverStart('color');
        window.AvatarHoverCount = (window.AvatarHoverCount||0) + 1;
      });
      sw.addEventListener('mouseleave', ()=>hoverEnd('color'));
      sw.addEventListener('click', () => handleColorSelect(clr, sw));
      colorGrid.appendChild(sw);
    });

    card.appendChild(colorWrap);
    card.appendChild(shapeContinueBtn);
    overlayEl.appendChild(card);
    root.appendChild(overlayEl);
    modalEl = overlayEl;
    applyHoverAnimation(shapeContinueBtn);
    applyHoverAnimation(startBtnEl);
    return modalEl;
  }

  function applyHoverAnimation(btn){
    if (!btn || btn._hoverBound) return;
    btn.addEventListener('mouseenter', ()=>{ if (!btn.disabled) btn.style.background = '#f25c5c'; });
    btn.addEventListener('mouseleave', ()=>{ if (!btn.disabled) btn.style.background = '#f87171'; });
    btn._hoverBound = true;
  }

  function showAvatarSelect() {
    ensureModal();
    modalEl.classList.remove('hidden');
    requestAnimationFrame(() => modalEl.classList.add('open'));
    document.body.classList.add('avatar-modal-open');
    step = 'shape';
    showShapeStep();
    window.AvatarHoverCount = 0;
    window.AvatarClickCount = 0;
    window.AvatarChosen = '';
    window.AvatarChoiceTimeMs = 0;
    window.AvatarFinalHesitationMs = 0;
    window.AvatarShapeType = '';
    window.AvatarColorCategory = '';
    window.avatarTelemetry = null;
    if (previewImg){
      previewImg.src = '';
      previewImg.style.visibility = 'hidden';
    }
    if (previewPlaceholder){
      previewPlaceholder.style.display = 'flex';
    }
    window.avatarSelectionStartTime = (typeof performance !== 'undefined' && typeof performance.now === 'function')
      ? performance.now()
      : Date.now();

    // Key handler for Enter on Continue/Start
    handleEnterKey = (e) => {
      if (!e || e.key !== 'Enter') return;
      if (step === 'shape' && shapeContinueBtn && !shapeContinueBtn.disabled){
        shapeContinueBtn.click();
        e.preventDefault();
        return;
      }
      if (step === 'color' && colorChosen && startBtnEl && !startBtnEl.disabled){
        startBtnEl.click();
        e.preventDefault();
      }
    };
    if (!keyHandlerAttached && typeof window !== 'undefined'){
      window.addEventListener('keydown', handleEnterKey, true);
      keyHandlerAttached = true;
      window.handleAvatarEnter = ()=>{
        if (handleEnterKey){
          const fakeEvent = { key:'Enter' };
          handleEnterKey(fakeEvent);
          return true;
        }
        return false;
      };
    }
  }

  function hideAvatarSelect() {
    if (!modalEl) return;
    modalEl.classList.remove('open');
    document.body.classList.remove('avatar-modal-open');
    setTimeout(() => modalEl && modalEl.classList.add('hidden'), 160);
    if (keyHandlerAttached && typeof window !== 'undefined' && handleEnterKey){
      window.removeEventListener('keydown', handleEnterKey, true);
      keyHandlerAttached = false;
      window.handleAvatarEnter = null;
    }
  }

  function handleShapeSelect(shape, cardEl) {
    window.AvatarClickCount = (window.AvatarClickCount||0) + 1;
    window.AvatarShapeClickCount = (window.AvatarShapeClickCount||0) + 1;
    window.selectedAvatar = window.selectedAvatar || {};
    window.selectedAvatar.shapeName = shape.id;
    window.AvatarShapeChosen = shape.id;
    const lastHoverEnd = window.avatarLastHoverEndTime;
    if (lastHoverEnd){
      const nowWall = Date.now();
      window.AvatarFinalHesitationMs = nowWall - lastHoverEnd;
    }
    const sharpShapes = { triangle: true, diamond: true, star: true };
    window.AvatarShapeType = sharpShapes[shape.id] ? 'sharp' : 'round';
    if (previewImg){
      previewImg.src = shape.src;
      currentShapeSrc = shape.src;
      previewImg.style.display = 'block';
      previewImg.style.visibility = 'visible';
      previewImg.style.filter = 'grayscale(100%)';
      previewImg.style.background = 'transparent';
      previewImg.style.padding = '10px';
      previewImg.style.borderRadius = '14px';
      previewImg.style.boxShadow = '0 12px 24px rgba(0,0,0,0.18)';
    }
    if (previewPlaceholder){
      previewPlaceholder.style.display = 'none';
    }
    cardEl.classList.add('flash');
    if (shapeContinueBtn){
      shapeContinueBtn.disabled = false;
      shapeContinueBtn.style.cursor = 'pointer';
      shapeContinueBtn.style.background = '#f87171';
      shapeContinueBtn.style.color = '#fff';
    }
  }

  function handleColorSelect(color, swatchEl) {
    window.AvatarClickCount = (window.AvatarClickCount||0) + 1;
    window.AvatarColorClickCount = (window.AvatarColorClickCount||0) + 1;
    const now = (typeof millis === 'function') ? millis() : Date.now();
    if (window.avatarLastHoverEndTime) {
      window.AvatarLastDecisionDelay = now - window.avatarLastHoverEndTime;
    }
    if (window.avatarSelectionStartTime){
      window.AvatarSelectionTimeTotal = now - window.avatarSelectionStartTime;
    }
    window.selectedAvatar = window.selectedAvatar || {};
    window.selectedAvatar.colorName = color.id;
    window.selectedAvatar.colorHex = color.hex;
    window.AvatarColorChosen = color.id;
    if (window.selectedAvatar.shapeName){
      window.AvatarChosen = `${window.selectedAvatar.shapeName}-${color.id}`;
    } else {
      window.AvatarChosen = color.id;
    }
    window.AvatarColorCategory = color.id;
    window.avatarChosen = true;
    colorChosen = true;
    // update swatch selection
    if (colorGrid){
      colorGrid.querySelectorAll('.color-swatch').forEach(el=>el.classList.remove('selected'));
    }
    swatchEl.classList.add('selected', 'flash');
    // preview tint only on avatar (transparent bg)
    if (previewImg && currentShapeSrc){
      tintPreview(currentShapeSrc, color.hex, (dataUrl)=>{
        previewImg.src = dataUrl;
        previewImg.style.visibility = 'visible';
        window.selectedAvatar.tintedUrl = dataUrl;
        window.selectedAvatar.finalSprite = dataUrl;
      });
    }
    if (previewPlaceholder){
      previewPlaceholder.style.display = 'none';
    }
    if (startBtnEl){
      startBtnEl.disabled = false;
      startBtnEl.style.cursor = 'pointer';
      startBtnEl.style.background = '#f87171';
      startBtnEl.style.color = '#fff';
    }
    if (typeof window.applyAvatarColor === 'function'){
      window.applyAvatarColor();
    }
    window.avatarTelemetry = {
      AvatarChosen: window.AvatarChosen || '',
      AvatarChoiceTimeMs: window.AvatarChoiceTimeMs || 0,
      AvatarHoverCount: window.AvatarHoverCount || 0,
      AvatarClickCount: window.AvatarClickCount || 0,
      AvatarShapeType: window.AvatarShapeType || '',
      AvatarColorCategory: window.AvatarColorCategory || '',
      AvatarFinalHesitationMs: window.AvatarFinalHesitationMs || 0
    };
    // wait for user to press Start
  }

  function tintPreview(src, hex, cb){
    const cacheKey = `${src}|${hex}`;
    if (tintedCache[cacheKey]) {
      cb && cb(tintedCache[cacheKey]);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = ()=> {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const base = document.createElement('canvas');
      base.width = w; base.height = h;
      const bctx = base.getContext('2d');
      // draw original to get data
      bctx.drawImage(img, 0, 0, w, h);
      const origData = bctx.getImageData(0,0,w,h);
      const out = bctx.createImageData(w,h);
      const orig = origData.data;
      const outd = out.data;
      // target tint color
      const rT = parseInt(hex.slice(1,3),16);
      const gT = parseInt(hex.slice(3,5),16);
      const bT = parseInt(hex.slice(5,7),16);
      for (let i=0;i<orig.length;i+=4){
        const r = orig[i], g = orig[i+1], b = orig[i+2], a = orig[i+3];
        if (a === 0) { outd[i+3]=0; continue; }
        const bright = (r+g+b)/3;
        const isEye = bright < 40;           // keep dark details (eyes)
        const isLeg = bright > 245;          // keep pure white legs/highlights
        if (isEye || isLeg){
          outd[i]=r; outd[i+1]=g; outd[i+2]=b; outd[i+3]=a;
          continue;
        }
        outd[i]=rT; outd[i+1]=gT; outd[i+2]=bT; outd[i+3]=a; // tint body + outline
      }
      bctx.putImageData(out, 0, 0);
      const url = base.toDataURL('image/png');
      tintedCache[cacheKey] = url;
      previewImg.style.filter = 'none';
      previewImg.style.background = 'transparent';
      previewImg.style.boxShadow = '0 14px 30px rgba(0,0,0,0.18)';
      previewImg.style.padding = '10px';
      previewImg.style.mixBlendMode = 'normal';
      cb && cb(url);
    };
    img.src = src;
  }

  function hoverStart(type){
    hoverEnd(type);
    hoverStartAt = Date.now();
  }
  function hoverEnd(type){
    if (hoverStartAt){
      const now = Date.now();
      const delta = now - hoverStartAt;
      if (type === 'shape'){
        window.AvatarHoverTimeShape = (window.AvatarHoverTimeShape||0) + delta;
      } else if (type === 'color'){
        window.AvatarHoverTimeColor = (window.AvatarHoverTimeColor||0) + delta;
      }
      window.avatarLastHoverEndTime = now;
      hoverStartAt = null;
    }
  }

  function showShapeStep(){
    if (gridEl) gridEl.style.display = 'grid';
    if (colorGrid) colorGrid.style.display = 'none';
    if (colorTitleEl) colorTitleEl.style.display = 'none';
    if (colorSubEl) colorSubEl.style.display = 'none';
    if (previewImg) {
      previewImg.style.display = 'block';
      previewImg.style.visibility = currentShapeSrc ? 'visible' : 'hidden';
      previewImg.style.background = 'transparent';
      previewImg.style.filter = 'grayscale(100%)';
    }
    if (previewPlaceholder && !currentShapeSrc){
      previewPlaceholder.style.display = 'flex';
    }
    if (startBtnEl){
      startBtnEl.disabled = true;
      startBtnEl.style.cursor = 'not-allowed';
      startBtnEl.style.background = '#e2e8f0';
      startBtnEl.style.color = '#0f172a';
      startBtnEl.style.display = 'none';
    }
    if (shapeContinueBtn){
      shapeContinueBtn.style.display = 'block';
      shapeContinueBtn.disabled = true;
      shapeContinueBtn.style.cursor = 'not-allowed';
      shapeContinueBtn.style.background = '#e2e8f0';
      shapeContinueBtn.style.color = '#0f172a';
    }
  }

  function showColorStep(){
    if (gridEl) gridEl.style.display = 'none';
    if (colorGrid) colorGrid.style.display = 'grid';
    if (colorTitleEl) colorTitleEl.style.display = 'block';
    if (colorSubEl) colorSubEl.style.display = 'block';
    if (previewImg) previewImg.style.display = 'block';
    if (previewPlaceholder && !currentShapeSrc){
      previewPlaceholder.style.display = 'flex';
    }
    colorChosen = false;
    if (startBtnEl){
      startBtnEl.disabled = true;
      startBtnEl.style.cursor = 'not-allowed';
      startBtnEl.style.background = '#e2e8f0';
      startBtnEl.style.color = '#0f172a';
      startBtnEl.style.display = 'block';
    }
    if (shapeContinueBtn){
      shapeContinueBtn.style.display = 'none';
    }
  }

  window.showAvatarSelect = showAvatarSelect;
})();
