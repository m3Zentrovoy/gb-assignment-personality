/*
  Surreal Triangle Journey — p5.js prototype
  - Controls: WASD or Arrows, Space for interact
  - Three rooms, sequential, abstract visuals
  - Logging per room to console
*/

let W = 1440, H = 810;
let player;
let state = "intro"; // intro, roomA, roomB, roomC, end
let fade = 0, fading = false;
let logs = { roomA: null, roomB: null, roomC: null };
let ambientStarted = false, ambientEnv, ambientOsc, ambientDelay;
let totalCoins = 0; // persistent coin bank
let tempCoins = 0;  // per-balloon temporary coins
let playerId = '';
let big5Id = '';
let nameInput = null, big5Input = null, startBtn = null, big5Link = null;
let cCollectBtn = null;
let greetingModal = null, greetingBtn = null;
let greetingShown = false;
let greetingVisible = false;
let roomABg = null;
let startBg = null;
let aBaseTopY = 0, aTrack3TopY = 0, aRoadY = 0, aPathWidth = 60;
function pathWidth(index){
  const base = aPathWidth;
  if (index === 0 || index === 1) return base * 0.75; // thinner for paths 1 and 2
  return base;
}
// Thunderstorm visuals
let lastThunderAt = 0;
let thunderFlash = 0; // 0..1 intensity
// Telemetry globals
let gameLoadedAt = (typeof performance!=='undefined' && performance.now)? performance.now() : Date.now();
let timeBeforeStartSec = 0;
let coinsRoomA = 0;
let coinsRoomB = 0;
let tilesSteppedOnTrail = 0; // unique trail tiles stepped in Room B
let pumpsCount = 0;
let balloonExploded = 0;
let coinsCollectedBalloon = 0;
let coinsSaved = 0;
let showTelemetry = false;
let finalTelemetrySent = false; // prevent duplicate final sends
let telemetryLastTogglePressAt = 0; // for double-T toggling
let telemetryScroll = 0;
// Simple dev helpers to toggle telemetry from console
if (typeof window !== 'undefined'){
  window.setTelemetryVisible = (v)=>{ showTelemetry = !!v; };
  window.toggleTelemetryOverlay = ()=>{ showTelemetry = !showTelemetry; };
}
// Avatar selection globals
var avatarChosen = false;
var selectedAvatar = null;
var avatarImages = {};
var avatarSprite = null;
var avatarShapeTelemetry = '';
var avatarColorTelemetry = '';
var avatarTintColor = null;
var avatarTintedUrl = null;
var startReady = false;
if (!selectedAvatar) selectedAvatar = {};
var AvatarShapeChosen = null;
var AvatarColorChosen = null;
var AvatarSelectionTimeTotal = 0;
var AvatarShapeClickCount = 0;
var AvatarColorClickCount = 0;
var AvatarHoverTimeShape = 0;
var AvatarHoverTimeColor = 0;
var AvatarLastDecisionDelay = 0;
var avatarSelectionStartTime = null;
var avatarLastHoverEndTime = null;
var colorChosen = false;
var AvatarChosen = '';
var AvatarChoiceTimeMs = 0;
var AvatarHoverCount = 0;
var AvatarClickCount = 0;
var AvatarShapeType = '';
var AvatarColorCategory = '';
var AvatarFinalHesitationMs = 0;
var avatarTelemetry = null;
const AVATAR_META = {
  'triangle-neutral': { shape: 'triangle', color: 'neutral', src: 'assets/images/avatars/triangle_neutral.svg?v=2' },
  'square-neutral': { shape: 'square', color: 'neutral', src: 'assets/images/avatars/square_neutral.svg?v=2' },
  'circle-neutral': { shape: 'circle', color: 'neutral', src: 'assets/images/avatars/circle_neutral.svg?v=2' },
  'diamond-neutral': { shape: 'diamond', color: 'neutral', src: 'assets/images/avatars/diamond_neutral.svg?v=2' },
  'star-neutral': { shape: 'star', color: 'neutral', src: 'assets/images/avatars/star_neutral.svg?v=2' }
};
// Per-room durations
let roomADurationSec = 0, roomBDurationSec = 0, roomCDurationSec = 0;
let roomAEnteredAt = 0, roomBEnteredAt = 0, roomCEnteredAt = 0;

// Room A
let aStartTime, aWallsCloseAt, aClosing = 0; // 0..1
let aChoice = null; // 'lit'|'foggy'|'upward'
let aMargin = 80; // dynamic with closing
let aStripW; // width of each path
let aPathBounds = []; // [{x1,x2,y1,y2, doorX, doorY, length}]
let aLockedPath = -1; // index of path once entered
let aFirstLockTime = null; // ms when first stepped onto a path
let aOutsideDuration = 0; // seconds until first lock
let aStem = { x1:0, x2:0, y1:0, y2:0 }; // shared root stem bounds
let aStemEntered = false;
let aCloseDuration = 60000; // half speed (2x duration) for wall approach (ms)
let aCoins = []; // coins in Room A
let aFreeWalk = true; // allow free movement in Room A
let aTrack2Stone = null, aTrack2Crack = null, aTrack2Crack2 = null; // static details on center path
let aTrack2Pit = null; // one additional pit on Track 2
let aBridge = { x1:0, x2:0, y:0, h:0 }; // bottom iron bridge/platform
let aLeftDecor = []; // decorative elements on the safe left path
// Room A behavior metrics
let aChangedDirectionCount = 0;
let aLastDir = 'none';
let aIdleTime = 0; // seconds accumulated
let aIdleSince = null; // ms timestamp when idle started
let aLastFrameMs = null;
let aHasMoved = false; // becomes true after first detected movement
// For robust direction-change detection: dominant axis and its sign
let aDomAxisLast = null; // 'x' | 'y' | null
let aAxisSignLast = 0;   // -1 | 1 | 0
let aFirstMoveAt = null; // ms when player first moved in Room A
let aInstrShownAt = 0, aShowInstr = false;
// Room A movement jitter & style metrics
let aSignificantDirectionChanges = 0;
let aInputJitterCount = 0;
let aLastMoveDir = 'none';
let aLastMoveDirChangedAt = 0;
let aLastRawDir = 'none';
let aLastRawDirChangedAt = 0;
let aDirHoldTotalMs = 0;
let aDirHoldPhases = 0;
let aAvgDirectionHoldMs = 0;
let aRoomADurationSec = 0;
let aJitterIntensity = 'smooth';
// Per-axis trend accumulators for significant direction changes
let aVertPrevSign = 0, aVertRunMs = 0;
let aHorizPrevSign = 0, aHorizRunMs = 0;
let aFogLayer = null, aFogZ = 0; // animated fog for middle path

// Helper: curved centerline for each path; Track 3 is a thin, wavy S-curve
function pathCenterX(pathIndex, innerX, innerW, t, curveAmtBase){
  const spacing = aPathWidth * 1.4;
  const baseMid = width * 0.5;
  const rightOffset = 200; // shift right/left
  const rightMirror = -1;  // -1 = mirror, 1 = normal geometry
  const baseX =
    (pathIndex === 0) ? baseMid - spacing :
    (pathIndex === 1) ? baseMid :
    baseMid + spacing + rightOffset;
  if (pathIndex === 0) return baseX;
  if (pathIndex === 1) return baseX 
  + sin(t * PI) * (aStripW * 0)
  + pow(sin(t * PI), 2) * (aStripW * 0.25);;

  // 3rd track: multiply curvature by rightMirror
  return baseX
    + rightMirror * sin(t * PI * 2.6) * (aStripW * 0.2)
    + -rightMirror * sin(t * PI * 5.2 + PI/4) * (aStripW * 0.2);
}

// Room B
let gridCols = 24, gridRows = 14, cellW, cellH; // tiles 2x smaller vs before
let bPattern = [], bPatternShownAt = 0, bPatternInterval = 3000;
let bLitMap; // boolean grid for permanently lit tiles on the path
let bLitColors = {}; // pastel shimmer colors per tile
// Room B key NPC interaction
let bExitLocked = true;
let bLockAnim = 0;
let bKeyEventTriggered = false;
let bKeyPromptShownAt = 0;
let bKeyApproachTimeMs = 0;
let bKeyDistanceStopped = 0;
let bKeyChoice = '';
let bKeyResponseTimeMs = 0;
let bKeyChoiceButtons = null;
let bNPC = { x: 0, y: 0, waving: true, hi5: false, emojiT: 0, state:'blocking', blocking:true, moveStart:0, moveEnd:0, startX:0, startY:0, targetX:0, targetY:0, pushVX:0, pushVY:0, pushT:0, mood:'neutral', moodTimer:0, shakeTimer:0, lineText:'', lineTextT:0 };
let bKeyState = 'npc'; // npc | ground | taken
let bKeyPos = { x:0, y:0 };
let bKeyDropAvailableAt = 0;
let bEnterDoor = { x: 0, y: 0 }, bExitDoor = { x: 0, y: 0 };
let bFollowed = false, bSkipped = false, bPushed = false;
let bCoins = []; // coins in Room B
let bInstrShownAt = 0, bShowInstr = false;
let bAgreePoints = 0, bEfficiencyPoints = 0;
let bChoiceShownAt = null; // timestamp when prompt first appeared
// Room B metrics for NPC interaction
let bConflictChoiceAt = 0;
let bConflictStartPos = { x:0, y:0 };
let bConflictDistanceTraveled = 0;
let bConflictWalkStartedAt = 0;
let bConflictHesitationMs = 0;
let bConflictProximityAtPickup = 0;
let bCoopChoiceAt = 0;
let bCoopDoorOpenAt = 0;
let bPlayerStayedNearNPCDuringCoop = true;
let bDistanceKeptBeforeChoice = 0;
let bPrevPlayerPosB = null;
let bKeyThrow = { active:false, start:{x:0,y:0}, end:{x:0,y:0}, startT:0, dur:600 };

// Room C
let cBalloon = { x: 0, y: 0, r: 40, max: 130, popped: false, floated: false };
let cButton = { x: 0, y: 0, r: 28 };
let cPressCount = 0, cStartTime = 0;
let cSpacePressCount = 0;
let cPopSoundPlayed = false, cFloatSoundPlayed = false;
let cLastPressAt = 0;
let cTargetPops = 5; // random 3..6 per balloon
let cExplosion = { active:false, parts:[], t:0, duration:120 };
let cLabel = { t:0, text:"", x:0, y:0 };
let cCounterPulse = 0; // visual pulse for Room C coin counter
let cBankAnim = { active:false, coins:[], startedAt:0, totalMs:2000, amount:0 }; // fly-to-HUD animation (2s)
let cInstrShownAt = 0, cShowInstr = false, cInstrEverShown = false;
let cInstrCloseBtn = null;
// Room C multi-round state (5 balloons)
const cTotalRounds = 5;
let cRoundIndex = 0;
let cRoundsTotalPumps = 0;
let cRoundsTotalExplosions = 0;
let cRoundsTotalCoinsCollected = 0;
let cRoundsTotalCoinsSaved = 0;
let cRoundLocked = false; // disable pumping after Collect until next round
let cRoundHistory = []; // per-round telemetry
let cPressTimes = []; // timestamps per round
let cCollectPressedAt = null;
let sndBalloonNearPop = null;
let sndBalloonPop = null;
let cNearPopSoundPlayed = false;
let nearPopRounds = [];
let pumpTimestampsBefore = [];
let pumpTimestampsAfter = [];
let PumpCountBeforeSound = 0;
let PumpSpeedBeforeSound = 0;
let PumpRhythmVarianceBefore = 0;
let PumpSpeedAfterSound = 0;
let PumpRhythmVarianceAfter = 0;
let ExtraPumpsAfterSound = 0;
let TimeToFirstActionAfterSound = 0;
let PumpSpeedChangeRatio = 0;
let RhythmStabilityChange = 0;
let StrategyShiftFlag = false;
let nearPopSoundTimestamp = 0;
let nearPopCoinsLostAfterSound = 0;
let nearPopCoinsSavedAfterSound = 0;
function intervalStats(tsArr){
  if (!Array.isArray(tsArr) || tsArr.length < 2) return { avg: 0, variance: 0 };
  const intervals = [];
  for (let i=1;i<tsArr.length;i++){
    const d = tsArr[i] - tsArr[i-1];
    if (d > 0) intervals.push(d);
  }
  if (!intervals.length) return { avg: 0, variance: 0 };
  const avg = intervals.reduce((s,v)=>s+v,0) / intervals.length;
  const variance = intervals.reduce((s,v)=>s + Math.pow(v-avg,2), 0) / intervals.length;
  return { avg, variance };
}

function preload(){
  avatarImages = preloadAvatarImages();
  try{
    sndBalloonNearPop = loadSound('assets/audio/almost burst.wav');
  }catch(_){}
  try{
    sndBalloonPop = loadSound('assets/audio/poop.wav');
  }catch(_){}
  try{
    roomABg = loadImage('assets/images/roomA_bg.svg');
  }catch(_){}
  try{
    startBg = loadImage('assets/images/start_bg.png');
  }catch(_){}
}

function preloadAvatarImages(){
  const imgs = {};
  Object.entries(AVATAR_META).forEach(([id, meta])=>{
    imgs[id] = loadImage(meta.src);
  });
  return imgs;
}

function setup() {
  let cnv = createCanvas(W, H);
  cnv.parent("app");
  noStroke();
  aFogLayer = createGraphics(W, H);
  aFogLayer.noStroke();
  player = new Player(width * 0.5, height * 0.8);
  showIntro();
}

// Draw Room C instruction overlay on top of everything
function drawRoomCInstructionOverlay(){
  if (state !== 'roomC' || !cShowInstr) {
    if (cInstrCloseBtn){
      cInstrCloseBtn.remove();
      cInstrCloseBtn = null;
    }
    return;
  }

  const bx = width * 0.5, by = height * 0.26, bw = width * 0.82, bh = 190;

  // Ensure Close button exists while overlay is visible
  if (!cInstrCloseBtn && typeof createButton === 'function'){
    const { x: canvasLeft, y: canvasTop } = getCanvasOffsets();
    const btnX = canvasLeft + bx - 60;
    const btnY = canvasTop + by + bh / 2 - 24;
    cInstrCloseBtn = createButton('Close');
    cInstrCloseBtn.parent('app');
    cInstrCloseBtn.position(Math.floor(btnX), Math.floor(btnY));
    cInstrCloseBtn.style('width','120px');
    cInstrCloseBtn.style('height','44px');
    cInstrCloseBtn.style('border-radius','12px');
    cInstrCloseBtn.style('background','#f87171');
    cInstrCloseBtn.style('color','#ffffff');
    cInstrCloseBtn.style('font-weight','700');
    cInstrCloseBtn.style('font-size','14px');
    cInstrCloseBtn.style('border','none');
    cInstrCloseBtn.style('box-shadow','0 12px 24px rgba(248, 113, 113, 0.2)');
    cInstrCloseBtn.style('cursor','pointer');
    cInstrCloseBtn.mouseOver(()=>{ cInstrCloseBtn.style('background','#f25c5c'); });
    cInstrCloseBtn.mouseOut(()=>{ cInstrCloseBtn.style('background','#f87171'); });
    cInstrCloseBtn.mousePressed(()=>{
      cShowInstr = false;
      if (cInstrCloseBtn){
        cInstrCloseBtn.remove();
        cInstrCloseBtn = null;
      }
    });
  }

  push();
  // dim backdrop
  noStroke(); fill(10, 12, 20, 140);
  rect(0,0,width,height);
  // Balloon Game instructions panel and text
  const msg = "•JUMP (spacebar) on button to make the balloon bigger.\n" +
            "• Each jump gives you coins.\n" +
            "• Press (Collect Coins) to keep your coins.\n" +
            "• If the balloon pops — you lose your coins!\n\n" +
            "Try to get coins — but don’t be too greedy!";
  fill(26, 30, 44, 230);
  rect(bx - bw / 2, by - bh / 2, bw, bh, 12);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(16);
  try {
    if (typeof textWrap === 'function') {
      textWrap(WORD);
    }
  } catch (_) { }
  text(msg, bx - bw * 0.45, by - bh * 0.35, bw * 0.9, bh * 0.8);
  pop();
}

// Draw Room A instruction overlay on top of everything
function drawRoomAInstructionOverlay(){
  if (state !== 'roomA' || !aShowInstr) return;
  const elapsed = millis() - aInstrShownAt;
  if (elapsed >= 6000) { aShowInstr = false; return; }
  push();
  // dim backdrop
  noStroke(); fill(10, 12, 20, 160);
  rect(0,0,width,height);
  // big panel
  const msg = "Choose the path you think is right and go to the next room.";
  const bx = width*0.5, by = height*0.28, bw = width*0.82, bh = 140;
  fill(26,30,44, 230);
  rect(bx - bw/2, by - bh/2, bw, bh, 12);
  // text
  fill(255); textAlign(CENTER, CENTER); textSize(18);
  try{ if (typeof textWrap === 'function') { textWrap(WORD); } }catch(_){ }
  text(msg, bx - bw*0.45, by - bh*0.35, bw*0.9, bh*0.8);
  pop();
}

// Draw Room B instruction overlay on top of everything
function drawRoomBInstructionOverlay(){
  if (state !== 'roomB' || !bShowInstr) return;
  const elapsed = millis() - bInstrShownAt;
  if (elapsed >= 6000) { bShowInstr = false; return; }
  push();
  // dim backdrop
  noStroke(); fill(10, 12, 20, 160);
  rect(0,0,width,height);
  const msg = "Go along the wooden path and reach the exit door. You can high-five the NPC if you want.";
  const bx = width*0.5, by = height*0.28, bw = width*0.82, bh = 140;
  fill(26,30,44, 230);
  rect(bx - bw/2, by - bh/2, bw, bh, 12);
  fill(255); textAlign(CENTER, CENTER); textSize(18);
  try{ if (typeof textWrap === 'function') { textWrap(WORD); } }catch(_){ }
  text(msg, bx - bw*0.45, by - bh*0.35, bw*0.9, bh*0.8);
  pop();
}

// Start animation: coins from Room C counter fly to HUD and bank to totals
function startBankAnim(){
  if (cBankAnim.active) return;
  if (tempCoins <= 0) return;
  cBankAnim.active = true;
  cBankAnim.startedAt = millis();
  cBankAnim.totalMs = 2000; // fixed 2s animation
  cBankAnim.coins = [];
  cBankAnim.amount = tempCoins;
  // source position: near the counter label below the button
  const sx = cButton.x, sy = cButton.y + 36;
  const delayStep = 40; // ms stagger so all arrive within 2s
  for (let i=0;i<tempCoins;i++){
    cBankAnim.coins.push({ sx: sx + random(-6,6), sy: sy + random(-6,6), delayMs: i*delayStep });
  }
  // visually empty the temp counter immediately; values will add to total at anim end
  tempCoins = 0;
}

// Telemetry overlay (top-right) — shows all markers in realtime; toggle with 'T'
function drawTelemetryOverlay(){
  if (!showTelemetry) return;
  const overlayW = 360;
  const overlayX = width - overlayW - 12;
  const overlayY = 12;
  const overlayH = height - 24; // leave small padding
  const baseDecisionT = (typeof aFirstMoveAt !== 'undefined' && aFirstMoveAt) ? aFirstMoveAt : ((typeof aStartTime !== 'undefined') ? aStartTime : null);
  const decisionSec = baseDecisionT ? ((millis()-baseDecisionT)/1000).toFixed(2) : '0';
  const idleNow = (typeof aIdleTime !== 'undefined' ? aIdleTime : 0) + (aIdleSince? (millis()-aIdleSince)/1000.0 : 0);
  const coinsTotalNow = (coinsRoomA||0) + (coinsRoomB||0) + (coinsSaved||0);
  // Live view of movement metrics (full game + per-room)
  const gameDur = aStartTime ? ((millis()-aStartTime)/1000.0) : 0;
  const roomADur = roomADurationSec || (roomAEnteredAt ? ((millis()-roomAEnteredAt)/1000.0) : 0);
  const roomBDur = roomBDurationSec || (roomBEnteredAt ? ((millis()-roomBEnteredAt)/1000.0) : 0);
  const roomCDur = roomCDurationSec || (roomCEnteredAt ? ((millis()-roomCEnteredAt)/1000.0) : 0);
  const roomADurationFull = aRoomADurationSec || (aStartTime ? ((millis()-aStartTime)/1000.0) : 0);
  const avgHoldMs = (aDirHoldPhases > 0 ? (aDirHoldTotalMs / aDirHoldPhases) : (aAvgDirectionHoldMs || 0));
  let liveJitterIntensity = aJitterIntensity || 'smooth';
  if (gameDur > 0) {
    const jr = aInputJitterCount / gameDur;
    if (jr < 0.2) liveJitterIntensity = 'smooth';
    else if (jr < 0.5) liveJitterIntensity = 'slight';
    else if (jr < 1.0) liveJitterIntensity = 'moderate';
    else liveJitterIntensity = 'high';
  }
  // Live balloon aggregates similar to final telemetry
  const balloonTotals = (()=> {
    const hist = cRoundHistory || [];
    const totalPumps = hist.reduce((s,r)=>s+(r.pumps||0),0);
    const explosionCount = hist.reduce((s,r)=>s+(r.exploded?1:0),0);
    const hesArr = hist.map(r=>r.hesitationAvg).filter(v=>v!==undefined && v!==null);
    const cashArr = hist.filter(r=>!r.exploded && r.cashoutDelay!==null && r.cashoutDelay!==undefined).map(r=>r.cashoutDelay);
    const avgHes = hesArr.length ? hesArr.reduce((s,v)=>s+v,0)/hesArr.length : 0;
  const avgCash = cashArr.length ? cashArr.reduce((s,v)=>s+v,0)/cashArr.length : 0;
    let postRatio = -1;
    const firstExp = hist.findIndex(r=>r.exploded);
    if (firstExp >= 0){
      const pumpsBefore = hist.slice(0, firstExp).reduce((s,r)=>s+(r.pumps||0),0);
      const pumpsAfter = hist.slice(firstExp+1).reduce((s,r)=>s+(r.pumps||0),0);
      postRatio = pumpsBefore > 0 ? (pumpsAfter / pumpsBefore) : -1;
    }
    const pumpsArr = hist.map(r=>r.pumps||0);
    let variability = 0;
    if (pumpsArr.length){
      const mean = pumpsArr.reduce((s,v)=>s+v,0) / pumpsArr.length;
      const varSum = pumpsArr.reduce((s,v)=>s + Math.pow(v-mean,2), 0) / pumpsArr.length;
      variability = Math.sqrt(varSum);
    }
    return {
      totalPumps,
      explosionCount,
      avgHes,
      avgCash,
      postRatio,
      variability
    };
  })();
  const nearPopAgg = (()=> {
    const rounds = (nearPopRounds || []).filter(r=>r && r.sound);
    const count = rounds.length || 0;
    const sum = (k)=>rounds.reduce((s,r)=>s + (Number(r[k])||0),0);
    const mean = (k)=> count ? (sum(k) / count) : 0;
    const strategyPct = count ? (rounds.reduce((s,r)=>s + (r.StrategyShiftFlag?1:0),0) / count) : 0;
    return {
      PumpCountBeforeSound_Mean: mean('PumpCountBeforeSound'),
      PumpSpeedBeforeSound_Mean: mean('PumpSpeedBeforeSound'),
      PumpRhythmVarianceBefore_Mean: mean('PumpRhythmVarianceBefore'),
      PumpSpeedAfterSound_Mean: mean('PumpSpeedAfterSound'),
      PumpRhythmVarianceAfter_Mean: mean('PumpRhythmVarianceAfter'),
      ExtraPumpsAfterSound_Mean: mean('ExtraPumpsAfterSound'),
      TimeToFirstActionAfterSound_Mean: mean('TimeToFirstActionAfterSound'),
      PumpSpeedChangeRatio_Mean: mean('PumpSpeedChangeRatio'),
      RhythmStabilityChange_Mean: mean('RhythmStabilityChange'),
      StrategyShiftFlag_Pct: strategyPct,
      NearPopCoinsSavedAfterSound_Sum: sum('NearPopCoinsSavedAfterSound'),
      NearPopCoinsLostAfterSound_Sum: sum('NearPopCoinsLostAfterSound'),
      NearPopRoundsWithSound: count
    };
  })();
  const avatarDataLive = (typeof window !== 'undefined' && window.avatarTelemetry) ? window.avatarTelemetry : {
    AvatarChosen,
    AvatarChoiceTimeMs,
    AvatarHoverCount,
    AvatarClickCount,
    AvatarShapeType,
    AvatarColorCategory,
    AvatarFinalHesitationMs
  };
  const rb = logs.roomB || {};
  const lines = [
    `PlayerID: ${playerId||''}`,
    `Big5TestID: ${big5Id||''}`,
    `TimeBeforeStart: ${timeBeforeStartSec||0}`,
    `FirstPathChoice: ${aChoice||''}`,
    `DecisionTime: ${decisionSec}`,
    `CoinsRoomA: ${coinsRoomA||0}`,
    `IdleTime: ${idleNow.toFixed(2)}`,
    `ChangedDirectionCount: ${aChangedDirectionCount||0}`,
    `SignificantDirectionChanges: ${aSignificantDirectionChanges||0}`,
    `InputJitterCount: ${aInputJitterCount||0}`,
    `JitterIntensity: ${liveJitterIntensity}`,
    `AvgDirectionHoldMs: ${avgHoldMs.toFixed ? avgHoldMs.toFixed(1) : avgHoldMs}`,
    `GameDurationSec: ${gameDur.toFixed ? gameDur.toFixed(2) : gameDur}`,
    `RoomA_DurationSec: ${roomADur.toFixed ? roomADur.toFixed(2) : roomADur}`,
    `RoomADurationSec: ${roomADurationFull.toFixed ? roomADurationFull.toFixed(2) : roomADurationFull}`,
    `RoomB_DurationSec: ${roomBDur.toFixed ? roomBDur.toFixed(2) : roomBDur}`,
    `RoomC_DurationSec: ${roomCDur.toFixed ? roomCDur.toFixed(2) : roomCDur}`,
    `AvatarShapeType: ${AvatarShapeType||avatarDataLive.AvatarShapeType||''}`,
    `AvatarColorCategory: ${AvatarColorCategory||avatarDataLive.AvatarColorCategory||''}`,
    `AvatarChosen: ${AvatarChosen||avatarDataLive.AvatarChosen||''}`,
    `AvatarHoverCount: ${AvatarHoverCount||avatarDataLive.AvatarHoverCount||0}`,
    `AvatarClickCount: ${AvatarClickCount||avatarDataLive.AvatarClickCount||0}`,
    `AvatarChoiceTimeMs: ${AvatarChoiceTimeMs||avatarDataLive.AvatarChoiceTimeMs||0}`,
    `AvatarFinalHesitationMs: ${AvatarFinalHesitationMs||avatarDataLive.AvatarFinalHesitationMs||0}`,
    `AggressivePush: ${bPushed?1:0}`,
    `AgreePoints: ${bAgreePoints||0}`,
    `EfficiencyPoints: ${bEfficiencyPoints||0}`,
    `conflict_choice_flag: ${rb.conflict_choice_flag||0}`,
    `time_to_walk_for_key_ms: ${rb.time_to_walk_for_key_ms||0}`,
    `distance_traveled_after_conflict: ${rb.distance_traveled_after_conflict||0}`,
    `hesitation_before_walking_ms: ${rb.hesitation_before_walking_ms||0}`,
    `proximity_to_NPC_after_conflict: ${rb.proximity_to_NPC_after_conflict||0}`,
    `cooperation_choice_flag: ${rb.cooperation_choice_flag||0}`,
    `time_to_door_after_cooperation: ${rb.time_to_door_after_cooperation||0}`,
    `willingness_to_wait_for_NPC: ${rb.willingness_to_wait_for_NPC||0}`,
    `distance_kept_from_NPC_before_choice: ${rb.distance_kept_from_NPC_before_choice||0}`,
    `TilesSteppedOnTrail: ${tilesSteppedOnTrail||0}`,
    `CoinsRoomB: ${coinsRoomB||0}`,
    `PumpsCount: ${pumpsCount||0}`,
    `SpacePressCount: ${cSpacePressCount||0}`,
    `BalloonExploded: ${balloonExploded?1:0}`,
    `CoinsCollectedBalloon: ${coinsCollectedBalloon||0}`,
    `CoinsSaved: ${coinsSaved||0}`,
    `CoinsTotal: ${coinsTotalNow}`,
    `AvatarChosen(formData): ${avatarDataLive.AvatarChosen||''}`,
    `Balloon_Total_Pumps: ${balloonTotals.totalPumps||0}`,
    `Balloon_Explosions_Count: ${balloonTotals.explosionCount||0}`,
    `Balloon_Avg_Hesitation_Ms: ${balloonTotals.avgHes||0}`,
    `Balloon_Avg_Cashout_Delay_Ms: ${balloonTotals.avgCash||0}`,
    `Balloon_Post_Explosion_Ratio: ${balloonTotals.postRatio}`,
    `Balloon_Risk_Variability: ${balloonTotals.variability||0}`,
    `PumpCountBeforeSound_Mean: ${nearPopAgg.PumpCountBeforeSound_Mean||0}`,
    `PumpSpeedBeforeSound_Mean: ${nearPopAgg.PumpSpeedBeforeSound_Mean||0}`,
    `PumpRhythmVarianceBefore_Mean: ${nearPopAgg.PumpRhythmVarianceBefore_Mean||0}`,
    `PumpSpeedAfterSound_Mean: ${nearPopAgg.PumpSpeedAfterSound_Mean||0}`,
    `PumpRhythmVarianceAfter_Mean: ${nearPopAgg.PumpRhythmVarianceAfter_Mean||0}`,
    `ExtraPumpsAfterSound_Mean: ${nearPopAgg.ExtraPumpsAfterSound_Mean||0}`,
    `TimeToFirstActionAfterSound_Mean: ${nearPopAgg.TimeToFirstActionAfterSound_Mean||0}`,
    `PumpSpeedChangeRatio_Mean: ${nearPopAgg.PumpSpeedChangeRatio_Mean||0}`,
    `RhythmStabilityChange_Mean: ${nearPopAgg.RhythmStabilityChange_Mean||0}`,
    `StrategyShiftFlag_Pct: ${nearPopAgg.StrategyShiftFlag_Pct||0}`,
    `NearPopCoinsSavedAfterSound_Sum: ${nearPopAgg.NearPopCoinsSavedAfterSound_Sum||0}`,
    `NearPopCoinsLostAfterSound_Sum: ${nearPopAgg.NearPopCoinsLostAfterSound_Sum||0}`,
    `NearPopRoundsWithSound: ${nearPopAgg.NearPopRoundsWithSound||0}`,
    `Timestamp: ${new Date().toISOString()}`
  ];
  const lineH = 18;
  const maxVisibleLines = Math.max(1, Math.floor((overlayH - 12) / lineH));
  const totalHeight = lines.length * lineH;
  const maxScroll = Math.max(0, totalHeight - overlayH);
  telemetryScroll = constrain(telemetryScroll, 0, maxScroll);
  const startLine = Math.floor(telemetryScroll / lineH);
  const offsetY = overlayY + 6 - (telemetryScroll % lineH);
  const xText = overlayX + overlayW - 8;
  push();
  // faint background for readability
  noStroke(); fill(10, 12, 20, 140);
  rect(overlayX, overlayY, overlayW, overlayH, 8);
  // clip to overlay area
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(overlayX, overlayY, overlayW, overlayH);
  drawingContext.clip();
  fill(255); textAlign(RIGHT, TOP); textSize(12);
  for (let i=startLine; i<Math.min(lines.length, startLine + maxVisibleLines + 2); i++){
    text(lines[i], xText, offsetY + (i - startLine) * lineH);
  }
  // scrollbar
  if (maxScroll > 0){
    const barH = Math.max(24, overlayH * (overlayH / totalHeight));
    const barY = overlayY + (overlayH - barH) * (telemetryScroll / maxScroll);
    fill(255,255,255,120);
    rect(overlayX + overlayW - 6, barY, 4, barH, 2);
  }
  drawingContext.restore();
  pop();
}

function showIntro(){
  state = 'intro';
  // reset timer baseline for intro screen
  let nowT = (typeof performance!=='undefined' && performance.now)? performance.now() : Date.now();
  gameLoadedAt = nowT;
  // Big Five test link
  if (!big5Link && typeof createA === 'function'){
    big5Link = createA('https://bigfive-test.com/test', 'Take the Big Five test');
    big5Link.attribute('target','_blank');
    big5Link.attribute('rel','noreferrer');
    big5Link.parent('app');
    styleBig5Link(big5Link);
  }
  // Name input
  if (!nameInput && typeof createInput === 'function'){
    nameInput = createInput('');
    nameInput.attribute('placeholder','Your name');
    nameInput.parent('app');
    styleIntroInput(nameInput);
  }
  // Optional Big 5 test ID input
  if (!big5Input && typeof createInput === 'function'){
    big5Input = createInput('');
    big5Input.attribute('placeholder','Big Five Test ID (optional)');
    big5Input.parent('app');
    styleIntroInput(big5Input);
  }
  // Start button
  if (!startBtn && typeof createButton === 'function'){
    startBtn = createButton("Let's Begin");
    startBtn.parent('app');
    styleIntroStartButton(startBtn);
    startBtn.mousePressed(()=>{ handleStartRequest(); });
  }
  layoutIntroElements();
}

function handleStartRequest(){
  if (startReady){
    showGreetingModal();
    return;
  }
  const v = nameInput ? (nameInput.value()||'').trim() : '';
  if (!v && nameInput){ nameInput.elt.style.outline = '2px solid #f66'; return; }
  playerId = v || 'Guest';
  big5Id = big5Input ? (big5Input.value()||'').trim() : '';
  if (nameInput){ nameInput.remove(); nameInput=null; }
  if (big5Input){ big5Input.remove(); big5Input=null; }
  if (startBtn){ startBtn.remove(); startBtn=null; }
  if (big5Link){ big5Link.remove(); big5Link=null; }
  startReady = true;
  showGreetingModal();
}

function computeTimeBeforeStart(){
  const nowT = (typeof performance!=='undefined' && performance.now)? performance.now() : Date.now();
  const base = (typeof window !== 'undefined' && window.avatarSelectionStartTime)
    ? window.avatarSelectionStartTime
    : gameLoadedAt;
  timeBeforeStartSec = ((nowT - base)/1000).toFixed(2);
  if (typeof window !== 'undefined'){
    window.timeBeforeStartSec = timeBeforeStartSec;
  }
}
if (typeof window !== 'undefined'){
  window.computeTimeBeforeStart = computeTimeBeforeStart;
}

function showGreetingModal(){
  if (greetingShown && !greetingModal) return;
  greetingShown = true;
  if (greetingModal){
    greetingModal.show();
    if (greetingBtn) greetingBtn.show();
    greetingVisible = true;
    return;
  }
  if (typeof createDiv !== 'function' || typeof createButton !== 'function') return;
  greetingModal = createDiv('');
  greetingModal.parent('app');
  greetingModal.style('position','fixed');
  greetingModal.style('inset','0');
  greetingModal.style('background','rgba(10,12,20,0.82)');
  greetingModal.style('display','flex');
  greetingModal.style('align-items','center');
  greetingModal.style('justify-content','center');
  greetingModal.style('z-index','2000');
  greetingVisible = true;

  const card = createDiv('');
  card.parent(greetingModal);
  card.style('width','min(900px, 90vw)');
  card.style('min-height','420px');
  card.style('background','linear-gradient(135deg, rgba(28,34,52,0.95), rgba(20,24,34,0.94))');
  card.style('border','1px solid rgba(255,255,255,0.12)');
  card.style('box-shadow','0 24px 70px rgba(0,0,0,0.5)');
  card.style('border-radius','20px');
  card.style('padding','40px 46px 30px');
  card.style('color','#f8fafc');
  card.style('text-align','center');
  card.style('display','flex');
  card.style('flex-direction','column');
  card.style('justify-content','space-between');
  card.style('gap','18px');

  const title = createElement('h2','Welcome, adventurer');
  title.parent(card);
  title.style('margin','0 0 8px');
  title.style('font-size','32px');
  title.style('letter-spacing','0.5px');

  const body = createP("Imagine you are all by yourself in an unknown territory, which is all yours to explore and gain coins of extreme value. Your choices and actions will create your adventure story.");
  body.parent(card);
  body.style('margin','0 auto');
  body.style('max-width','760px');
  body.style('padding','0 12px');
  body.style('font-size','22px');
  body.style('line-height','1.8');
  body.style('letter-spacing','0.2px');
  body.style('text-align','center');
  body.style('color','#f1f5f9');
  body.style('text-shadow','0 2px 10px rgba(0,0,0,0.35)');
  body.style('flex','1');
  body.style('display','flex');
  body.style('align-items','center');

  greetingBtn = createButton('Continue');
  greetingBtn.parent(card);
  styleIntroStartButton(greetingBtn);
  greetingBtn.style('align-self','center');
  greetingBtn.style('width','200px');
  greetingBtn.style('margin','0 auto 6px');
  greetingBtn.mousePressed(()=>{
    if (greetingBtn){ greetingBtn.remove(); greetingBtn = null; }
    if (greetingModal){ greetingModal.remove(); greetingModal = null; }
    greetingVisible = false;
    if (typeof window.showAvatarSelect === 'function'){
      window.showAvatarSelect();
    } else if (avatarChosen){
      startGame();
    } else {
      startGame();
    }
  });
}

function startGame(){
  computeTimeBeforeStart();
  startReady = true; // allow avatar flow to initiate game
  if (!avatarChosen || !selectedAvatar || !selectedAvatar.shapeName || !selectedAvatar.colorName || !colorChosen){
    if (typeof window.showAvatarSelect === 'function'){ window.showAvatarSelect(); }
    return;
  }
  applyAvatarColor();
  if (!avatarSprite){
    const key = resolveAvatarKey(selectedAvatar.shapeName, selectedAvatar.colorName);
    if (key && avatarImages[key]) {
      avatarSprite = avatarImages[key];
    }
  }
  if (typeof window !== 'undefined' && window.avatarTelemetry){
    logs.avatar = Object.assign({}, window.avatarTelemetry);
  }
  initRoomA();
}

function resolveAvatarKey(shapeName, colorName){
  const shape = (shapeName||'').toLowerCase();
  const map = {
    'triangle': 'triangle-neutral',
    'square': 'square-neutral',
    'circle': 'circle-neutral',
    'diamond': 'diamond-neutral',
    'star': 'star-neutral'
  };
  return map[shape] || null;
}

function applyAvatarColor(){
  const key = resolveAvatarKey(selectedAvatar.shapeName, selectedAvatar.colorName);
  if (selectedAvatar.finalSprite){
    avatarSprite = loadImage(selectedAvatar.finalSprite, img=>{ avatarSprite = img; });
    avatarTintColor = null;
    avatarTintedUrl = selectedAvatar.finalSprite;
  } else if (selectedAvatar.tintedUrl){
    avatarSprite = loadImage(selectedAvatar.tintedUrl, img=>{ avatarSprite = img; });
    avatarTintColor = null;
    avatarTintedUrl = selectedAvatar.tintedUrl;
  } else if (key && avatarImages[key]){
    const meta = AVATAR_META[key];
    avatarSprite = avatarImages[key];
    avatarTintColor = selectedAvatar.colorHex || meta.colorHex || null;
    avatarTintedUrl = null;
  } else {
    avatarSprite = null;
  }
  if (key && AVATAR_META[key]){
    const meta = AVATAR_META[key];
    avatarShapeTelemetry = meta.shape;
    avatarColorTelemetry = selectedAvatar.colorName || meta.color;
    AvatarShapeChosen = meta.shape;
    AvatarColorChosen = selectedAvatar.colorName || meta.color;
  }
}

// Intro UI helpers: layout, styling, and positioning
function getCanvasOffsets(){
  const x = Math.max(0, Math.floor((windowWidth - width)/2));
  const y = Math.max(0, Math.floor((windowHeight - height)/2));
  return { x, y };
}

function getIntroLayout(){
  const containerW = constrain(width * 0.68, 520, 780);
  const containerH = Math.min(Math.max(height * 0.72, 360), height - 40);
  const containerX = (width - containerW) / 2;
  const containerY = (height - containerH) / 2;
  const inputW = constrain(containerW * 0.7, 340, 420);
  const formX = width/2 - inputW/2;
  const titleY = containerY + 28;
  const subtitleY = titleY + 34;
  const big5BtnY = subtitleY + 52;
  const big5BtnW = constrain(containerW * 0.6, 280, 420);
  const big5BtnH = 52;
  const nameLabelY = big5BtnY + 80;
  const nameInputY = nameLabelY + 18;
  const big5LabelY = nameInputY + 68;
  const big5InputY = big5LabelY + 18;
  const exampleY = big5InputY + 52;
  const startY = exampleY + 42;
  const ctrlW = 190, ctrlH = 96;
  const ctrlX = 24;
  const ctrlY = height - ctrlH - 24;
  return {
    container: { x: containerX, y: containerY, w: containerW, h: containerH },
    formX, inputW,
    titleY, subtitleY,
    big5BtnY,
    nameLabelY, nameInputY,
    big5LabelY, big5InputY,
    exampleY, startY,
    startW: 200, startH: 48,
    big5BtnW, big5BtnH,
    ctrl: { x: ctrlX, y: ctrlY, w: ctrlW, h: ctrlH }
  };
}

function styleIntroInput(el){
  if (!el || el._styled) return;
  if (!styleIntroInput.placeholderCSSAdded && typeof document !== 'undefined'){
    const s = document.createElement('style');
    s.id = 'intro-input-style';
    s.textContent = '.intro-input::placeholder{color:#9ca3af;font-weight:700;}';
    document.head.appendChild(s);
    styleIntroInput.placeholderCSSAdded = true;
  }
  el.class('intro-input');
  el.style('height', '54px');
  el.style('padding', '0 14px');
  el.style('border-radius', '12px');
  el.style('border', '1px solid #d3d8de');
  el.style('background-color', '#f3f4f6');
  el.style('color', '#1f2937');
  el.style('font-size', '16px');
  el.style('font-weight', '700');
  el.style('letter-spacing', '0.2px');
  el.style('outline', 'none');
  el.style('box-shadow', '0 12px 26px rgba(0,0,0,0.12)');
  el.style('box-sizing', 'border-box');
  el.style('margin', '0');
  if (el.elt) {
    el.elt.style.caretColor = '#333';
  }
  el._styled = true;
}

function styleBig5Link(el){
  if (!el || el._styled) return;
  el.style('display', 'inline-block');
  el.style('text-align', 'center');
  el.style('font-weight', '700');
  el.style('font-size', '15px');
  el.style('letter-spacing', '0.2px');
  el.style('padding', '0 16px');
  el.style('box-sizing', 'border-box');
  el.style('margin', '0');
  el.style('background', '#f87171');
  el.style('color', '#ffffff');
  el.style('border-radius', '14px');
  el.style('text-decoration', 'none');
  el.style('box-shadow', '0 14px 30px rgba(248, 113, 113, 0.25)');
  el.style('border', 'none');
  el.style('line-height', '52px');
  el.style('height', '56px');
  el.style('cursor', 'pointer');
  if (!el._hoverBound){
    el.mouseOver(()=>{ el.style('background', '#f25c5c'); });
    el.mouseOut(()=>{ el.style('background', '#f87171'); });
    el._hoverBound = true;
  }
  el._styled = true;
}

function styleIntroStartButton(btn){
  if (!btn || btn._styled) return;
  btn.style('height', '56px');
  btn.style('border-radius', '14px');
  btn.style('background-color', '#f87171');
  btn.style('color', '#ffffff');
  btn.style('font-size', '16px');
  btn.style('font-weight', '700');
  btn.style('letter-spacing', '0.2px');
  btn.style('border', 'none');
  btn.style('cursor', 'pointer');
  btn.style('box-shadow', '0 14px 30px rgba(248, 113, 113, 0.25)');
  btn.style('text-transform', 'uppercase');
  btn.style('box-sizing', 'border-box');
  btn.style('display', 'flex');
  btn.style('align-items', 'center');
  btn.style('justify-content', 'center');
  btn.mouseOver(()=>{ btn.style('background-color', '#f25c5c'); });
  btn.mouseOut(()=>{ btn.style('background-color', '#f87171'); });
  btn._styled = true;
}

function layoutIntroElements(layout){
  if (!layout) layout = getIntroLayout();
  const { x: canvasLeft, y: canvasTop } = getCanvasOffsets();
  if (big5Link){
    styleBig5Link(big5Link);
    big5Link.style('width', layout.big5BtnW + 'px');
    big5Link.style('height', layout.big5BtnH + 'px');
    big5Link.style('line-height', layout.big5BtnH + 'px');
    big5Link.position(canvasLeft + width/2 - layout.big5BtnW/2, canvasTop + layout.big5BtnY);
  }
  if (nameInput){
    styleIntroInput(nameInput);
    nameInput.position(canvasLeft + layout.formX, canvasTop + layout.nameInputY);
    nameInput.size(layout.inputW, 48);
  }
  if (big5Input){
    styleIntroInput(big5Input);
    big5Input.position(canvasLeft + layout.formX, canvasTop + layout.big5InputY);
    big5Input.size(layout.inputW, 48);
  }
  if (startBtn && state === 'intro'){
    styleIntroStartButton(startBtn);
    startBtn.position(canvasLeft + width/2 - layout.startW/2, canvasTop + layout.startY);
    startBtn.size(layout.startW, layout.startH);
  }
}

function drawIntro(){
  const layout = getIntroLayout();
  layoutIntroElements(layout);

  push();
  rectMode(CORNER);

  // background
  if (startBg){
    image(startBg, 0, 0, width, height);
  } else {
    backgroundGradient();
  }
  // card
  noStroke();
  fill(253,247,240, 245);
  drawingContext.shadowColor = 'rgba(0,0,0,0.2)';
  drawingContext.shadowBlur = 24;
  drawingContext.shadowOffsetY = 10;
  rect(layout.container.x, layout.container.y, layout.container.w, layout.container.h, 28);
  drawingContext.shadowBlur = 0;
  drawingContext.shadowOffsetY = 0;

  // title & subtitle
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  textSize(32);
  const introTitle = "Welcome to Genie-game";
  const introSubtitle = "Your choices shape your personality profile.\nStart with a short Big Five test.";
  try{ if (typeof textWrap === 'function') { textWrap(WORD); } } catch(_){ }
  fill('#1c304a');
  text(introTitle, layout.container.x, layout.titleY, layout.container.w);
  textStyle(NORMAL);
  textSize(16);
  fill('#4b5563');
  text(introSubtitle, layout.container.x, layout.subtitleY, layout.container.w);

  // mascot
  push();
  const mx = layout.container.x + 44;
  const my = layout.container.y + layout.container.h - 18;
  noStroke();
  // shadow under feet (fixed)
  fill(0,0,0,59);
  ellipse(mx, my + 52, 63, 19);
 
  // legs (fixed)
  stroke(255); strokeWeight(6); strokeCap(ROUND);
  line(mx-12, my+28, mx-14, my+48);
  line(mx+12, my+28, mx+14, my+48);
  // body + arms wobble/bob
  const wobble = sin(frameCount * 0.05) * 3;
  const bob = sin(frameCount * 0.04) * 2;
  push();
  translate(0, bob);
  translate(0, wobble*0.1);
  // body
  noStroke();
  fill(200, 160, 250);
  circle(mx, my, 68);
  // face
  fill(47,47,47);
  circle(mx - 12, my - 8 + wobble*0.1, 8);
  circle(mx + 12, my - 8 + wobble*0.1, 8);
  stroke(47,47,47); strokeWeight(3); noFill();
  arc(mx, my + 6 + wobble*0.1, 22, 14, 0, PI);
  // arms: left static, right waving
  stroke(200,160,250); strokeWeight(7); strokeCap(ROUND);
  // left arm (downward relaxed)
  const shoulderL = { x: mx - 32, y: my + 6 }; // start closer to edge of body
  const angL = PI * 0.62; // down-left
  const lenArm = 24;
  line(shoulderL.x, shoulderL.y,
       shoulderL.x + cos(angL) * lenArm,
       shoulderL.y + sin(angL) * lenArm);
  // right arm (up-left with wave)
  const baseAngR = -PI * 0.15; // slightly up-left
  const wavePhase = frameCount % 180;
  const wave = wavePhase < 60 ? sin(wavePhase * 0.25) * 0.45 : 0;
  const angR = baseAngR - wave; // wave upward/outward
  const shoulderR = { x: mx + 32, y: my + 1 }; // start closer to edge of body
  line(shoulderR.x, shoulderR.y,
       shoulderR.x + cos(angR) * lenArm,
       shoulderR.y + sin(angR) * lenArm);
  pop();
  pop();

  // form labels
  textAlign(LEFT, TOP);
  textSize(12);
  fill('#1f2937');
  text("Name", layout.formX, layout.nameLabelY);
  text("Big Five Test ID (optional)", layout.formX, layout.big5LabelY);

  // example under second input
  textSize(12);
  fill('#6b7280');
  const exampleLabel = "Example ID: ";
  const exampleCode = "6936756610ac331e1.bd8edc5";
  text(exampleLabel, layout.formX, layout.exampleY);
  const lblW = textWidth(exampleLabel);
  const prevFont = textFont();
  textFont('monospace');
  fill('#f87171');
  text(exampleCode, layout.formX + lblW, layout.exampleY);
  textFont(prevFont);

  // controls mini-card
  const ctrl = layout.ctrl;
  noStroke();
  fill(0, 0, 0, 96);
  rect(ctrl.x, ctrl.y, ctrl.w, ctrl.h, 12);
  const keySize = 20;
  const wasdX = ctrl.x + 20;
  const wasdY = ctrl.y + 18;
  const arrowX = ctrl.x + ctrl.w - (keySize * 2) - 28;
  const arrowY = wasdY;
  stroke(200); strokeWeight(1.2); fill(0,0,0,30);
  // WASD
  rect(wasdX + keySize, wasdY, keySize, keySize, 6);
  rect(wasdX, wasdY + keySize + 4, keySize, keySize, 6);
  rect(wasdX + keySize, wasdY + keySize + 4, keySize, keySize, 6);
  rect(wasdX + keySize*2 + 4, wasdY + keySize + 4, keySize, keySize, 6);
  // Arrows
  rect(arrowX + keySize, arrowY, keySize, keySize, 6);
  rect(arrowX, arrowY + keySize + 4, keySize, keySize, 6);
  rect(arrowX + keySize, arrowY + keySize + 4, keySize, keySize, 6);
  rect(arrowX + keySize*2 + 4, arrowY + keySize + 4, keySize, keySize, 6);
  // letters
  noStroke(); fill(255); textAlign(CENTER, CENTER); textSize(11);
  text("W", wasdX + keySize + keySize/2, wasdY + keySize/2);
  text("A", wasdX + keySize/2, wasdY + keySize + 4 + keySize/2);
  text("S", wasdX + keySize + keySize/2, wasdY + keySize + 4 + keySize/2);
  text("D", wasdX + keySize*2 + 4 + keySize/2, wasdY + keySize + 4 + keySize/2);
  text("^", arrowX + keySize + keySize/2, arrowY + keySize/2);
  text("<", arrowX + keySize/2, arrowY + keySize + 4 + keySize/2);
  text("v", arrowX + keySize + keySize/2, arrowY + keySize + 4 + keySize/2);
  text(">", arrowX + keySize*2 + 4 + keySize/2, arrowY + keySize + 4 + keySize/2);
  // Jump label
  textAlign(LEFT, CENTER);
  textSize(11);
  fill(255);
  text("Jump: SPACE", ctrl.x + 14, ctrl.y + ctrl.h - 16);
  pop();
}

// COINS & HUD
function drawAndCollectCoins(arr){
  for (let i=0;i<arr.length;i++){
    const c = arr[i]; if (c.got) continue;
    // simple coin without glow
    const coinSize = 18; // 1.8x larger
    noStroke(); fill(245, 205, 80, 235);
    circle(c.x, c.y, coinSize);
    stroke(255, 235, 160, 160); noFill(); circle(c.x, c.y, coinSize + 1);
    push();
    noStroke(); fill(45, 30, 10, 220); textAlign(CENTER, CENTER); textSize(14);
    text("$", c.x, c.y + 1);
    pop();
    // collect
    const bodyR = (player && player.r ? player.r + 4 : 18);
    const coinR = coinSize * 0.9;
    if (dist(player.x, player.y, c.x, c.y) < (bodyR + coinR)){
      c.got = true; totalCoins++;
      if (state === 'roomA') coinsRoomA++;
      if (state === 'roomB') coinsRoomB++;
    }
  }
}

function drawHUD(){
  push();
  // coin icon and count on left
  translate(16, 18);
  noStroke(); fill(245, 205, 80, 235); circle(8,8, 12);
  stroke(255, 235, 160, 150); noFill(); circle(8,8, 14);
  noStroke(); fill(255);
  textAlign(LEFT, CENTER); textSize(14);
  text(totalCoins.toString(), 24, 8);
  pop();
}

function keyPressed() {
  if (!ambientStarted) tryStartAmbient();
  if (key === ' ' || keyCode === 32) {
    if (state === 'roomC') cSpacePressCount++;
    if (state === "roomC") playerJump();
  }
  if (keyCode === ENTER || key === 'Enter'){
    // Greeting modal
    if (greetingVisible && greetingBtn && greetingBtn.elt){
      greetingBtn.elt.click();
      return;
    }
    // Intro start
    if (state === 'intro' && startBtn){
      handleStartRequest();
      return;
    }
    // Avatar modal delegates own handler if provided
    if (typeof window !== 'undefined' && typeof window.handleAvatarEnter === 'function'){
      if (window.handleAvatarEnter()) return;
    }
  }
  // Telemetry overlay: double-T within 400ms to toggle
  if (key === 't' || key === 'T') {
    const now = millis ? millis() : Date.now();
    if (telemetryLastTogglePressAt && (now - telemetryLastTogglePressAt) < 400) {
      showTelemetry = !showTelemetry;
      telemetryScroll = 0;
      telemetryLastTogglePressAt = 0;
    } else {
      telemetryLastTogglePressAt = now;
    }
  }
}

function mouseWheel(event){
  if (!showTelemetry) return;
  const overlayW = 360;
  const overlayX = width - overlayW - 12;
  const overlayY = 12;
  const overlayH = height - 24;
  if (mouseX >= overlayX && mouseX <= overlayX + overlayW && mouseY >= overlayY && mouseY <= overlayY + overlayH){
    telemetryScroll += event.deltaY;
    return false; // prevent page scroll
  }
}

function draw() {
  backgroundGradient();

  if (state === "intro") {
    drawIntro();
  } else if (state === "roomA") {
    drawForestBackdrop();
    roomA();
  } else if (state === "roomB") {
    drawWatercolorBackdrop();
    roomB();
  } else if (state === "roomC") {
    drawSkyDots();
    roomC();
  } else if (state === "end") {
    endScreen();
  }

  drawHUD();
  if (typeof drawTelemetryOverlay === 'function') drawTelemetryOverlay();

  if (fading) {
    fade = min(255, fade + 10);
    fill(10, 12, 20, fade);
    rect(0,0,width,height);
    if (fade >= 255) {
      fading = false;
      fade = 0;
    }
  }
  // Draw instruction overlay above everything else
  if (typeof drawRoomAInstructionOverlay === 'function') drawRoomAInstructionOverlay();
  if (typeof drawRoomBInstructionOverlay === 'function') drawRoomBInstructionOverlay();
  if (typeof drawRoomCInstructionOverlay === 'function') drawRoomCInstructionOverlay();
}

// Ambient generative sound (very subtle)
function tryStartAmbient() {
  // Disabled ambient audio per request
  return;
}

// PLAYER
class Player {
  constructor(x,y){
    this.x=x; this.y=y; this.r=18; this.spd=1.15;
    this.vx=0; this.vy=0; this.g = 0.6; this.onGround=true; this.jumpV=-8; this.height=0; this.justLanded=false;
    this.runPhase = 0;
    this.runAmt = 0;
  }
  update(){
    this.justLanded = false;
    let wasOnGround = this.onGround;
    let ax = (keyIsDown(65)||keyIsDown(37))?-1:0; // A/Left
    ax += (keyIsDown(68)||keyIsDown(39))?1:0; // D/Right
    let ay = (keyIsDown(87)||keyIsDown(38))?-1:0; // W/Up
    ay += (keyIsDown(83)||keyIsDown(40))?1:0; // S/Down
    let d = createVector(ax, ay);
    const speedBoost = (typeof keyIsDown === 'function' && keyIsDown(17)) ? 7 : 1; // Left Ctrl turbo
    // Frame-rate independent movement: scale by deltaTime (ms per frame)
    const dt = (typeof deltaTime !== 'undefined' ? deltaTime : 16.6667);
    const dtScale = dt / 16.6667; // 60fps baseline
    if (d.mag()>0) d.normalize().mult(this.spd * dtScale * speedBoost);
    this.vx = d.x; this.vy = d.y;

    // Horizontal move always; vertical move only outside jump context (top-down illusion)
    this.x += this.vx;
    this.y += this.vy;

    const moving = (abs(this.vx) + abs(this.vy)) > 0.02;
    if (moving){
      this.runPhase += 0.05 * dtScale * speedBoost; // faster legs when boosted
      this.runAmt = min(1, this.runAmt + 0.08 * dtScale * speedBoost);
    } else {
      this.runAmt = max(0, this.runAmt - 0.06 * dtScale);
    }

    // Simple jump arc for Room C button interaction
    if (!this.onGround){
      const gFactor = (typeof state !== 'undefined' && state === 'roomC') ? 0.5 : 1; // slower gravity over balloons
      this.height += -this.jumpVel; // visual height
      this.jumpVel += this.g * gFactor;
      if (this.height <= 0){
        this.height = 0; this.onGround = true;
      }
    }
    if (!wasOnGround && this.onGround) this.justLanded = true;
    this.x = constrain(this.x, 20, width-20);
    this.y = constrain(this.y, 20, height-20);
  }
  draw(){
    push();
    translate(this.x, this.y - this.height*0.4);
    const bob = sin(this.runPhase * 1.6) * 3 * this.runAmt;
    const tilt = sin(this.runPhase * 1.2) * 0.08 * this.runAmt;
    translate(0, -bob);
    rotate(tilt);
    // body sprite
    const drawSize = 80; // enlarged body
    if (avatarSprite){
      imageMode(CENTER);
      if (avatarTintColor){
        push();
        tint(avatarTintColor);
        image(avatarSprite, 0, 0, drawSize, drawSize);
        pop();
      } else {
        image(avatarSprite, 0, 0, drawSize, drawSize);
      }
      // Improved leg animation (uses SVG leg positions)
      const scale = drawSize / 512;
      const legBaseX = 32 * scale;
      const legBaseY = (390 - 256) * scale;
      const upperLegLen = 95 * scale * (2/3); // shorten legs by one third
      const lowerLegLen = 85 * scale * (2/3);
      const legW = max(3, 4 * scale);
      const t = this.runPhase;
      const moving = this.runAmt > 0.05;
      const swingAmp = 0.85;
      const leftSwing  = sin(t * 2.2) * swingAmp;
      const rightSwing = sin(t * 2.2 + PI) * swingAmp;
      const leftKneeLag  = sin(t * 3.4 + HALF_PI) * 0.35;
      const rightKneeLag = sin(t * 3.4 + HALF_PI + PI) * 0.35;
      const bounce = moving ? sin(t * 2.2) * (4 * scale) : 0;
      const drawLeg = (xBase, yBase, hipAngle, kneeAngle) => {
        push();
        translate(xBase, yBase + bounce);
        push();
        rotate(hipAngle * 0.5);
        stroke(255);
        strokeCap(ROUND);
        strokeWeight(legW);
        line(0, 0, 0, upperLegLen);
        translate(0, upperLegLen);
        rotate(kneeAngle * 0.6);
        line(0, 0, 0, lowerLegLen);
        pop();
        pop();
      };
      drawLeg(-legBaseX, legBaseY, leftSwing, leftKneeLag);
      drawLeg( legBaseX, legBaseY, rightSwing, rightKneeLag);
    }
    pop();
  }
}

 

// ROOM A — The Three Paths

function initRoomA() {
  state = "roomA";
  aStartTime = millis();
  roomAEnteredAt = aStartTime;
  aWallsCloseAt = aStartTime;
  aClosing = 0;
  aChoice = null;
  aLockedPath = -1;
  aFirstLockTime = null;
  aOutsideDuration = 0;
  aMargin = 80;
  aDataSent = false;
  aChangedDirectionCount = 0;
  aLastDir = 'none';
  aIdleTime = 0;
  aIdleSince = null;
  aLastFrameMs = millis();
  aHasMoved = false;
  aDomAxisLast = null;
  aAxisSignLast = 0;
  aFirstMoveAt = null;
  // aWallsCloseAt will be set 3s after first movement
  aWallsCloseAt = null;
  aShowInstr = true; aInstrShownAt = millis();
  // reset Room A movement metrics
  aSignificantDirectionChanges = 0;
  aInputJitterCount = 0;
  aLastMoveDir = 'none';
  aLastMoveDirChangedAt = millis();
  aLastRawDir = 'none';
  aLastRawDirChangedAt = millis();
  aDirHoldTotalMs = 0;
  aDirHoldPhases = 0;
  aAvgDirectionHoldMs = 0;
  aRoomADurationSec = 0;
  aJitterIntensity = 'smooth';
  aVertPrevSign = 0; aVertRunMs = 0;
  aHorizPrevSign = 0; aHorizRunMs = 0;

  const roadY = height * 0.78;
  const roadH = height - roadY; // extend road to the bottom
  const doorY = 70;
  const baseTopY = doorY; // paths reach up to the doors
  const track3TopY = doorY; // right path starts at top like others
  const baseLen = roadY - baseTopY;
  const longLen = roadY - track3TopY;
  aStripW = (width - 2 * aMargin) / 3;
  aBaseTopY = baseTopY;
  aTrack3TopY = track3TopY;
  aRoadY = roadY;
  aPathWidth = constrain(aStripW * 0.26 * 1.5, 45, 140);

  // Bottom road/platform spanning the full width
  aBridge.h = roadH;
  aBridge.y = roadY; // top edge of the road
  aBridge.x1 = 0;
  aBridge.x2 = width;

  // Spawn player centered on the wide road
  player.x = width * 0.5;
  player.y = roadY + roadH * 0.6;

  aPathBounds = [];

  // Three paths
  aPathBounds.push({ x1: aMargin + 20, x2: aMargin + aStripW - 20, y1: baseTopY, y2: roadY, doorX: aMargin + aStripW * 0.5, doorY: doorY, length: baseLen });
  aPathBounds.push({ x1: aMargin + aStripW + 20, x2: aMargin + 2 * aStripW - 20, y1: baseTopY, y2: roadY, doorX: aMargin + aStripW * 1.5, doorY: doorY, length: baseLen });
  // Door for Track 3 at the top end of the path
  const door3X = pathCenterX(2, 0, 0, 0, 0);
  const door3Y = track3TopY;
  aPathBounds.push({ x1: aMargin + 2 * aStripW + 20, x2: aMargin + 3 * aStripW - 20, y1: track3TopY, y2: roadY, doorX: door3X, doorY: door3Y, length: longLen });

  // Precompute decorative points for the safe left path (Track 1)
  aLeftDecor = [];
  function pathCenterAt(pathIndex, t){
    const topY = (pathIndex === 2) ? aTrack3TopY : aBaseTopY;
    const bottomY = aRoadY;
    const cx = pathCenterX(pathIndex, 0, 0, t, 0);
    const w = pathWidth(pathIndex);
    const y = lerp(topY, bottomY, t);
    return { cx, y, w };
  }
  // Grass and flowers along the safe left path
  const grassSamples = 40;
  for (let i=0;i<grassSamples;i++){
    const t = random(0.08, 0.95);
    const p = pathCenterAt(0, t);
    const offset = random(-p.w*0.4, p.w*0.4);
    const gx = p.cx + offset;
    const gy = p.y + random(-4, 4);
    aLeftDecor.push({ x: gx, y: gy, grass: true, h: random(10, 18) });
  }
  const flowerSamples = 16;
  const palette = [
    [240,120,140],[250,180,90],[150,200,110],[120,180,230],[220,170,240]
  ];
  for (let i=0;i<flowerSamples;i++){
    const t = random(0.12, 0.9);
    const p = pathCenterAt(0, t);
    const offset = random(-p.w*0.36, p.w*0.36);
    const fx = p.cx + offset;
    const fy = p.y + random(-3, 3);
    const petal = random(palette);
    aLeftDecor.push({ x: fx, y: fy, flower: true, color: petal, size: random(6, 11) });
  }

  // Coins — strictly on paths: exactly 2 on center (track 2), 4–6 on right (track 3)
  aCoins = [];
  let C = aPathBounds[1], R = aPathBounds[2];

  function sampleOnPath(pathIndex){
    const t = random(0.05, 0.95);
    const cx = pathCenterX(pathIndex, 0, 0, t, 0);
    const w = pathWidth(pathIndex);
    const topY = (pathIndex === 2) ? aTrack3TopY : aBaseTopY;
    const bottomY = aRoadY;
    const y = lerp(topY, bottomY, t);
    const dx = random(-w*0.5+6, w*0.5-6);
    return { x: cx + dx, y: y };
  }
  // Track 2 = exactly 3 coins; Track 3 = exactly 5 coins
  const t2Count = 3;
  for (let i=0;i<t2Count;i++){ const p = sampleOnPath(1); aCoins.push({ x:p.x, y:p.y, got:false }); }
  const t3Count = 5;
  for (let i=0;i<t3Count;i++){ const p = sampleOnPath(2); aCoins.push({ x:p.x, y:p.y, got:false }); }

  // Static details on Track 2: only one crack (stone removed)
  // Build a helper to capture width and tangent angle for rendering
  function sampleDetailOnPath2(){
    const stripW = aStripW;
    const x1 = aMargin + 1 * stripW; // pathIndex 1
    let widthFactor = 0.70, lengthFactor = 1.1, curveAmtBase = stripW*0.14;
    const innerW = (stripW - 40) * widthFactor;
    const innerX = x1 + (stripW - innerW) / 2;
    const t = random(0.12, 0.88);
    const cx = innerX + innerW*0.5 + sin(t*PI) * curveAmtBase;
    const w = innerW * lerp(1.0, 0.45, t);
    const topY = baseTopY;
    const bottomY = roadY;
    const y = lerp(topY, bottomY, t);
    // approximate tangent using small delta t
    const dt = 0.01;
    const cx2 = innerX + innerW*0.5 + sin((t+dt)*PI) * curveAmtBase;
    const y2 = lerp(topY, bottomY, t+dt);
    const ang = atan2(y2 - y, cx2 - cx);
    return { x: cx, y: y, w: w, ang: ang };
  }
  aTrack2Stone = null; // removed per request
  aTrack2Crack = null; // no cracks on middle path
  aTrack2Crack2 = null;
  // Extra pit position on Track 2
  aTrack2Pit = null;
}

// Soft, drifting fog over the middle path (Room A)
function drawMiddlePathFog(baseTopY, roadY){
  if (!aFogLayer) return;
  aFogLayer.clear();
  aFogLayer.blendMode(SCREEN);
  aFogLayer.noStroke();

  const pathIndex = 1; // middle
  const stripW = aStripW;
  const x1 = aMargin + pathIndex * stripW;
  const widthFactor = 0.70;
  const curveAmtBase = stripW * 0.14;
  const innerW = (stripW - 40) * widthFactor;
  const innerX = x1 + (stripW - innerW) / 2;
  const segs = 15; // ~half density rows
  const tTime = millis() * (0.00025/3); // slower drift
  const fogTop = max(0, baseTopY - 50); // stretch fog upward to cover the door

  for (let s = 0; s < segs; s++){
    const t = (s + 0.5) / segs;
    const cx = innerX + innerW * 0.5 + sin(t * PI) * curveAmtBase;
    const w = innerW * lerp(1.0, 0.45, t) * 1.05; // cover full width with slight margin
    const yBase = lerp(fogTop, roadY, t);
    for (let k = 0; k < 3; k++){
      const rowPhase = k - 1;
      const yRow = yBase + sin(tTime * 1.1 + t * 5 + rowPhase * 0.6) * 6;
      for (let xOff = -w * 0.55; xOff <= w * 0.55; xOff += 12){
        const gx = cx + xOff + sin(tTime * 1.6 + xOff * 0.15) * 3;
        const gy = yRow + sin(tTime * 0.9 + xOff * 0.12) * 3;
        const n = noise(gx * 0.012, (gy + tTime * 260) * 0.012, aFogZ);
        const alpha = map(n, 0.35, 0.82, 0, 115, true);
        if (alpha < 2) continue;
        const sz = 22 + 20 * n;
        aFogLayer.fill(210, 220, 240, alpha);
        aFogLayer.ellipse(gx, gy, sz, sz * 0.82);
      }
    }
  }
  aFogZ += 0.001;
  aFogLayer.blendMode(BLEND);
  image(aFogLayer, 0, 0);
}

function roomA() {
  // Static walls; paths remain static based on aMargin/aStripW
  let wallMargin = aMargin;
  const doorY = 60;
  const roadY = aBridge.y;
  const baseTopY = aBaseTopY;
  const track3TopY = aTrack3TopY;
  // Instruction overlay timing only (actual drawing done on top layer)
  if (aShowInstr && millis() - aInstrShownAt >= 5500) aShowInstr = false;

  // Walls no longer move inward

  // Render filled paths with consistent width
  let stripW = aStripW;
  for (let i = 0; i < 3; i++) {
    const topY = (i === 2) ? track3TopY : baseTopY;
    const bottomY = roadY;
    const segs = (i === 2) ? 90 : 80;
    const leftPts = [];
    const rightPts = [];
    for (let s = 0; s <= segs; s++) {
      let t = s / segs;
      let cx = pathCenterX(i, 0, 0, t, 0);
      let y = lerp(topY, bottomY, t);
      let w = aPathWidth;
      leftPts.push({ x: cx - w * 0.5, y });
      rightPts.push({ x: cx + w * 0.5, y });
    }
    // colors per path
    if (i === 0) {
      fill(110, 180, 110, 230);
      stroke(70, 140, 80, 220);
    } else if (i === 1) {
      fill(70, 90, 120, 210);
      stroke(50, 70, 100, 220);
    } else {
      fill(90, 90, 100, 220);
      stroke(60, 60, 70, 220);
    }
    strokeWeight(2);
    beginShape();
    leftPts.forEach(p=>vertex(p.x, p.y));
    rightPts.reverse().forEach(p=>vertex(p.x, p.y));
    endShape(CLOSE);
  }
  noStroke();

  // Safe left path decor: grass and flowers
  if (aLeftDecor && aLeftDecor.length){
    for (let i=0;i<aLeftDecor.length;i++){
      const d = aLeftDecor[i];
      if (d.flower){
        push();
        stroke(70, 120, 70, 200);
        strokeWeight(1.2);
        line(d.x, d.y, d.x, d.y - (d.size || 8));
        noStroke();
        const c = d.color || [240, 160, 140];
        fill(c[0], c[1], c[2], 210);
        const r = d.size || 8;
        ellipse(d.x, d.y - (d.size || 8), r, r*0.8);
        pop();
        continue;
      }
      if (d.grass){
        push();
        stroke(80, 150, 90, 220);
        strokeWeight(1.6);
        const h = d.h || 12;
        line(d.x, d.y, d.x - 2, d.y - h);
        line(d.x, d.y, d.x + 2, d.y - h*0.9);
        line(d.x, d.y, d.x, d.y - h*1.05);
        pop();
        continue;
      }
    }
  }

  // movement: allow freely below path start; else restrict to path surfaces with small slack
  const prevX = player.x, prevY = player.y;
  player.update();
  // --- Room A behavior tracking (direction changes and idle time) ---
  updateRoomAMovementMetrics();
  // ✅ Collection and sending of metrics when entering any door
if (!aDataSent && aLockedPath !== -1 && player.y < 80) {
  const data = {
    FirstPathChoice: aChoice ?? (["left", "middle", "right"][aLockedPath]),
    DecisionTime: ((millis() - (aFirstMoveAt || aStartTime)) / 1000).toFixed(2),
    CoinsCollected: aCoins.filter(c => c.got).length,
    Timestamp: new Date().toISOString(),
    ChangedDirectionCount: aChangedDirectionCount,
    IdleTime: (aIdleTime + (aIdleSince? (millis()-aIdleSince)/1000.0 : 0)).toFixed(2),
    WallStartChangeBehavior: '',
    PlayerID: playerId || ''
  };
  console.log("Room A Data →", data); // 👈 debug log
  // defer sending until final telemetry to avoid partial rows
  // sendDataToSheet(data);
  aDataSent = true;
}
  function pointOnBridge(px, py){
    return (px >= aBridge.x1 && px <= aBridge.x2 && py >= aBridge.y && py <= aBridge.y + aBridge.h);
  }
  function pointInQuad(px, py, ax,ay, bx,by, cx,cy, dx,dy){
    // split quad into two triangles and compare areas
    function area(x1,y1,x2,y2,x3,y3){ return abs((x1*(y2-y3)+x2*(y3-y1)+x3*(y1-y2))/2); }
    const A = area(ax,ay, bx,by, cx,cy) + area(ax,ay, cx,cy, dx,dy);
    const A1 = area(px,py, ax,ay, bx,by);
    const A2 = area(px,py, bx,by, cx,cy);
    const A3 = area(px,py, cx,cy, dx,dy);
    const A4 = area(px,py, dx,dy, ax,ay);
    return abs((A1+A2+A3+A4) - A) < 0.5;
  }
  function pointOnAnyPath(px, py, slack){
    for (let i=0;i<3;i++){
      let segs = (i===2)?60:50;
      for (let s=0;s<segs;s++){
        let t0 = s/segs, t1 = (s+1)/segs;
        let ccx0 = pathCenterX(i, 0, 0, t0, 0);
        let ccx1 = pathCenterX(i, 0, 0, t1, 0);
        let ww0 = pathWidth(i) + (slack||0);
        let ww1 = pathWidth(i) + (slack||0);
        const topY = (i===2)? aTrack3TopY : aBaseTopY;
        const bottomY = aRoadY;
        let yy0 = lerp(topY, bottomY, t0);
        let yy1 = lerp(topY, bottomY, t1);
        if (pointInQuad(px,py, ccx0-ww0*0.5,yy0, ccx0+ww0*0.5,yy0, ccx1+ww1*0.5,yy1, ccx1-ww1*0.5,yy1)) return true;
      }
    }
    return false;
  }
  // Free movement only in lower area (bottom road zone); otherwise stay on paths
  const freeZoneY = aRoadY - 4; // allow roaming at/below bottom of paths
  const onAnyPath = pointOnAnyPath(player.x, player.y, aPathWidth * 0.2);
  if (!(player.y >= freeZoneY || pointOnBridge(player.x, player.y) || onAnyPath)){
    player.x = prevX; player.y = prevY;
  }

  let leftW = aMargin;
  let rightW = aMargin;
  player.x = constrain(player.x, leftW + 20, width - rightW - 20);

  if (!aFreeWalk) {
    if (aLockedPath === -1) {
      for (let i = 0; i < 3; i++) {
        const py1 = (i === 2) ? track3TopY : baseTopY;
        const py2 = roadY;
        if (player.y > py1 && player.y < py2) {
          const tY = constrain((player.y - py1) / (py2 - py1), 0, 1);
          const cx = pathCenterX(i, 0, 0, tY, 0);
          const halfW = aPathWidth * 0.5;
          if (abs(player.x - cx) < halfW) {
            aLockedPath = i;
            if (aFirstLockTime === null) {
              aFirstLockTime = millis();
              aOutsideDuration = (aFirstLockTime - aStartTime) / 1000;
            }
            break;
          }
        }
      }
    } else {
      const py1 = (aLockedPath === 2) ? track3TopY : baseTopY;
      const py2 = roadY;
      if (player.y > py1 && player.y < py2) {
        const tY = constrain((player.y - py1) / (py2 - py1), 0, 1);
        const cx = pathCenterX(aLockedPath, 0, 0, tY, 0);
        const halfW = aPathWidth * 0.5;
        player.x = constrain(player.x, cx - halfW + 6, cx + halfW - 6);
      }
    }
  }
  // Room A coins
  drawAndCollectCoins(aCoins);

  // Track 2 details: stone and crack
  if (aTrack2Stone){
    // Scale 8x, but clamp to track width to stay within boundaries and block path
    const maxW = max(12, aTrack2Stone.w - 8);
    const stoneW = min(14*8, maxW);
    const stoneH = min(10*8, maxW*0.75);
    push();
    noStroke(); fill(110,105,100, 240);
    ellipse(aTrack2Stone.x, aTrack2Stone.y, stoneW, stoneH);
    // subtle highlight
    noFill(); stroke(240,240,250,80);
    ellipse(aTrack2Stone.x - stoneW*0.12, aTrack2Stone.y - stoneH*0.12, stoneW*0.35, stoneH*0.28);
    pop();
  }
  if (aTrack2Crack){
    // Scale 3x, clamp to width; draw zig-zag crack across path width without exceeding edges
    const baseHalf = 12; // original ~12px half-length
    const maxHalf = max(8, (aTrack2Crack.w - 10)/2);
    const k = min(3, maxHalf / baseHalf);
    push();
    translate(aTrack2Crack.x, aTrack2Crack.y);
    rotate(aTrack2Crack.ang + HALF_PI); // across width
    stroke(40,40,50, 200); strokeWeight(2.5*k);
    noFill();
    beginShape();
    vertex(-10*k, 0);
    vertex(-4*k, 2*k);
    vertex(0, -1*k);
    vertex(6*k, 1*k);
    vertex(12*k, -2*k);
    endShape();
    pop();
  }
  // Second crack and extra pit on Track 2 (render every frame)
  if (aTrack2Crack2){
    const baseHalf = 12;
    const maxHalf = max(8, (aTrack2Crack2.w - 10)/2);
    const k = min(3, maxHalf / baseHalf);
    push();
    translate(aTrack2Crack2.x, aTrack2Crack2.y);
    rotate(aTrack2Crack2.ang + HALF_PI);
    stroke(38,38,48, 200); strokeWeight(2.5*k);
    noFill();
    beginShape();
    vertex(-12*k, 0);
    vertex(-6*k, -2*k);
    vertex(0, 1*k);
    vertex(5*k, -2*k);
    vertex(11*k, 2*k);
    endShape();
    pop();
  }
  if (aTrack2Pit){
    push(); noStroke(); fill(35,35,45, 210);
    ellipse(aTrack2Pit.x, aTrack2Pit.y, 24, 14);
    pop();
  }

  // doors at the top; all equal size now
  let doors = [
    pathCenterX(0,0,0,0,0),
    pathCenterX(1,0,0,0,0),
    (aPathBounds[2] ? aPathBounds[2].doorX : pathCenterX(2,0,0,0,0))
  ];
  // doors tight to top edge, protruding from paths
  const doorYTop = 70;
  drawDoor(doors[0], doorYTop, 'wood');
  drawDoor(doors[1], doorYTop, 'wood');
  // right door at top end of its path
  drawDoor(doors[2], (aPathBounds[2] ? aPathBounds[2].doorY : doorYTop), 'wood');

  // draw player above fog
  player.draw();

  // Door collision triggers transition only when touching the door area
  const collideR = 36;
  const doorCenters = [
    {x: doors[0], y: doorYTop, name: 'lit'},
    {x: doors[1], y: doorYTop, name: 'foggy'},
    {x: doors[2], y: (aPathBounds[2] ? aPathBounds[2].doorY : doorYTop), name: 'upward'}
  ];

  // Rain + lightning on middle path
  {
    const nowT = millis();
    if (nowT - lastThunderAt > 3000) {
      lastThunderAt = nowT;
      thunderFlash = 1;
    }
    const topY = baseTopY;
    const bottomY = roadY;
    const segsRain = 50;
    stroke(200, 220, 240, 150);
    strokeWeight(2);
    for (let s = 0; s < segsRain; s++) {
      let t = (s + 0.5) / segsRain;
      let cx = pathCenterX(1, 0, 0, t, 0);
      let y = lerp(topY, bottomY, t);
      let spread = aPathWidth * 0.5;
      for (let k = 0; k < 3; k++) {
        let rx = cx + random(-spread, spread);
        let ry = y + random(-10, 10);
        line(rx, ry - 6, rx, ry + 6);
      }
    }
    noStroke();
    if (thunderFlash > 0) {
      thunderFlash = max(0, thunderFlash - 0.06);
      const intensity = thunderFlash;
      push();
      fill(220, 235, 255, 90 * intensity);
      const segsFlash = 60;
      beginShape();
      for (let s = 0; s <= segsFlash; s++) {
        let t = s / segsFlash;
        let cx = pathCenterX(1, 0, 0, t, 0);
        let y = lerp(topY, bottomY, t);
        vertex(cx - aPathWidth * 0.5, y);
      }
      for (let s = segsFlash; s >= 0; s--) {
        let t = s / segsFlash;
        let cx = pathCenterX(1, 0, 0, t, 0);
        let y = lerp(topY, bottomY, t);
        vertex(cx + aPathWidth * 0.5, y);
      }
      endShape(CLOSE);

      stroke(250, 252, 255, 230 * intensity);
      strokeWeight(3);
      noFill();
      let boltT = 0.3;
      let boltCx = pathCenterX(1, 0, 0, boltT, 0);
      let boltTopY = lerp(topY, bottomY, boltT) - 40;
      beginShape();
      vertex(boltCx, boltTopY);
      vertex(boltCx + random(-10, 6), boltTopY + 18);
      vertex(boltCx + random(-4, 12), boltTopY + 36);
      vertex(boltCx + random(-12, 4), boltTopY + 56);
      endShape();
      pop();
    }
  }
  for (let d of doorCenters){
    if (dist(player.x, player.y, d.x, d.y) < collideR){
      aChoice = d.name;
      logs.roomA = { choice: aChoice, timeToChoose: (millis()-aStartTime)/1000, waitedBeforePicking: aOutsideDuration, wallsStarted: 5.0 };
      console.log("Room A Log:", logs.roomA);
      // Auto-send to Sheet using exact column keys
      try{
        const payload = {
          FirstPathChoice: aChoice,
          DecisionTime: ((millis() - (aFirstMoveAt || aStartTime))/1000).toFixed(2),
          CoinsCollected: String(aCoins.filter(c=>c.got).length),
          Timestamp: new Date().toISOString(),
          ChangedDirectionCount: aChangedDirectionCount,
          IdleTime: (aIdleTime + (aIdleSince? (millis()-aIdleSince)/1000.0 : 0)).toFixed(2),
          WallStartChangeBehavior: '',
          PlayerID: playerId || ''
        };
        console.log("Room A Data →", payload);
        // defer sending until final telemetry to avoid partial rows
        // sendDataToSheet(payload);
      }catch(_){ }
      aDataSent = true;
      transitionToB();
      break;
    }
  }
}

// Shared movement metrics updater: Room A-specific walls/idle + global jitter & direction holds
function updateRoomAMovementMetrics(){
  const nowMS = millis();
  const vx = player.vx, vy = player.vy;
  const speed = Math.hypot(vx, vy);
  const idleThresh = 0.05;
  const dtSeg = (typeof deltaTime !== 'undefined'
    ? deltaTime
    : (aLastFrameMs != null ? (nowMS - aLastFrameMs) : 16.7));

  // --- RAW direction: for jitter calculation ---
  let rawDir = 'none';
  if (speed > idleThresh){
    const up = (vy < -idleThresh);
    const down = (vy > idleThresh);
    const left = (vx < -idleThresh);
    const right = (vx > idleThresh);
    if (up && !down && !left && !right) rawDir = 'up';
    else if (down && !up && !left && !right) rawDir = 'down';
    else if (left && !right && !up && !down) rawDir = 'left';
    else if (right && !left && !up && !down) rawDir = 'right';
    else if (up && left && !down && !right) rawDir = 'up-left';
    else if (up && right && !down && !left) rawDir = 'up-right';
    else if (down && left && !up && !right) rawDir = 'down-left';
    else if (down && right && !up && !left) rawDir = 'down-right';
  }

  // Jitter: count only deviation from main direction, not return
  const jitterThresholdMs = 150;
  const baseDir = aLastMoveDir;
  if (rawDir !== aLastRawDir) {
    const dtRaw = nowMS - aLastRawDirChangedAt;
    if (
      baseDir && baseDir !== 'none' &&
      aLastRawDir === baseDir &&      // were in main direction
      rawDir !== baseDir &&           // went into deviation
      dtRaw > 0 && dtRaw < jitterThresholdMs
    ) {
      let nearGoal = false;
      // coins in A
      if (Array.isArray(aCoins)) {
        for (let i=0;i<aCoins.length;i++){
          const c = aCoins[i];
          if (!c.got && dist(player.x, player.y, c.x, c.y) < 26){ nearGoal = true; break; }
        }
      }
      // coins in B
      if (!nearGoal && Array.isArray(bCoins)) {
        for (let i=0;i<bCoins.length;i++){
          const c = bCoins[i];
          if (!c.got && dist(player.x, player.y, c.x, c.y) < 26){ nearGoal = true; break; }
        }
      }
      // interaction zones in C
      if (!nearGoal && state === 'roomC'){
        if (dist(player.x, player.y, cButton.x, cButton.y) < cButton.r + 24) nearGoal = true;
        if (!cBalloon.popped && dist(player.x, player.y, cBalloon.x, cBalloon.y) < cBalloon.r + 24) nearGoal = true;
      }
      if (!nearGoal) aInputJitterCount++;
    }
    aLastRawDir = rawDir;
    aLastRawDirChangedAt = nowMS;
  }

  // --- Main direction (primaryDir) for significant course changes ---
  let dir = 'none';
  if (speed > idleThresh){
    const absX = Math.abs(vx);
    const absY = Math.abs(vy);
    const switchFactor = 1.5; // новая ось должна быть в 1.5 раза сильнее старой
    const prev = aLastMoveDir;
    const prevAxis =
      (prev === 'left' || prev === 'right') ? 'x' :
      (prev === 'up'   || prev === 'down')  ? 'y' : null;

    if (prevAxis === 'x'){
      // horizontal course: stay on X until vertical wins strongly
      if (absY > absX * switchFactor && absY > idleThresh){
        dir = (vy < 0 ? 'up' : 'down');
      } else if (absX > idleThresh){
        dir = (vx < 0 ? 'left' : 'right');
      }
    } else if (prevAxis === 'y'){
      // vertical course: symmetrical
      if (absX > absY * switchFactor && absX > idleThresh){
        dir = (vx < 0 ? 'left' : 'right');
      } else if (absY > idleThresh){
        dir = (vy < 0 ? 'up' : 'down');
      }
    } else {
      // no previous axis - choose dominant
      if (absX >= absY && absX > idleThresh){
        dir = (vx < 0 ? 'left' : 'right');
      } else if (absY > idleThresh){
        dir = (vy < 0 ? 'up' : 'down');
      }
    }
  }

  // Room A original metrics: first movement and wall schedule (using movement fact, not specific dir)
  if (!aHasMoved && speed > idleThresh) {
    aHasMoved = true;
    aFirstMoveAt = nowMS;
    aWallsCloseAt = null;
  }
  if (dir !== 'none') aLastDir = dir;
  // Average phase length for AvgDirectionHoldMs
  if (dir !== aLastMoveDir) {
    const dtDir = nowMS - aLastMoveDirChangedAt;
    if (aLastMoveDir !== 'none' && dtDir > 0) {
      aDirHoldTotalMs += dtDir;
      aDirHoldPhases++;
      aAvgDirectionHoldMs = aDirHoldPhases > 0 ? (aDirHoldTotalMs / aDirHoldPhases) : 0;
    }
    aLastMoveDir = dir;
    aLastMoveDirChangedAt = nowMS;
  }

  // --- Per-axis trend for SignificantDirectionChanges ---
  // Count only when the corresponding axis dominates (1.5 times stronger than the second),
  // so that "right -> up" turns are not considered a course change along the axis.
  const absX = Math.abs(vx);
  const absY = Math.abs(vy);
  const trendFactor = 1.5;

  let significantAdded = false;

  // Vertical axis (up/down)
  let vertSign = 0;
  const vertDominant = absY > idleThresh && absY >= absX * trendFactor;
  if (vertDominant) {
    vertSign = (vy < 0 ? -1 : 1);
  }
  if (vertSign !== 0) {
    if (aVertPrevSign === 0 || aVertPrevSign === vertSign) {
      aVertRunMs += dtSeg;
      aVertPrevSign = vertSign;
    } else if (vertSign === -aVertPrevSign) {
      // vertical direction change after long run
      if (!significantAdded && aVertRunMs >= 2000) {
        aSignificantDirectionChanges++;
        significantAdded = true;
      }
      aVertPrevSign = vertSign;
      aVertRunMs = dtSeg;
    }
  }

  // Horizontal axis (left/right)
  let horizSign = 0;
  const horizDominant = absX > idleThresh && absX >= absY * trendFactor;
  if (horizDominant) {
    horizSign = (vx < 0 ? -1 : 1);
  }
  if (horizSign !== 0) {
    if (aHorizPrevSign === 0 || aHorizPrevSign === horizSign) {
      aHorizRunMs += dtSeg;
      aHorizPrevSign = horizSign;
    } else if (horizSign === -aHorizPrevSign) {
      if (!significantAdded && aHorizRunMs >= 2000) {
        aSignificantDirectionChanges++;
        significantAdded = true;
      }
      aHorizPrevSign = horizSign;
      aHorizRunMs = dtSeg;
    }
  }

  // Idle time accumulation (historically Room A, now game-wide)
  if (dir === 'none'){
    if (aHasMoved && aIdleSince === null) aIdleSince = nowMS;
  } else if (aIdleSince !== null){
    aIdleTime += (nowMS - aIdleSince) / 1000.0;
    aIdleSince = null;
  }
  aLastFrameMs = nowMS;
}

function transitionToB(){
  // finalize Room A duration when leaving to Room B
  if (roomAEnteredAt) {
    roomADurationSec = (millis() - roomAEnteredAt) / 1000.0;
    roomAEnteredAt = 0;
  }
  roomBEnteredAt = millis();
  fading = true; state = "roomB";
  initRoomB();
}

// ROOM B — Pattern or Kindness
function initRoomB(){
  cellW = width / gridCols; cellH = (height-140) / gridRows;
  // NPC at top-right, waving
  bNPC.x = width - 60; bNPC.y = 100;
  // Doors: entrance ~8th tile from left at bottom, exit aligned on top at same column
  const enterGX = 7; // 0-indexed: 8th tile from left
  const enterX = 20 + enterGX*cellW + cellW*0.5;
  const exitGX = enterGX; // top door strictly opposite the bottom one
  const exitX = 20 + exitGX*cellW + cellW*0.5;
  bEnterDoor.x = enterX; bEnterDoor.y = height - 36;
  bExitDoor.x = exitX; bExitDoor.y = 68;
  // Build LONG detour path: down-left-up and back to door column
  bPattern = makeDetourPath(enterGX, gridRows-1, exitGX, 0);
  // player spawn near entrance door
  player.x = bEnterDoor.x; player.y = height - 80;
  bPatternShownAt = millis();
  bLitMap = Array.from({length:gridRows}, ()=> Array(gridCols).fill(false));
  bLitColors = {};
  bFollowed = false; bSkipped = false; bPushed = false; bNPC.emojiT = 0;
  bAgreePoints = 0; bEfficiencyPoints = 0;
  bChoiceShownAt = null;
  bExitLocked = true;
  bLockAnim = 0;
  bKeyEventTriggered = false;
  bKeyPromptShownAt = 0;
  bKeyApproachTimeMs = 0;
  bKeyDistanceStopped = 0;
  bKeyChoice = '';
  bKeyResponseTimeMs = 0;
  bKeyState = 'npc';
  bKeyPos = { x: bExitDoor.x - cellW * 0.6, y: bExitDoor.y - cellH * 0.2 };
  bKeyDropAvailableAt = 0;
  if (bKeyChoiceButtons){
    bKeyChoiceButtons.forEach(btn=>btn && btn.remove());
    bKeyChoiceButtons = null;
  }
  // Place NPC near exit door with key
  bNPC.x = bExitDoor.x - cellW * 1.1;
  bNPC.y = bExitDoor.y + cellH * 0.4;
  bNPC.state = 'blocking'; bNPC.blocking = false;
  bNPC.moveStart = bNPC.moveEnd = 0; bNPC.pushT = 0; bNPC.waving = true;
  bNPC.mood = 'neutral'; bNPC.moodTimer = 0; bNPC.shakeTimer = 0; bNPC.lineText=''; bNPC.lineTextT=0;
  tilesSteppedOnTrail = 0;
  bConflictChoiceAt = 0; bConflictStartPos = {x:0,y:0}; bConflictDistanceTraveled = 0; bConflictWalkStartedAt = 0; bConflictHesitationMs = 0; bConflictProximityAtPickup = 0;
  bCoopChoiceAt = 0; bCoopDoorOpenAt = 0; bPlayerStayedNearNPCDuringCoop = true; bDistanceKeptBeforeChoice = 0;
  bPrevPlayerPosB = null;
  bKeyThrow = { active:false, start:{x:0,y:0}, end:{x:0,y:0}, startT:0, dur:600 };
  // Coins only along the path: every 3rd tile
  bCoins = [];
  for (let i=1; i<bPattern.length; i+=3){
    bCoins.push({ x: bPattern[i].x, y: bPattern[i].y, got:false });
  }
  // show Room B instructions
  bShowInstr = true;
  bInstrShownAt = millis();
}

function makeDetourPath(sx, sy, tx, ty){
  // Guaranteed to touch the leftmost column (gx=0),
  // then go up along it and closer to the top return to the exit column.
  const clampCol = (c)=>constrain(c, 0, gridCols-1);
  let path = [];
  let x=sx, y=sy;
  const nearTopY = max(1, floor(gridRows*0.25));
  const pushUnique = (gx,gy)=>{ if (!path.find(p=>p.gx===gx && p.gy===gy)) path.push({gx,gy}); };
  pushUnique(x,y);

  // Phase A: go left to gx=0 on the current row
  while (x > 0){ x = clampCol(x-1); pushUnique(x,y); }

  // Phase B: go up along the left edge to nearTopY
  while (y > nearTopY){ y = constrain(y-1, 0, gridRows-1); pushUnique(x,y); }

  // Phase C: go to target (tx,ty), keeping smoothness
  let safety = 4000;
  while (safety-->0){
    if (x===tx && y===ty) break;
    let dx = 0, dy = 0;
    if (x < tx) dx = 1; else if (x > tx) dx = -1;
    if (y > ty) dy = -1; else if (y < ty) dy = 1;
    // a bit of random, but with Y priority upwards
    if (random()<0.6 && dy!==0){ y = constrain(y+dy, 0, gridRows-1); }
    else if (dx!==0){ x = clampCol(x+dx); }
    else { y = constrain(y+dy, 0, gridRows-1); }
    pushUnique(x,y);
  }
  if (!(path[path.length-1].gx===tx && path[path.length-1].gy===ty)) pushUnique(tx,ty);
  return path.map(p=>({ x: 20 + p.gx*cellW + cellW*0.5, y: 80 + p.gy*cellH + cellH*0.5, gx:p.gx, gy:p.gy }));
}

function updateNPCStateB(){
  const now = millis ? millis() : Date.now();
  // mood decay
  if (bNPC.moodTimer > 0){
    bNPC.moodTimer--;
    if (bNPC.moodTimer <= 0) bNPC.mood = 'neutral';
  }
  if (bNPC.shakeTimer > 0) bNPC.shakeTimer--;
  if (bNPC.state === 'movingAside'){
    const t = constrain((now - bNPC.moveStart) / max(1, (bNPC.moveEnd - bNPC.moveStart)), 0, 1);
    bNPC.x = lerp(bNPC.startX, bNPC.targetX, t);
    bNPC.y = lerp(bNPC.startY, bNPC.targetY, t);
    if (t >= 1){
      bNPC.state = 'aside';
      bNPC.blocking = false;
      bNPC.emojiT = 60;
      bNPC.waving = false;
    }
  } else if (bNPC.state === 'pushed' && bNPC.pushT > 0){
    bNPC.x += bNPC.pushVX;
    bNPC.y += bNPC.pushVY;
    bNPC.pushVX *= 0.9;
    bNPC.pushVY *= 0.9;
    bNPC.pushT--;
    if (bNPC.pushT <= 0){
      bNPC.blocking = false;
    }
  } else if (bNPC.state === 'movingToDoor'){
    const t = constrain((now - bNPC.moveStart) / max(1, (bNPC.moveEnd - bNPC.moveStart)), 0, 1);
    bNPC.x = lerp(bNPC.startX, bNPC.targetX, t);
    bNPC.y = lerp(bNPC.startY, bNPC.targetY, t);
    if (t >= 1){
      bNPC.state = 'aside';
      bNPC.blocking = false;
      bNPC.waving = false;
      if (!bCoopDoorOpenAt) bCoopDoorOpenAt = now;
    }
  }
}

function isNearNPC(th){
  return dist(player.x, player.y, bNPC.x, bNPC.y) < th;
}

function triggerFriendlyNPC(){
  // disabled legacy high-five interaction to avoid conflicts with new NPC flow
  return;
}

function triggerAggressiveNPC(){
  // disabled legacy push interaction to avoid conflicts with new NPC flow
  return;
}

function roomB(){
  // Flat-colored grid floor (no glows/shines)
  noStroke();
  fill(130, 120, 110, 220);
  for (let gy=0; gy<gridRows; gy++){
    for (let gx=0; gx<gridCols; gx++){
      let cx = 20 + gx*cellW + cellW*0.5;
      let cy = 80 + gy*cellH + cellH*0.5;
      rect(cx-cellW*0.48, cy-cellH*0.48, cellW*0.96, cellH*0.96, 6);
    }
  }

  // Distinct path style (wooden trail)
  for (let i=0;i<bPattern.length;i++){
    let p = bPattern[i];
    // wooden plank look
    fill(150, 110, 70, 230);
    rect(p.x-cellW*0.42, p.y-cellH*0.35, cellW*0.84, cellH*0.70, 6);
    fill(120, 85, 50, 180);
    rect(p.x-cellW*0.42, p.y-1, cellW*0.84, 2, 0); // small seam
  }

  updateNPCStateB();

  // NPC and key interaction
  drawNPC();
  handleKeyNPCInteraction();
  drawKeyState();

  // doors
  drawDoor(bEnterDoor.x, bEnterDoor.y, 'wood');
  drawDoor(bExitDoor.x, bExitDoor.y, 'wood');
  // lock overlay on exit
  if (bExitLocked){
    drawLockIcon(bExitDoor.x, bExitDoor.y);
  } else if (bLockAnim > 0){
    bLockAnim = max(0, bLockAnim - 0.04);
    push();
    translate(bExitDoor.x, bExitDoor.y);
    scale(1 + 0.4 * bLockAnim);
    drawLockIcon(0, 0, 80 * bLockAnim);
    pop();
  }

  // player and interactions
  const prevX = player.x, prevY = player.y;
  player.update();
  updateRoomAMovementMetrics();
  // simple collision with blocking NPC
  if (bNPC.blocking && dist(player.x, player.y, bNPC.x, bNPC.y) < min(cellW, cellH)*0.42){
    player.x = prevX; player.y = prevY;
  }
  // track conflict/cooperation movement metrics
  if (bConflictChoiceAt){
    if (!bConflictWalkStartedAt && dist(player.x, player.y, bConflictStartPos.x, bConflictStartPos.y) > 2){
      bConflictWalkStartedAt = millis();
      bConflictHesitationMs = bConflictWalkStartedAt - bConflictChoiceAt;
    }
    if (bPrevPlayerPosB){
      bConflictDistanceTraveled += dist(player.x, player.y, bPrevPlayerPosB.x, bPrevPlayerPosB.y);
    }
  }
  if (bCoopChoiceAt && !bCoopDoorOpenAt){
    const near = dist(player.x, player.y, bNPC.x, bNPC.y) < cellW * 2.2;
    bPlayerStayedNearNPCDuringCoop = bPlayerStayedNearNPCDuringCoop && near;
  }
  bPrevPlayerPosB = { x: player.x, y: player.y };
  player.draw();

  // Room B coins: only on the path (pre-populated)
  drawAndCollectCoins(bCoins);

  // Mark tiles visited with wider detection and assign pastel shimmer colors
  for (let i=0;i<bPattern.length;i++){
    let p = bPattern[i];
    if (dist(player.x, player.y, p.x, p.y) < min(cellW,cellH)*0.6){
      if (!bLitMap[p.gy][p.gx]) {
        tilesSteppedOnTrail++;
        const key = `${p.gx},${p.gy}`;
        const pastelPalette = [
          [190,220,255],[210,200,245],[200,240,210],
          [240,215,200],[205,230,240],[220,255,220]
        ];
        const pick = pastelPalette[floor(random(pastelPalette.length))];
        bLitColors[key] = { c: pick, phase: random(TWO_PI) };
      }
      bLitMap[p.gy][p.gx] = true;
    }
  }
  // Visualize lit tiles with pastel shimmer
  for (let i=0;i<bPattern.length;i++){
    let p = bPattern[i];
    if (bLitMap[p.gy][p.gx]){
      const key = `${p.gx},${p.gy}`;
      const meta = bLitColors[key] || { c:[190,220,255], phase:0 };
      const pulse = 0.5 + 0.5 * sin(frameCount * 0.15 + meta.phase);
      const alpha = 110 + 80 * pulse;
      fill(meta.c[0], meta.c[1], meta.c[2], alpha);
      rect(p.x-cellW*0.50, p.y-cellH*0.44, cellW*1.0, cellH*0.88, 10);
    }
  }
  let litCount = 0; for (let i=0;i<bPattern.length;i++){ if (bLitMap[bPattern[i].gy][bPattern[i].gx]) litCount++; }
  bFollowed = litCount >= floor(bPattern.length*0.8);

  // door end
  if (!bExitLocked && dist(player.x, player.y, bExitDoor.x, bExitDoor.y) < 40){
    bSkipped = !bFollowed;
    const existing = logs.roomB || {};
    const coopMetrics = (bCoopChoiceAt ? {
      cooperation_choice_flag: 1,
      time_to_door_after_cooperation: bCoopDoorOpenAt ? (bCoopDoorOpenAt - bCoopChoiceAt) : 0,
      willingness_to_wait_for_NPC: bPlayerStayedNearNPCDuringCoop ? 1 : 0,
      distance_kept_from_NPC_before_choice: bDistanceKeptBeforeChoice || 0
    } : {});
    const conflictMetrics = (existing.conflict_choice_flag ? {
      conflict_choice_flag: existing.conflict_choice_flag,
      time_to_walk_for_key_ms: existing.time_to_walk_for_key_ms,
      distance_traveled_after_conflict: existing.distance_traveled_after_conflict,
      hesitation_before_walking_ms: existing.hesitation_before_walking_ms,
      proximity_to_NPC_after_conflict: existing.proximity_to_NPC_after_conflict
    } : {});
    logs.roomB = {
      ...existing,
      followedPattern: bFollowed,
      pushed: bPushed,
      agreeableness: bAgreePoints,
      efficiency: bEfficiencyPoints,
      skippedDirect: bSkipped,
      npcChoice: existing.npcChoice || '',
      decisionTime: existing.decisionTime || '',
      ...coopMetrics,
      ...conflictMetrics
    };
    console.log("Room B Log:", logs.roomB);
    transitionToC();
  }
}

function drawNPC(){
  push();
  let sx = 0, sy = 0;
  if (bNPC.shakeTimer > 0){
    sx = random(-2, 2);
    sy = random(-2, 2);
  }
  translate(bNPC.x + sx, bNPC.y + sy);
  // friendly blob
  let c = color(180,220,255, 200);
  if (bNPC.state === 'movingAside' || bNPC.state === 'aside') c = color(190, 235, 200, 200);
  if (bNPC.state === 'pushed') c = color(200, 180, 180, 190);
  if (bNPC.mood === 'angry') c = color(230, 120, 120, 220);
  if (bNPC.mood === 'calm') c = color(170, 230, 200, 220);
  fill(c); stroke(255,255,255,120); strokeWeight(2);
  ellipse(0,0, 34, 26);
  // legs
  stroke(230,240,255,160); strokeWeight(3);
  line(-8, 10, -8, 20);
  line(8, 10, 8, 20);
  // arms (left static, right waving)
  line(-16, 0, -6, -2);
  // waving hand
  push();
  translate(14, -6);
  rotate(bNPC.state==='blocking' ? sin(frameCount*0.2)*0.4 : 0);
  stroke(230,230,255,180); strokeWeight(4);
  line(0,0, 10, -6);
  pop();
  // eyes / mouth
  noStroke(); fill(30,40,60, 220);
  ellipse(-5,-3,4,4); ellipse(5,-3,4,4);
  if (bNPC.state === 'movingAside' || bNPC.state === 'aside'){
    stroke(30,40,60,200); strokeWeight(2); noFill();
    arc(0, 6, 12, 8, 0, PI);
  } else if (bNPC.state === 'pushed'){
    stroke(30,40,60,200); strokeWeight(2);
    line(-6,5,-2,9); line(-6,9,-2,5);
    line(2,5,6,9); line(2,9,6,5);
  }
  pop();

  // High five emoji burst
  if (bNPC.emojiT > 0){
    bNPC.emojiT--;
    push();
    textAlign(CENTER, CENTER); textSize(32);
    let t = bNPC.emojiT;
    let y = bNPC.y - 20 - (20 - min(20, t))*0.8;
    noStroke(); fill(255);
    text("🙌", bNPC.x, y);
    text("😊", bNPC.x-24, y+10);
    pop();
  }
  // line text
  if (bNPC.lineTextT > 0){
    bNPC.lineTextT--;
    push();
    textAlign(CENTER, CENTER);
    fill(255, 255, 255, 230);
    textSize(14);
    text(bNPC.lineText, 0, -38);
    pop();
    if (bNPC.lineTextT <= 0) bNPC.lineText = '';
  }
}

// Key NPC interaction (Room B)
function handleKeyNPCInteraction(){
  const proximity = min(cellW, cellH) * 0.9;
  const distToNPC = dist(player.x, player.y, bNPC.x, bNPC.y);
  if (!bKeyEventTriggered && distToNPC < proximity){
    bKeyEventTriggered = true;
    bKeyApproachTimeMs = millis() - (roomBEnteredAt || 0);
    bKeyDistanceStopped = distToNPC;
    bKeyPromptShownAt = millis();
    showKeyChoiceUI();
  }
}

function showKeyChoiceUI(){
  if (bKeyChoiceButtons){
    bKeyChoiceButtons.forEach(btn=>btn && btn.remove());
  }
  bKeyChoiceButtons = [];
  const container = createDiv('');
  container.parent('app');
  container.style('position','fixed');
  container.style('left','50%');
  container.style('top','10%');
  container.style('transform','translateX(-50%)');
  container.style('padding','22px 24px');
  container.style('background','rgba(18,22,30,0.94)');
  container.style('border','1px solid rgba(255,255,255,0.12)');
  container.style('border-radius','12px');
  container.style('color','#f8fafc');
  container.style('z-index','3000');
  container.style('width','420px');
  container.style('max-width','92vw');
  container.style('min-height','320px');
  container.style('box-shadow','0 18px 36px rgba(0,0,0,0.35)');
  container.style('display','flex');
  container.style('flex-direction','column');
  container.style('justify-content','center');
  container.style('gap','12px');
  container.style('text-align','center');
  const line = createP('“Hey… What do you want? This is my key. I don’t like people getting close.”');
  line.parent(container);
  line.style('margin','0 0 16px');
  line.style('font-size','16px');
  line.style('line-height','1.6');
  line.style('letter-spacing','0.01em');
  line.style('color','#e2e8f0');
  const btnA = createButton('Sorry for disturbing.');
  const btnB = createButton('You are rude.');
  [btnA, btnB].forEach((btn, idx)=>{
    btn.parent(container);
    btn.style('display','block');
    btn.style('width','100%');
    btn.style('margin','6px 0');
    btn.style('padding','12px 14px');
    btn.style('border-radius','8px');
    btn.style('border','1px solid rgba(255,255,255,0.12)');
    btn.style('background', idx===0 ? '#3b82f6' : '#f97316');
    btn.style('color','#fff');
    btn.style('font-weight','700');
    btn.style('font-size','15px');
    btn.style('box-shadow','0 8px 20px rgba(0,0,0,0.25)');
    btn.style('cursor','pointer');
    btn.mousePressed(()=>{
      bKeyChoice = (idx===0) ? 'Sorry' : 'Rude';
      bKeyResponseTimeMs = millis() - bKeyPromptShownAt;
      if (idx===0){
        bCoopChoiceAt = millis();
        bDistanceKeptBeforeChoice = dist(player.x, player.y, bNPC.x, bNPC.y);
        bNPC.mood = 'calm'; bNPC.moodTimer = 30; // ~0.5s
        bNPC.lineText = "Alright… I'll open it for you."; bNPC.lineTextT = 90;
        // NPC steps toward the door
        bNPC.state = 'movingToDoor';
        bNPC.blocking = false;
        bNPC.moveStart = millis();
        bNPC.moveEnd = bNPC.moveStart + 900;
        bNPC.startX = bNPC.x; bNPC.startY = bNPC.y;
        bNPC.targetX = constrain(bExitDoor.x - cellW * 0.8, 20 + cellW*0.5, width - 20 - cellW*0.5);
        bNPC.targetY = bExitDoor.y + cellH * 0.4;
        bExitLocked = false;
        bLockAnim = 1;
        bKeyState = 'taken';
      } else {
        bConflictChoiceAt = millis();
        bConflictStartPos = { x: player.x, y: player.y };
        bConflictDistanceTraveled = 0;
        bConflictWalkStartedAt = 0;
        bConflictHesitationMs = 0;
        bNPC.mood = 'angry'; bNPC.moodTimer = 60; bNPC.shakeTimer = 3;
        bNPC.lineText = "Fine. Take it yourself."; bNPC.lineTextT = 90;
        bKeyState = 'throwing';
        bKeyThrow.start = { x: bNPC.x + cellW * 0.25, y: bNPC.y - cellH * 0.15 };
        bKeyThrow.end = {
          x: constrain(bNPC.x + cellW * 4, 20 + cellW*0.5, width - 20 - cellW*0.5),
          y: constrain(bNPC.y + cellH * 4, 80 + cellH*0.5, height - 20)
        };
        bKeyThrow.startT = millis();
        bKeyThrow.dur = 700;
        bKeyThrow.active = true;
        bKeyDropAvailableAt = bKeyThrow.startT + bKeyThrow.dur;
      }
      bKeyChoiceButtons.forEach(el=>{ if (el) el.remove(); });
      bKeyChoiceButtons = null;
      container.remove();
    });
  });
  bKeyChoiceButtons.push(container, btnA, btnB);
}

function drawKeyState(){
  const drawKeyShape = (px, py, opts={})=>{
    const scaleK = opts.scale || 1;
    const tilt = opts.tilt || 0;
    push();
    translate(px, py);
    rotate(tilt);
    if (opts.shadow){
      noStroke(); fill(0,0,0,40);
      ellipse(cellW*0.08*scaleK, cellH*0.10*scaleK, cellW*0.42*scaleK, cellH*0.32*scaleK);
    }
    stroke(200, 160, 40, 230);
    strokeWeight(4 * scaleK);
    fill(245, 210, 70, 240);
    // bow with hole
    ellipse(0, 0, cellW*0.30*scaleK, cellH*0.26*scaleK);
    fill(130, 100, 30, 240);
    ellipse(0, 0, cellW*0.12*scaleK, cellH*0.12*scaleK);
    // stem
    strokeWeight(5 * scaleK);
    line(cellW*0.15*scaleK, 0, cellW*0.50*scaleK, 0);
    // teeth
    line(cellW*0.50*scaleK, 0, cellW*0.50*scaleK, cellH*0.14*scaleK);
    line(cellW*0.38*scaleK, 0, cellW*0.38*scaleK, -cellH*0.12*scaleK);
    line(cellW*0.44*scaleK, 0, cellW*0.44*scaleK, cellH*0.08*scaleK);
    pop();
  };
  // Key in hand
  if (bKeyState === 'npc'){
    bKeyPos.x = bNPC.x + cellW * 0.25;
    bKeyPos.y = bNPC.y - cellH * 0.15;
    drawKeyShape(bKeyPos.x, bKeyPos.y, { tilt: -0.25, scale: 1.05 });
  }
  // Key throwing animation
  if (bKeyState === 'throwing' && bKeyThrow.active){
    const t = millis() - bKeyThrow.startT;
    const p = constrain(t / max(1, bKeyThrow.dur), 0, 1);
    const ease = p < 0.5 ? 2*p*p : -1 + (4 - 2*p)*p; // ease in-out quad
    const px = lerp(bKeyThrow.start.x, bKeyThrow.end.x, ease);
    const py = lerp(bKeyThrow.start.y, bKeyThrow.end.y, ease) - sin(p*PI) * cellH * 1.2;
    drawKeyShape(px, py, { tilt: -0.1 + 0.2*sin(p*PI*1.2), scale: 1.05, shadow:true });
    if (p >= 1){
      bKeyThrow.active = false;
      bKeyState = 'ground';
      bKeyPos = { x: bKeyThrow.end.x, y: bKeyThrow.end.y };
      bKeyDropAvailableAt = millis();
    }
  }
  // Key on ground
  if (bKeyState === 'ground' && millis() > bKeyDropAvailableAt){
    drawKeyShape(bKeyPos.x, bKeyPos.y, { tilt: 0.08, scale: 1.0, shadow: true });
    // pickup
    if (dist(player.x, player.y, bKeyPos.x, bKeyPos.y) < min(cellW, cellH)*0.45){
      bKeyState = 'taken';
      bExitLocked = false;
      bLockAnim = 1;
      if (bConflictChoiceAt){
        const nowMs = millis();
        const travelTime = nowMs - bConflictChoiceAt;
        const hes = bConflictHesitationMs || (bConflictWalkStartedAt ? (bConflictWalkStartedAt - bConflictChoiceAt) : travelTime);
        bConflictProximityAtPickup = dist(player.x, player.y, bNPC.x, bNPC.y);
        if (!logs.roomB) logs.roomB = {};
        logs.roomB.conflict_choice_flag = 1;
        logs.roomB.time_to_walk_for_key_ms = travelTime;
        logs.roomB.distance_traveled_after_conflict = bConflictDistanceTraveled;
        logs.roomB.hesitation_before_walking_ms = hes;
        logs.roomB.proximity_to_NPC_after_conflict = bConflictProximityAtPickup;
      }
    }
  }
}

function transitionToC(){
  // finalize Room B duration when leaving to Room C
  if (roomBEnteredAt) {
    roomBDurationSec = (millis() - roomBEnteredAt) / 1000.0;
    roomBEnteredAt = 0;
  }
  roomCEnteredAt = millis();
  fading = true; state = "roomC";
  initRoomC();
}

// ROOM C — Balloon of Pressure (5-round version)
function computeTargetPopsForRound(roundIndex){
  return floor(random(4, 11)); // 4–10 inclusive
}

function initBalloonRound(){
  if (cRoundIndex <= 0) cRoundIndex = 1;
  cBalloon.x = width*0.5;
  cBalloon.y = height*0.45;
  cBalloon.r = 40;
  cBalloon.popped = false;
  cBalloon.floated = false;
  cButton.x = width*0.5;
  cButton.y = height*0.75;
  cPressCount = 0;
  cStartTime = millis();
  player.x = width*0.5;
  player.y = height*0.85;
  cPopSoundPlayed = false;
  cFloatSoundPlayed = false;
  cNearPopSoundPlayed = false;
  pumpTimestampsBefore = [];
  pumpTimestampsAfter = [];
  PumpCountBeforeSound = 0;
  PumpSpeedBeforeSound = 0;
  PumpRhythmVarianceBefore = 0;
  PumpSpeedAfterSound = 0;
  PumpRhythmVarianceAfter = 0;
  ExtraPumpsAfterSound = 0;
  TimeToFirstActionAfterSound = 0;
  PumpSpeedChangeRatio = 0;
  RhythmStabilityChange = 0;
  StrategyShiftFlag = false;
  nearPopSoundTimestamp = 0;
  nearPopCoinsLostAfterSound = 0;
  nearPopCoinsSavedAfterSound = 0;
  cLastPressAt = 0;
  cTargetPops = computeTargetPopsForRound(cRoundIndex);
  cPressTimes = [];
  cCollectPressedAt = null;
  cExplosion.active = false;
  cExplosion.parts = [];
  cExplosion.t = 0;
  cLabel.t = 0;
  cLabel.text = "";
  tempCoins = 0;
  cCounterPulse = 0;
   cRoundLocked = false;
}

function initRoomC(){
  // reset 5-round session aggregates
  cRoundIndex = 1;
  cRoundsTotalPumps = 0;
  cRoundsTotalExplosions = 0;
  cRoundsTotalCoinsCollected = 0;
  cRoundsTotalCoinsSaved = 0;
  cRoundHistory = [];
  cPressTimes = [];
  cCollectPressedAt = null;
  nearPopRounds = [];
  initBalloonRound();
  if (!cInstrEverShown){ cShowInstr = true; cInstrShownAt = millis(); cInstrEverShown = true; }
  // Create Collect Coins button
  if (!cCollectBtn){
    cCollectBtn = createButton('Collect Coins');
    cCollectBtn.parent('app');
    const { x: canvasLeft, y: canvasTop } = getCanvasOffsets();
    cCollectBtn.position(canvasLeft + width/2 - 80, canvasTop + height - 70);
    cCollectBtn.style('width','160px');
    cCollectBtn.style('height','56px');
    cCollectBtn.style('border-radius','14px');
    cCollectBtn.style('background','#f87171');
    cCollectBtn.style('color','#ffffff');
    cCollectBtn.style('font-weight','700');
    cCollectBtn.style('font-size','16px');
    cCollectBtn.style('border','none');
    cCollectBtn.style('box-shadow','0 14px 30px rgba(248, 113, 113, 0.25)');
    cCollectBtn.style('cursor','pointer');
    cCollectBtn.mouseOver(()=>{ cCollectBtn.style('background','#f25c5c'); });
    cCollectBtn.mouseOut(()=>{ cCollectBtn.style('background','#f87171'); });
    cCollectBtn.mousePressed(()=>{
      // Disallow collecting if player never jumped / has no coins
      if (cPressCount <= 0 || tempCoins <= 0) {
        return;
      }
      const nowPerf = (typeof performance !== 'undefined' && performance.now) ? performance.now() : (millis ? millis() : Date.now());
      if (cNearPopSoundPlayed && nearPopSoundTimestamp && !TimeToFirstActionAfterSound){
        TimeToFirstActionAfterSound = Math.max(0, nowPerf - nearPopSoundTimestamp);
      }
      cCollectPressedAt = millis();
      // Always schedule a 2s end; if coins exist, animate during this time
      if (!cBankAnim.active && tempCoins > 0){
        coinsCollectedBalloon = tempCoins; // remember amount collected this session
        cRoundLocked = true;
        startBankAnim();
      } else {
        // No coins: still wait 2s before ending for consistency
        const startMs = millis();
        cRoundLocked = true;
        setTimeout(()=>{
          logs.roomC = { presses: cPressCount, outcome: 'collected', coins: 0, time: (startMs - cStartTime)/1000 };
          console.log('Room C Log:', logs.roomC);
          coinsCollectedBalloon = 0;
          balloonExploded = 0;
          finishBalloonRound(false, 0);
        }, 2000);
      }
    });
  }
}

function roomC(){
  // button
  let depressed = (cButton.pressT && cButton.pressT>0);
  if (depressed) cButton.pressT--;
  fill(240, 180, 120, depressed?230:200);
  circle(cButton.x, cButton.y + (depressed?3:0), cButton.r*2 - (depressed?6:0));
  fill(255, 220, 170, 80);
  circle(cButton.x, cButton.y, cButton.r*2.5);

  // balloon string and body (only if not popped)
  if (!cBalloon.popped){
    stroke(240, 240, 255, 180); strokeWeight(2);
    line(cBalloon.x, cBalloon.y + cBalloon.r, cButton.x, cButton.y);
    noStroke();
    // balloon color depends on round
    let grad = drawingContext.createRadialGradient(
      cBalloon.x-10, cBalloon.y-10, 10,
      cBalloon.x, cBalloon.y, cBalloon.r*1.2
    );
    const roundColors = [
      ['rgba(255,230,240,0.9)','rgba(255,140,160,0.7)'], // default / round 0
      ['rgba(255,245,200,0.9)','rgba(255,190,120,0.7)'], // round 1
      ['rgba(220,245,220,0.9)','rgba(140,210,150,0.7)'], // round 2
      ['rgba(220,235,255,0.9)','rgba(150,180,255,0.7)'], // round 3
      ['rgba(240,225,255,0.9)','rgba(190,150,240,0.7)'], // round 4
      ['rgba(255,230,210,0.9)','rgba(255,170,120,0.7)']  // round 5
    ];
    const idx = (cRoundIndex >= 1 && cRoundIndex <= 5) ? cRoundIndex : 0;
    grad.addColorStop(0, roundColors[idx][0]);
    grad.addColorStop(1, roundColors[idx][1]);
    drawingContext.fillStyle = grad;
    ellipse(cBalloon.x, cBalloon.y, cBalloon.r*1.6, cBalloon.r*2.2);
    noFill();
  }

  // player
  player.update();
  updateRoomAMovementMetrics();
  player.draw();
  // pumps counter near Collect button
  if (cCollectBtn){
    push();
    textAlign(CENTER, CENTER);
    const px = cButton.x; const py = cButton.y + 36;
    // panel behind temporary wallet
    noStroke(); fill(20,24,34, 180);
    rect(px - 60, py - 14, 120, 28, 8);
    fill(255);
    // Pulse animation on coin gain
    const baseSize = 14; const scale = 1 + 0.25 * cCounterPulse;
    textSize(baseSize * scale);
    text('Coins: ' + tempCoins, px, py);
    // decay pulse
    cCounterPulse = max(0, cCounterPulse - 0.08);
    pop();
  }
  // show current round info
  push();
  textAlign(CENTER, TOP);
  fill(255);
  textSize(16);
  text(`Round ${cRoundIndex} / ${cTotalRounds}`, width*0.5, 16);
  pop();
  // inflate on landing over the button
  if (player.justLanded && !cRoundLocked) pressButtonHit();

  // floating label above balloon
  if (cLabel.t > 0){
    cLabel.t--;
    let a = map(cLabel.t, 0, 40, 0, 255);
    push();
    textAlign(CENTER, BOTTOM);
    fill(255, 255, 255, a);
    textSize(18);
    let ly = cBalloon.y - cBalloon.r - 18 - (40 - min(40, cLabel.t))*0.6;
    text(cLabel.text, cBalloon.x, ly);
    pop();
  }

  if (cBalloon.popped){
    // draw explosion particles and advance timer
    if (cExplosion.active){
      cExplosion.t++;
      for (let p of cExplosion.parts){
        p.x += p.vx; p.y += p.vy; p.vx *= 0.98; p.vy *= 0.98; p.r *= 0.98;
        p.a *= 0.96;
        noStroke(); fill(255, 180, 190, p.a);
        circle(p.x, p.y, p.r);
      }
      if (cExplosion.t > cExplosion.duration){
        balloonExploded = 1;
        // coinsCollectedBalloon already contains potential before explosion, tempCoins reset
        finishBalloonRound(true, 0);
      }
    }
  }

  // Coin fly-to-HUD animation: lasts exactly 2 seconds after Collect press
  if (cBankAnim.active){
    const elapsed = millis() - cBankAnim.startedAt;
    const targetX = 24, targetY = 26; // HUD coin center (global coords)
    for (let i=0;i<cBankAnim.coins.length;i++){
      const coin = cBankAnim.coins[i];
      const p = constrain((elapsed - (coin.delayMs||0)) / cBankAnim.totalMs, 0, 1);
      const x = lerp(coin.sx, targetX, p);
      const y = lerp(coin.sy, targetY, p*p);
      noStroke(); fill(240, 210, 90, 230);
      circle(x, y, 10);
      stroke(255, 240, 180, 140); noFill(); circle(x, y, 12);
    }
    if (elapsed >= cBankAnim.totalMs){
      const bankedNow = cBankAnim.amount;
      coinsSaved += bankedNow;
      totalCoins += bankedNow; // update HUD total after transfer completes
      cBankAnim.active = false; cBankAnim.coins = []; cBankAnim.amount = 0;
      logs.roomC = { presses: cPressCount, outcome: 'collected', coins: bankedNow, time: (cBankAnim.startedAt - cStartTime)/1000 };
      console.log('Room C Log:', logs.roomC);
      balloonExploded = 0;
      coinsCollectedBalloon = bankedNow;
      finishBalloonRound(false, bankedNow);
    }
  }
}

function pressButtonHit(){
  if (dist(player.x, player.y, cButton.x, cButton.y) < cButton.r + 24){
    if (!cBalloon.popped && !cBalloon.floated){
      cBalloon.r += random(3, 6); // proportional inflation
      cPressCount++;
      if (millis) cPressTimes.push(millis());
      pumpsCount = cPressCount;
      cLastPressAt = millis();
      cButton.pressT = 10; // depress animation
      // award a temp coin per inflation
      tempCoins += 1;
      cCounterPulse = 1.0;
      const nowPerf = (typeof performance !== 'undefined' && performance.now) ? performance.now() : (millis ? millis() : Date.now());
      if (!cNearPopSoundPlayed){
        pumpTimestampsBefore.push(nowPerf);
      } else {
        pumpTimestampsAfter.push(nowPerf);
        ExtraPumpsAfterSound = pumpTimestampsAfter.length;
        if (!TimeToFirstActionAfterSound && nearPopSoundTimestamp){
          TimeToFirstActionAfterSound = Math.max(0, nowPerf - nearPopSoundTimestamp);
        }
      }
      // show '+1 coin' label
      cLabel.text = "+1 coin";
      cLabel.t = 40;
      cLabel.x = cBalloon.x; cLabel.y = cBalloon.y - cBalloon.r - 20;
      // Play near-pop hint on 4–6th pump (once per round)
      if (!cBalloon.popped && !cPopSoundPlayed && !cNearPopSoundPlayed && cPressCount >= 4 && cPressCount <= 6){
        const chance = 0.6;
        if (random() < chance && sndBalloonNearPop && !sndBalloonNearPop.isPlaying()){
          sndBalloonNearPop.stop();
          sndBalloonNearPop.play();
          cNearPopSoundPlayed = true;
          nearPopSoundTimestamp = nowPerf;
          PumpCountBeforeSound = pumpTimestampsBefore.length;
          const stats = intervalStats(pumpTimestampsBefore);
          PumpSpeedBeforeSound = stats.avg;
          PumpRhythmVarianceBefore = stats.variance;
        }
      }
      // Pop strictly at random threshold 3..6 pumps (set in init), or if radius cap reached
      if (cPressCount >= cTargetPops || cBalloon.r >= cBalloon.max){
        cBalloon.popped = true;
        if (!cPopSoundPlayed) playPopSound();
        // lose temp coins on pop
        const nowPopPerf = (typeof performance !== 'undefined' && performance.now) ? performance.now() : (millis ? millis() : Date.now());
        if (cNearPopSoundPlayed && nearPopSoundTimestamp && !TimeToFirstActionAfterSound){
          TimeToFirstActionAfterSound = Math.max(0, nowPopPerf - nearPopSoundTimestamp);
        }
        if (cNearPopSoundPlayed){
          nearPopCoinsLostAfterSound = tempCoins;
        }
        coinsCollectedBalloon = tempCoins; // what was accumulated just before pop
        tempCoins = 0;
        logs.roomC = { presses: cPressCount, outcome: 'popped', coins: 0, time: (millis()-cStartTime)/1000 };
        console.log("Room C Log:", logs.roomC);
        // override label to '0'
        cLabel.text = "0";
        cLabel.t = 50;
        cLabel.x = cBalloon.x; cLabel.y = cBalloon.y - cBalloon.r - 20;
        startExplosion();
      }
    }
  }
}

function startExplosion(){
  cExplosion.active = true;
  cExplosion.t = 0;
  cExplosion.parts = [];
  let n = 28;
  for (let i=0;i<n;i++){
    let ang = (i/n) * TAU + random(-0.2, 0.2);
    let spd = random(2.0, 5.0);
    cExplosion.parts.push({
      x: cBalloon.x + cos(ang)*4,
      y: cBalloon.y + sin(ang)*4,
      vx: cos(ang)*spd,
      vy: sin(ang)*spd,
      r: random(3,7),
      a: 200
    });
  }
}

function summarizeRound(exploded, savedAmount){
  const times = cPressTimes || [];
  const pumps = cPressCount || 0;
  let hesAvg = 0;
  if (times.length > 1){
    let acc = 0;
    for (let i=1;i<times.length;i++){ acc += (times[i]-times[i-1]); }
    hesAvg = acc / (times.length-1);
  } else if (times.length === 1){
    hesAvg = times[0] - cStartTime;
  }
  let cashDelay = null;
  if (!exploded && cCollectPressedAt){
    const lastPress = times.length ? times[times.length-1] : cStartTime;
    cashDelay = cCollectPressedAt - lastPress;
  }
  return {
    pumps,
    exploded: exploded ? 1 : 0,
    hesitationAvg: hesAvg,
    cashoutDelay: cashDelay,
    saved: savedAmount || 0
  };
}

// Finish current balloon round and either start next one or end game with aggregates
function finishBalloonRound(exploded, savedAmount){
  if (cNearPopSoundPlayed){
    nearPopCoinsSavedAfterSound = savedAmount || 0;
  }
  // finalize per-round near-pop metrics and store
  if (cNearPopSoundPlayed){
    const afterStats = intervalStats(pumpTimestampsAfter);
    PumpSpeedAfterSound = afterStats.avg;
    PumpRhythmVarianceAfter = afterStats.variance;
    ExtraPumpsAfterSound = pumpTimestampsAfter.length;
    const beforeAvg = PumpSpeedBeforeSound || 0;
    PumpSpeedChangeRatio = beforeAvg ? (PumpSpeedAfterSound / beforeAvg) : 0;
    RhythmStabilityChange = PumpRhythmVarianceAfter - PumpRhythmVarianceBefore;
    const stabilityThreshold = 5000; // ms^2 variance change threshold
    StrategyShiftFlag = (PumpSpeedChangeRatio < 0.85 || PumpSpeedChangeRatio > 1.15 || Math.abs(RhythmStabilityChange) > stabilityThreshold);
    if (nearPopRounds){
      nearPopRounds.push({
        sound: 1,
        PumpCountBeforeSound,
        PumpSpeedBeforeSound,
        PumpRhythmVarianceBefore,
        PumpSpeedAfterSound,
        PumpRhythmVarianceAfter,
        ExtraPumpsAfterSound,
        TimeToFirstActionAfterSound,
        PumpSpeedChangeRatio,
        RhythmStabilityChange,
        StrategyShiftFlag: StrategyShiftFlag ? 1 : 0,
        NearPopCoinsSavedAfterSound: nearPopCoinsSavedAfterSound || (cNearPopSoundPlayed ? savedAmount || 0 : 0),
        NearPopCoinsLostAfterSound: nearPopCoinsLostAfterSound || 0
      });
    }
  } else if (nearPopRounds){
    nearPopRounds.push({ sound: 0 });
  }

  const collectedThisRound = Number(coinsCollectedBalloon) || 0;
  const savedThisRound = Number(savedAmount) || 0;

  // capture per-round history
  const roundSummary = summarizeRound(exploded, savedThisRound);
  cRoundHistory.push(roundSummary);

  cRoundsTotalPumps += cPressCount;
  if (exploded) cRoundsTotalExplosions += 1;
  cRoundsTotalCoinsCollected += collectedThisRound;
  cRoundsTotalCoinsSaved += savedThisRound;

  // preparation for next round or finish after 5th
  if (cRoundIndex < cTotalRounds){
    cRoundIndex++;
    initBalloonRound();
  } else {
    const n = cTotalRounds;
    // aggregated metrics for final telemetry and end screen
    pumpsCount = cRoundsTotalPumps / n;
    balloonExploded = cRoundsTotalExplosions; // total explosion count
    coinsCollectedBalloon = cRoundsTotalCoinsCollected / n;
    coinsSaved = cRoundsTotalCoinsSaved / n;

    try{ sendFinalTelemetry(); }catch(_){}
    endGame();
  }
}

function playerJump(){
  if (player.onGround){
    player.onGround = false;
    player.jumpVel = -8;
  }
}

function endGame(){
  // finalize Room C duration when game ends
  if (roomCEnteredAt) {
    roomCDurationSec = (millis() - roomCEnteredAt) / 1000.0;
    roomCEnteredAt = 0;
  }
  state = "end";
  if (cCollectBtn){ cCollectBtn.remove(); cCollectBtn = null; }
   if (cInstrCloseBtn){ cInstrCloseBtn.remove(); cInstrCloseBtn = null; }
}

// Final telemetry sender with exact column keys and order
function sendFinalTelemetry(){
  if (finalTelemetrySent) { return; }
  const url = 'https://script.google.com/macros/s/AKfycbyTI3HLXTDyM-HQt_EBcYK5ULbCuymvOW3MZ-lt9WpzPfpBcvIG2Fng81nemB4Xomb4/exec';
  // ensure full-game duration and averages are finalized
  if (typeof aStartTime !== 'undefined' && aStartTime) {
    const nowMS = millis();
    if (aLastMoveDir !== 'none' && aLastMoveDirChangedAt > 0) {
      const dtDir = nowMS - aLastMoveDirChangedAt;
      if (dtDir > 0) {
        aDirHoldTotalMs += dtDir;
        aDirHoldPhases++;
      }
    }
    aRoomADurationSec = (nowMS - aStartTime) / 1000.0;
    aAvgDirectionHoldMs = aDirHoldPhases > 0 ? (aDirHoldTotalMs / aDirHoldPhases) : 0;
    const jitterRate = aRoomADurationSec > 0 ? (aInputJitterCount / aRoomADurationSec) : 0;
    if (jitterRate < 0.2) aJitterIntensity = 'smooth';
    else if (jitterRate < 0.5) aJitterIntensity = 'slight';
    else if (jitterRate < 1.0) aJitterIntensity = 'moderate';
    else aJitterIntensity = 'high';

    // finalize room durations if needed (if game ended directly from RoomC)
    if (!roomADurationSec && roomAEnteredAt) {
      roomADurationSec = (nowMS - roomAEnteredAt) / 1000.0;
      roomAEnteredAt = 0;
    }
    if (!roomBDurationSec && roomBEnteredAt) {
      roomBDurationSec = (nowMS - roomBEnteredAt) / 1000.0;
      roomBEnteredAt = 0;
    }
    if (!roomCDurationSec && roomCEnteredAt) {
      roomCDurationSec = (nowMS - roomCEnteredAt) / 1000.0;
      roomCEnteredAt = 0;
    }
  }
  const avgHoldForSend = aAvgDirectionHoldMs || 0;
  const roomADurForSend = aRoomADurationSec || 0;
  const npcChoice = '';
  const npcDecision = (logs.roomB && logs.roomB.decisionTime) || '';
  // Balloon aggregated stats from round history
  const balloonTotals = (()=> {
    const hist = cRoundHistory || [];
    const totalPumps = hist.reduce((s,r)=>s+(r.pumps||0),0);
    const explosionCount = hist.reduce((s,r)=>s+(r.exploded?1:0),0);
    const hesArr = hist.map(r=>r.hesitationAvg).filter(v=>v!==undefined && v!==null);
    const cashArr = hist.filter(r=>!r.exploded && r.cashoutDelay!==null && r.cashoutDelay!==undefined).map(r=>r.cashoutDelay);
    const avgHes = hesArr.length ? hesArr.reduce((s,v)=>s+v,0)/hesArr.length : 0;
    const avgCash = cashArr.length ? cashArr.reduce((s,v)=>s+v,0)/cashArr.length : 0;
    let postRatio = -1;
    const firstExp = hist.findIndex(r=>r.exploded);
    if (firstExp >= 0){
      const pumpsBefore = hist.slice(0, firstExp).reduce((s,r)=>s+(r.pumps||0),0);
      const pumpsAfter = hist.slice(firstExp+1).reduce((s,r)=>s+(r.pumps||0),0);
      postRatio = pumpsBefore > 0 ? (pumpsAfter / pumpsBefore) : -1;
    }
    const pumpsArr = hist.map(r=>r.pumps||0);
    let variability = 0;
    if (pumpsArr.length){
      const mean = pumpsArr.reduce((s,v)=>s+v,0) / pumpsArr.length;
      const varSum = pumpsArr.reduce((s,v)=>s + Math.pow(v-mean,2), 0) / pumpsArr.length;
      variability = Math.sqrt(varSum);
    }
    return {
      totalPumps,
      explosionCount,
      avgHes,
      avgCash,
      postRatio,
      variability
    };
  })();
  const nearPopAgg = (()=> {
    const rounds = (nearPopRounds || []).filter(r=>r && r.sound);
    const count = rounds.length || 0;
    const sum = (k)=>rounds.reduce((s,r)=>s + (Number(r[k])||0),0);
    const mean = (k)=> count ? (sum(k) / count) : 0;
    const strategyPct = count ? (rounds.reduce((s,r)=>s + (r.StrategyShiftFlag?1:0),0) / count) : 0;
    return {
      PumpCountBeforeSound_Mean: mean('PumpCountBeforeSound'),
      PumpSpeedBeforeSound_Mean: mean('PumpSpeedBeforeSound'),
      PumpRhythmVarianceBefore_Mean: mean('PumpRhythmVarianceBefore'),
      PumpSpeedAfterSound_Mean: mean('PumpSpeedAfterSound'),
      PumpRhythmVarianceAfter_Mean: mean('PumpRhythmVarianceAfter'),
      ExtraPumpsAfterSound_Mean: mean('ExtraPumpsAfterSound'),
      TimeToFirstActionAfterSound_Mean: mean('TimeToFirstActionAfterSound'),
      PumpSpeedChangeRatio_Mean: mean('PumpSpeedChangeRatio'),
      RhythmStabilityChange_Mean: mean('RhythmStabilityChange'),
      StrategyShiftFlag_Pct: strategyPct,
      NearPopCoinsSavedAfterSound_Sum: sum('NearPopCoinsSavedAfterSound'),
      NearPopCoinsLostAfterSound_Sum: sum('NearPopCoinsLostAfterSound'),
      NearPopRoundsWithSound: count
    };
  })();
  const data = {
    PlayerID: playerId || '',
    TimeBeforeStart: String(timeBeforeStartSec || 0),
    FirstPathChoice: String(aChoice || ''),
    DecisionTime: ((millis()-aStartTime)/1000).toFixed(2),
    CoinsRoomA: String(coinsRoomA||0),
    IdleTime: (aIdleTime + (aIdleSince? (millis()-aIdleSince)/1000.0 : 0)).toFixed(2),
    SignificantDirectionChanges: String(aSignificantDirectionChanges||0),
    InputJitterCount: String(aInputJitterCount||0),
    RoomA_DurationSec: (roomADurationSec || 0).toFixed(2),
    RoomB_DurationSec: (roomBDurationSec || 0).toFixed(2),
    RoomC_DurationSec: (roomCDurationSec || 0).toFixed(2),
    JitterIntensity: aJitterIntensity || 'smooth',
    AvgDirectionHoldMs: avgHoldForSend.toFixed ? avgHoldForSend.toFixed(1) : String(avgHoldForSend),
    RoomADurationSec: roomADurForSend.toFixed ? roomADurForSend.toFixed(2) : String(roomADurForSend),
    TilesSteppedOnTrail: String(tilesSteppedOnTrail||0),
    CoinsRoomB: String(coinsRoomB||0),
    PumpsCount: String(pumpsCount||0),
    cSpacePressCount: String(cSpacePressCount||0),
    BalloonExploded: balloonExploded ? '1':'0',
    CoinsCollectedBalloon: String(coinsCollectedBalloon||0),
    CoinsSaved: String(coinsSaved||0),
    CoinsTotal: String((coinsRoomA||0) + (coinsRoomB||0) + (coinsSaved||0)),
    Timestamp: new Date().toISOString(),
    Big5TestID: String(big5Id || ''),
    Balloon_Total_Pumps: String(balloonTotals.totalPumps || 0),
    Balloon_Explosions_Count: String(balloonTotals.explosionCount || 0),
    Balloon_Avg_Hesitation_Ms: String(balloonTotals.avgHes || 0),
    Balloon_Avg_Cashout_Delay_Ms: String(balloonTotals.avgCash || 0),
    Balloon_Post_Explosion_Ratio: String(balloonTotals.postRatio),
    Balloon_Risk_Variability: String(balloonTotals.variability || 0),
    // AvatarShape/AvatarColor kept for gameplay only; not sent to sheet
  };
  const avatarData = (typeof window !== 'undefined' && window.avatarTelemetry) ? window.avatarTelemetry : {
    AvatarChosen,
    AvatarChoiceTimeMs,
    AvatarHoverCount,
    AvatarClickCount,
    AvatarShapeType,
    AvatarColorCategory,
    AvatarFinalHesitationMs
  };
  data.AvatarChosen = String(avatarData.AvatarChosen || '');
  data.AvatarChoiceTimeMs = String(avatarData.AvatarChoiceTimeMs || 0);
  data.AvatarHoverCount = String(avatarData.AvatarHoverCount || 0);
  data.AvatarClickCount = String(avatarData.AvatarClickCount || 0);
  data.AvatarShapeType = String(avatarData.AvatarShapeType || '');
  data.AvatarColorCategory = String(avatarData.AvatarColorCategory || '');
  data.AvatarFinalHesitationMs = String(avatarData.AvatarFinalHesitationMs || 0);
  data.PumpCountBeforeSound_Mean = String(nearPopAgg.PumpCountBeforeSound_Mean || 0);
  data.PumpSpeedBeforeSound_Mean = String(nearPopAgg.PumpSpeedBeforeSound_Mean || 0);
  data.PumpRhythmVarianceBefore_Mean = String(nearPopAgg.PumpRhythmVarianceBefore_Mean || 0);
  data.PumpSpeedAfterSound_Mean = String(nearPopAgg.PumpSpeedAfterSound_Mean || 0);
  data.PumpRhythmVarianceAfter_Mean = String(nearPopAgg.PumpRhythmVarianceAfter_Mean || 0);
  data.ExtraPumpsAfterSound_Mean = String(nearPopAgg.ExtraPumpsAfterSound_Mean || 0);
  data.TimeToFirstActionAfterSound_Mean = String(nearPopAgg.TimeToFirstActionAfterSound_Mean || 0);
  data.PumpSpeedChangeRatio_Mean = String(nearPopAgg.PumpSpeedChangeRatio_Mean || 0);
  data.RhythmStabilityChange_Mean = String(nearPopAgg.RhythmStabilityChange_Mean || 0);
  data.StrategyShiftFlag_Pct = String(nearPopAgg.StrategyShiftFlag_Pct || 0);
  data.NearPopCoinsSavedAfterSound_Sum = String(nearPopAgg.NearPopCoinsSavedAfterSound_Sum || 0);
  data.NearPopCoinsLostAfterSound_Sum = String(nearPopAgg.NearPopCoinsLostAfterSound_Sum || 0);
  data.NearPopRoundsWithSound = String(nearPopAgg.NearPopRoundsWithSound || 0);
  const rb = logs.roomB || {};
  data.conflict_choice_flag = String(rb.conflict_choice_flag || 0);
  data.time_to_walk_for_key_ms = String(rb.time_to_walk_for_key_ms || 0);
  data.distance_traveled_after_conflict = String(rb.distance_traveled_after_conflict || 0);
  data.hesitation_before_walking_ms = String(rb.hesitation_before_walking_ms || 0);
  data.proximity_to_NPC_after_conflict = String(rb.proximity_to_NPC_after_conflict || 0);
  data.cooperation_choice_flag = String(rb.cooperation_choice_flag || 0);
  data.time_to_door_after_cooperation = String(rb.time_to_door_after_cooperation || 0);
  data.willingness_to_wait_for_NPC = String(rb.willingness_to_wait_for_NPC || 0);
  data.distance_kept_from_NPC_before_choice = String(rb.distance_kept_from_NPC_before_choice || 0);
  // normalize numeric fields to one decimal place
  const fmt1 = (v)=>{
    const n = Number(v);
    if (!isFinite(n)) return String(v ?? '');
    return (Math.round(n * 10) / 10).toFixed(1);
  };
  const numericKeys = [
    'TimeBeforeStart','DecisionTime','CoinsRoomA','IdleTime','SignificantDirectionChanges','InputJitterCount',
    'RoomA_DurationSec','RoomB_DurationSec','RoomC_DurationSec','AvgDirectionHoldMs','RoomADurationSec',
    'TilesSteppedOnTrail','CoinsRoomB','PumpsCount','cSpacePressCount','BalloonExploded','CoinsCollectedBalloon','CoinsSaved',
    'CoinsTotal','RoomB_Decision_Time','Balloon_Total_Pumps','Balloon_Explosions_Count','Balloon_Avg_Hesitation_Ms',
    'Balloon_Avg_Cashout_Delay_Ms','Balloon_Post_Explosion_Ratio','Balloon_Risk_Variability',
    'AvatarChoiceTimeMs','AvatarHoverCount','AvatarClickCount','AvatarFinalHesitationMs',
    'PumpCountBeforeSound_Mean','PumpSpeedBeforeSound_Mean','PumpRhythmVarianceBefore_Mean',
    'PumpSpeedAfterSound_Mean','PumpRhythmVarianceAfter_Mean','ExtraPumpsAfterSound_Mean',
    'TimeToFirstActionAfterSound_Mean','PumpSpeedChangeRatio_Mean','RhythmStabilityChange_Mean',
    'StrategyShiftFlag_Pct','NearPopCoinsSavedAfterSound_Sum','NearPopCoinsLostAfterSound_Sum',
    'NearPopRoundsWithSound','conflict_choice_flag','time_to_walk_for_key_ms','distance_traveled_after_conflict',
    'hesitation_before_walking_ms','proximity_to_NPC_after_conflict','cooperation_choice_flag',
    'time_to_door_after_cooperation','willingness_to_wait_for_NPC','distance_kept_from_NPC_before_choice'
  ];
  numericKeys.forEach(k=>{ if (k in data) data[k] = fmt1(data[k]); });
  // Debug
  console.log('Final Telemetry →', data);
  const form = new FormData();
  form.append('PlayerID', data.PlayerID);
  form.append('TimeBeforeStart', data.TimeBeforeStart);
  form.append('FirstPathChoice', data.FirstPathChoice);
  form.append('DecisionTime', data.DecisionTime);
  form.append('CoinsRoomA', data.CoinsRoomA);
  form.append('IdleTime', data.IdleTime);
  form.append('SignificantDirectionChanges', data.SignificantDirectionChanges);
  form.append('InputJitterCount', data.InputJitterCount);
  form.append('RoomA_DurationSec', data.RoomA_DurationSec);
  form.append('RoomB_DurationSec', data.RoomB_DurationSec);
  form.append('RoomC_DurationSec', data.RoomC_DurationSec);
  form.append('JitterIntensity', data.JitterIntensity);
  form.append('AvgDirectionHoldMs', data.AvgDirectionHoldMs);
  form.append('RoomADurationSec', data.RoomADurationSec);
  form.append('TilesSteppedOnTrail', data.TilesSteppedOnTrail);
  form.append('CoinsRoomB', data.CoinsRoomB);
  form.append('PumpsCount', data.PumpsCount);
  form.append('BalloonExploded', data.BalloonExploded);
  form.append('CoinsCollectedBalloon', data.CoinsCollectedBalloon);
  form.append('CoinsSaved', data.CoinsSaved);
  form.append('CoinsTotal', data.CoinsTotal);
  form.append('Timestamp', data.Timestamp);
  form.append('Big5TestID', data.Big5TestID);
  form.append('Balloon_Total_Pumps', data.Balloon_Total_Pumps);
  form.append('Balloon_Explosions_Count', data.Balloon_Explosions_Count);
  form.append('Balloon_Avg_Hesitation_Ms', data.Balloon_Avg_Hesitation_Ms);
  form.append('Balloon_Avg_Cashout_Delay_Ms', data.Balloon_Avg_Cashout_Delay_Ms);
  form.append('Balloon_Post_Explosion_Ratio', data.Balloon_Post_Explosion_Ratio);
  form.append('Balloon_Risk_Variability', data.Balloon_Risk_Variability);
  form.append('AvatarChosen', data.AvatarChosen);
  form.append('AvatarChoiceTimeMs', data.AvatarChoiceTimeMs);
  form.append('AvatarHoverCount', data.AvatarHoverCount);
  form.append('AvatarClickCount', data.AvatarClickCount);
  form.append('AvatarShapeType', data.AvatarShapeType);
  form.append('AvatarColorCategory', data.AvatarColorCategory);
  form.append('AvatarFinalHesitationMs', data.AvatarFinalHesitationMs);
  form.append('PumpCountBeforeSound_Mean', data.PumpCountBeforeSound_Mean);
  form.append('PumpSpeedBeforeSound_Mean', data.PumpSpeedBeforeSound_Mean);
  form.append('PumpRhythmVarianceBefore_Mean', data.PumpRhythmVarianceBefore_Mean);
  form.append('PumpSpeedAfterSound_Mean', data.PumpSpeedAfterSound_Mean);
  form.append('PumpRhythmVarianceAfter_Mean', data.PumpRhythmVarianceAfter_Mean);
  form.append('ExtraPumpsAfterSound_Mean', data.ExtraPumpsAfterSound_Mean);
  form.append('TimeToFirstActionAfterSound_Mean', data.TimeToFirstActionAfterSound_Mean);
  form.append('PumpSpeedChangeRatio_Mean', data.PumpSpeedChangeRatio_Mean);
  form.append('RhythmStabilityChange_Mean', data.RhythmStabilityChange_Mean);
  form.append('StrategyShiftFlag_Pct', data.StrategyShiftFlag_Pct);
  form.append('NearPopCoinsSavedAfterSound_Sum', data.NearPopCoinsSavedAfterSound_Sum);
  form.append('NearPopCoinsLostAfterSound_Sum', data.NearPopCoinsLostAfterSound_Sum);
  form.append('NearPopRoundsWithSound', data.NearPopRoundsWithSound);
  form.append('conflict_choice_flag', data.conflict_choice_flag);
  form.append('time_to_walk_for_key_ms', data.time_to_walk_for_key_ms);
  form.append('distance_traveled_after_conflict', data.distance_traveled_after_conflict);
  form.append('hesitation_before_walking_ms', data.hesitation_before_walking_ms);
  form.append('proximity_to_NPC_after_conflict', data.proximity_to_NPC_after_conflict);
  form.append('cooperation_choice_flag', data.cooperation_choice_flag);
  form.append('time_to_door_after_cooperation', data.time_to_door_after_cooperation);
  form.append('willingness_to_wait_for_NPC', data.willingness_to_wait_for_NPC);
  form.append('distance_kept_from_NPC_before_choice', data.distance_kept_from_NPC_before_choice);
  finalTelemetrySent = true;
  fetch(url, { method:'POST', mode:'no-cors', body: form })
    .then(()=>console.log('📤 Telemetry request dispatched (no-cors). Check Apps Script/Sheet logs.'))
    .catch(err=>console.error('❌ Telemetry request dispatch error', err));
}

function endScreen(){
  // visual-only ending: soft gradient and drifting particles
  drawWatercolorBackdrop();
  fill(255, 255, 255, 40);
  for (let i=0;i<80;i++){
    circle(noise(i*3, frameCount*0.003)*width, noise(i*5, frameCount*0.003+200)*height, 2);
  }
  // GAME OVER text
  push();
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(48);
  text("GAME OVER", width*0.5, height*0.4);
  pop();
}

// VISUAL BACKDROPS
function backgroundGradient(){
  let c1 = color(20, 25, 35), c2 = color(60, 70, 110);
  for (let y=0; y<height; y++){
    let t = y/height;
    stroke(lerpColor(c1, c2, t));
    line(0,y,width,y);
  }
  noStroke();
}

function drawMountains(){
  noStroke();
  for (let i=0; i<3; i++){
    let baseY = height*0.7 + i*12;
    let c = color(40+ i*20, 60 + i*20, 100 + i*30, 90);
    fill(c);
    beginShape();
    vertex(0,height);
    for (let x=0; x<=width; x+=10){
      let n = noise(i*100 + x*0.005, frameCount*0.002);
      let y = baseY - n*80 - i*12;
      vertex(x, y);
    }
    vertex(width,height);
    endShape(CLOSE);
  }
}

function drawWatercolorBackdrop(){
  for (let y=0; y<height; y+=6){
    let t = y/height;
    let c = color(lerp(120, 230, t), lerp(150, 200, t), lerp(200, 255, t), 40);
    noStroke(); fill(c);
    rect(0,y,width,8);
  }
}

function drawSkyDots(){
  fill(255, 255, 255, 40);
  for (let i=0;i<120;i++){
    circle(noise(i*2, frameCount*0.004)*width, noise(i*3, frameCount*0.004+100)*height, 1.6);
  }
}

function drawForestBackdrop(){
  if (roomABg){
    image(roomABg, 0, 0, width, height);
  } else {
    let c1 = color(20, 40, 25), c2 = color(30, 80, 40);
    for (let y=0; y<height; y++){
      let t = y/height;
      stroke(lerpColor(c1, c2, t));
      line(0,y,width,y);
    }
    noStroke();
    for (let layer=0; layer<4; layer++){
      let baseY = height*0.55 + layer*24;
      let a = 80 - layer*12;
      for (let x=-40; x<=width+40; x+=28){
        let n = noise(layer*100 + x*0.03, frameCount*0.002);
        let r = 26 + n*18 - layer*3;
        fill(40+layer*10, 120-layer*10, 60+layer*12, a);
        circle(x + sin(x*0.03+layer)*6, baseY - n*20, r*2);
      }
    }
  }
}

// SCENE 1: brick walls renderer (visual-only, does not constrain movement)
function drawBrickWalls(margin){
  let leftW = margin;
  let rightW = margin;
  // bricks scale and darken slightly as walls close in
  let s = 1 + 0.35 * aClosing;
  let brickW = 34 * s, brickH = 16 * s;
  // left wall bricks (mirrored horizontally around inner edge)
  push();
  // draw bricks in a mirrored coordinate system so left pattern is mirrored
  push(); noStroke();
  translate(leftW, 0);
  scale(-1, 1);
  for (let y=0; y<height; y+=brickH){
    let row = floor(y/brickH);
    let offset = (row % 2) ? brickW*0.5 : 0;
    // bricks go from inner wall edge outwards
    for (let x=0; x<=leftW + offset - brickW; x+=brickW){
      let v = noise(x*0.02, y*0.02)*30;
      fill(90+v*0.9, 80+v*0.6, 65+v*0.35, 230);
      rect(x+2*s, y+2*s, brickW-4*s, brickH-4*s, 2*s);
    }
  }
  pop();
  // inner glow rim (in world coordinates, without mirror)
  stroke(255,240,200, 50+30*aClosing); strokeWeight(3+2*aClosing);
  line(leftW, 0, leftW, height);
  pop();

  // right wall bricks
  push(); noStroke();
  let startX = width - rightW;
  for (let y=0; y<height; y+=brickH){
    let row = floor(y/brickH);
    let offset = (row % 2) ? brickW*0.5 : 0;
    // same width boundaries so wall geometry is symmetrical
    for (let x=startX; x<=width + offset - brickW; x+=brickW){
      let v = noise(x*0.02, y*0.02)*30;
      fill(90+v*0.9, 80+v*0.6, 65+v*0.35, 230);
      rect(x+2*s, y+2*s, brickW-4*s, brickH-4*s, 2*s);
    }
  }
  // inner glow rim
  stroke(255,240,200, 50+30*aClosing); strokeWeight(3+2*aClosing);
  line(startX, 0, startX, height);
  pop();
}

// DOOR RENDERER
function drawDoor(x, y, type, scaleK=1){
  push();
  translate(x, y);
  scale(scaleK);
  // door body
  let w=46, h=70;
  let grad = drawingContext.createLinearGradient(0, -h, 0, 0);
  grad.addColorStop(0, 'rgba(120,80,40,0.95)');
  grad.addColorStop(1, 'rgba(80,50,25,0.95)');
  drawingContext.fillStyle = grad;
  rectMode(CENTER);
  rect(0, 0, w, 8, 4); // threshold glow
  rectMode(CORNER);
  noFill();
  // wooden panel
  noStroke(); fill(120, 85, 50, 230); rect(- w/2, - h-8, w, h, 6);
  // highlights and rim
  noFill(); stroke(255, 240, 200, 60); strokeWeight(2);
  rect(- w/2+2, - h-6, w-4, h-4, 6);
  // handle
  noFill(); stroke(230, 210, 160, 180); strokeWeight(3);
  line(w*0.3, -h*0.5, w*0.3, -h*0.5+8);
  pop();
}

function drawLockIcon(x, y, glow=0){
  push();
  translate(x, y - 18);
  if (glow > 0){
    noStroke(); fill(255, 240, 120, 80);
    ellipse(0, 6, glow * 0.6, glow * 0.6);
  }
  const bodyW = 40, bodyH = 38;
  stroke(70, 70, 80, 230); strokeWeight(4);
  fill(205, 205, 215, 245);
  rectMode(CENTER);
  rect(0, 10, bodyW, bodyH, 8);
  noFill();
  stroke(70, 70, 80, 230); strokeWeight(5);
  arc(0, -8, bodyW*0.72, bodyH*0.72, PI*0.83, PI*2.17);
  // keyhole
  noStroke();
  fill(40, 40, 50, 240);
  ellipse(0, 4, bodyW*0.18, bodyW*0.18);
  rect(-bodyW*0.06, 4, bodyW*0.12, bodyH*0.28, 4);
  // subtle shine
  noFill();
  stroke(255, 255, 255, 70);
  arc(0, -8, bodyW*0.55, bodyH*0.55, PI*0.9, PI*1.9);
  pop();
}

// SOUNDS
function playPopSound(){
  try{
    if (sndBalloonNearPop && sndBalloonNearPop.isPlaying()) sndBalloonNearPop.stop();
    if (sndBalloonPop){
      sndBalloonPop.stop();
      sndBalloonPop.play();
    } else {
      let o = new p5.Oscillator('triangle');
      let env = new p5.Envelope(); env.setADSR(0.001, 0.05, 0.0, 0.1); env.setRange(0.2, 0);
      o.freq(360); o.start(); env.play(o); setTimeout(()=>o.stop(), 120);
    }
    cPopSoundPlayed = true;
  }catch(e){}
}
function playFloatSound(){
  try{
    let o = new p5.Oscillator('sine');
    o.freq(220); o.amp(0.02); o.start();
    let d = new p5.Delay(); d.process(o, 0.3, 0.4, 1200);
    setTimeout(()=>{ o.stop(); }, 600);
    cFloatSoundPlayed = true;
  }catch(e){}
}

function sendDataToSheet(data) {
  const url = 'https://script.google.com/macros/s/AKfycbyTI3HLXTDyM-HQt_EBcYK5ULbCuymvOW3MZ-lt9WpzPfpBcvIG2Fng81nemB4Xomb4/exec';
  try {
    // Only send if ALL final telemetry fields are present to match Sheet headers 1:1
    const required = [
      'PlayerID','TimeBeforeStart','FirstPathChoice','DecisionTime','CoinsRoomA',
      'ChangedDirectionCount','IdleTime','TilesSteppedOnTrail','CoinsRoomB',
      'PumpsCount','cSpacePressCount','BalloonExploded','CoinsCollectedBalloon','CoinsSaved','CoinsTotal','Timestamp'
    ];
    const hasAll = required.every(k => Object.prototype.hasOwnProperty.call(data, k));
    if (!hasAll) {
      console.log('ℹ️ Skipping partial telemetry send; will send on final.');
      return;
    }

    const fmt1 = (v)=>{
      const n = Number(v);
      if (!isFinite(n)) return String(v ?? '');
      return (Math.round(n * 10) / 10).toFixed(1);
    };
    const form = new FormData();
    form.append('PlayerID', String(data.PlayerID));
    form.append('TimeBeforeStart', String(data.TimeBeforeStart));
    form.append('FirstPathChoice', String(data.FirstPathChoice));
    form.append('DecisionTime', fmt1(data.DecisionTime));
    form.append('CoinsRoomA', fmt1(data.CoinsRoomA));
    form.append('ChangedDirectionCount', fmt1(data.ChangedDirectionCount));
    form.append('IdleTime', fmt1(data.IdleTime));
  form.append('TilesSteppedOnTrail', fmt1(data.TilesSteppedOnTrail));
  form.append('CoinsRoomB', fmt1(data.CoinsRoomB));
  form.append('PumpsCount', fmt1(data.PumpsCount));
  form.append('cSpacePressCount', fmt1(data.cSpacePressCount));
  form.append('BalloonExploded', fmt1(data.BalloonExploded));
    form.append('CoinsCollectedBalloon', fmt1(data.CoinsCollectedBalloon));
    form.append('CoinsSaved', fmt1(data.CoinsSaved));
    form.append('CoinsTotal', fmt1(data.CoinsTotal));
    form.append('conflict_choice_flag', fmt1(data.conflict_choice_flag || 0));
    form.append('time_to_walk_for_key_ms', fmt1(data.time_to_walk_for_key_ms || 0));
    form.append('distance_traveled_after_conflict', fmt1(data.distance_traveled_after_conflict || 0));
    form.append('hesitation_before_walking_ms', fmt1(data.hesitation_before_walking_ms || 0));
    form.append('proximity_to_NPC_after_conflict', fmt1(data.proximity_to_NPC_after_conflict || 0));
    form.append('cooperation_choice_flag', fmt1(data.cooperation_choice_flag || 0));
    form.append('time_to_door_after_cooperation', fmt1(data.time_to_door_after_cooperation || 0));
    form.append('willingness_to_wait_for_NPC', fmt1(data.willingness_to_wait_for_NPC || 0));
    form.append('distance_kept_from_NPC_before_choice', fmt1(data.distance_kept_from_NPC_before_choice || 0));
    form.append('Timestamp', String(data.Timestamp));

    fetch(url, { method: 'POST', mode: 'no-cors', body: form })
      .then(() => console.log('✅ Sent final schema (no-cors)'))
      .catch(err => console.error('❌ Send failed:', err));
  } catch (e) {
    console.error('❌ sendDataToSheet exception:', e);
  }
}
