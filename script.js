const game = {
  el: {
    container: document.querySelector(".grid"),
    wall: document.querySelector(".animatedWall"),
    timer: document.querySelector(".timer"),
    timeBar: document.querySelector(".timebar"),
    countdownWrapper: document.querySelector('.countdownWrapper'),
    countdownTime: document.querySelector('.countdownTime'),
    settings: document.querySelector('.settings'),
    combatants: document.querySelector('.count'),
    overlay: document.querySelector('.overlay'),
    play: document.querySelector('.playIcon'),
    pause: document.querySelector('.pauseIcon'),
    gridNodes: "",
    root: document.documentElement,
    timer: {
      gameTimeInput: document.querySelector('[name="game-time"]'),
      timerDisplay: document.querySelector('#timer-display'),
      timerSetButton: document.querySelector('.btn-timer-set'),
      timerAlertMessage: document.querySelector('[data-already-started-alert]')
    }
  },
  keys: {
    space: 'Space',
    left: 'ArrowLeft',
    up: 'ArrowUp',
    right: 'ArrowRight',
    down: 'ArrowDown',
  },
  token: {
    element: document.createElement("div"),
    size: 24,
    color: "#ff0000",
    position: {
      x: 0,
      y: 0,
    },
  },
  grid: {
    rows: 24,
    cols: 24,
    cellSize: 32
  },
  sound: {
    closing: "warhorn.mp3",
    ring: "trumpet.mp3",
    volume: 0.1,
  },
  combatants: {
    total: 100,
    remaining: 100
  },
  clickCount: 0,
  loop: "",
  safeZoneWidth: [20, 10, 5, 2],
  centerSelector: ".grid-item-2-2",
  gameState: "paused", // started || paused || ended
  zoneTarget: [],
  time: {
    total: 1, // in minutes
    current: 0, // in milliseconds
    circleClosing: 2000, // in milliseconds
    circleDelay: 2000, // in milliseconds
    tickSpeed: 100,
    beforeStart: 10, // in percent
    restrictingPerc: 9, // in percent
    countdown: 4, // in percent
    beforeNextZone: [11, 11, 7, 7], // in percent
    startPercent: [],
    startTimes: [],
  },
  mapState: "start",
  settingWindow: "dmSettings",
  f: {
    increaseClick: function () { game.clickCount += 1},
  },
}

game.time.total = calculateMilliseconds(game.time.total);

function calculateMilliseconds(minutes) {
  return minutes * 60000;
}

function addTimesInMilliseconds() {
  let onePerc = game.time.total / 100
  let order = [
    game.time.beforeStart,
    game.time.beforeNextZone[0],
    game.time.countdown + game.time.restrictingPerc,
    game.time.beforeNextZone[1],
    game.time.countdown + game.time.restrictingPerc,
    game.time.beforeNextZone[2],
    game.time.countdown + game.time.restrictingPerc,
    game.time.beforeNextZone[3],
    game.time.countdown + game.time.restrictingPerc,
  ]

  game.time.startPercent = order;

  for (let i = 0; i < order.length; i++) {
    let ms = order[i] * onePerc;
    
    let amount = 0;
    if (game.time.startTimes.length) {
      amount = game.time.startTimes[game.time.startTimes.length - 1];
    }
    
    amount += ms;
    
    game.time.startTimes.push(amount)
  }

  game.time.circleClosing = game.time.restrictingPerc * onePerc;
  game.time.circleDelay = game.time.countdown * onePerc;
}

function makeGrid(rows, cols) {
  game.el.container.style.setProperty("--grid-rows", rows);
  game.el.container.style.setProperty("--grid-cols", cols);
  game.el.root.style.setProperty("--cell-width", game.grid.cellSize + "px");

  let x = 0;
  let y = 0;
  for (let c = 0; c < rows * cols; c++) {
    let cell = document.createElement("div");

    y = c%cols;
    
    game.el.container.appendChild(cell).className = "grid-item grid-item-" + x + "-" + y;

    if (y === (rows -1)) {
      x++
    }
  }
}

function initGame() {
  addTimesInMilliseconds();

  makeGrid(game.grid.rows, game.grid.cols);
  generateToken();
  setGridNodes();
  setToken();
  setCenterSelector();
  setStartingStyles();

  timelineGen();

  game.loop = setInterval(gameTimer, game.time.tickSpeed);
}

function generateToken() {
  let token = game.token.element;
  token.style.width = game.token.size + "px";
  token.style.height = game.token.size + "px";
  token.style.backgroundColor = game.token.color;
}

function setGridNodes() {
  game.el.gridNodes = document.querySelectorAll(".grid-item");
}

function setToken() {
  let token = game.token.element;
  let firstGridItem = document.querySelector(".grid-item");
  firstGridItem.appendChild(token);
}

function setCenterSelector() {
  game.centerSelector = `.grid-item-${game.grid.rows / 2}-${game.grid.cols / 2}`;
}

function setStartingStyles() {
  game.el.root.style.setProperty('--closing-time', `${game.time.circleClosing}ms`);
  game.el.root.style.setProperty('--circle-delay', `${game.time.circleDelay}ms`);
  game.el.root.style.setProperty('--game-time', `${game.time.total}ms`);
  game.el.root.style.setProperty('--countdown-height', `${game.time.countdown}vh`);
}


function gameState() {
  if (game.gameState !== "paused") {
    game.time.current += game.time.tickSpeed;
    updateMapState();
    updateTimerDisplay();
  }
  
  if(game.time.current > game.time.total) {
    clearInterval(game.loop);
  }
}

function pauseGame(e) {
  if(e.code === game.keys.space || e === game.keys.space) {
    if(window.name === game.settingWindow) {
      channel.postMessage({action: "pause"})
      togglePlayPauseButton();
    }

    if (game.gameState === "paused") {
      game.gameState = "started"
      setAnimationPlayState('running');
    } else {
      game.gameState = "paused"
      setAnimationPlayState('paused');
    }
  }  
}

function togglePlayPauseButton() {
  game.el.pause.classList.toggle('show');
  game.el.play.classList.toggle('show');
}

function setAnimationPlayState(state) {
  game.el.wall.style.animationPlayState = state;
  game.el.timer.style.animationPlayState = state;
}

function gameTimer() {
  gameState();
}

function updateMapState() {
  let state = game.mapState;
  if (game.time.current == game.time.startTimes[8]) { state = "end" }
  if (game.time.current == game.time.startTimes[7]) { state = "zone 4"; handleCirclePlacement(game.zoneTarget[game.clickCount]); countdownClock();}
  if (game.time.current == game.time.startTimes[6]) { state = "idle 4"; game.f.increaseClick(); }
  if (game.time.current == game.time.startTimes[5]) { state = "zone 3"; handleCirclePlacement(game.zoneTarget[game.clickCount]); countdownClock();}
  if (game.time.current == game.time.startTimes[4]) { state = "idle 3"; game.f.increaseClick(); }
  if (game.time.current == game.time.startTimes[3]) { state = "zone 2"; handleCirclePlacement(game.zoneTarget[game.clickCount]); countdownClock();}
  if (game.time.current == game.time.startTimes[2]) { state = "idle 2"; game.f.increaseClick(); }
  if (game.time.current == game.time.startTimes[1]) { state = "zone 1"; handleCirclePlacement(game.zoneTarget[game.clickCount]); countdownClock(); }
  if (game.time.current == game.time.startTimes[0]) { state = "idle 1"  }
  
  game.mapState = state;
}

function timelineGen() { 
  game.time.startPercent.forEach(timeBlock => {
    let time = document.createElement('div');
    time.classList.add('timeblock');
    time.style.height = `${timeBlock}vh`
    game.el.timeBar.appendChild(time);
  })
}

function countdownClock() {
  let countdownSeconds = (game.time.circleDelay / 1000 | 0)

  var timer = new CountDownTimer(countdownSeconds),
      timeObj = CountDownTimer.parse(countdownSeconds);
  
  formatClock(timeObj.minutes, timeObj.seconds);

  game.el.countdownWrapper.classList.add("show");
  timer.onTick(formatClock).onTick(removeClock).start();
}

function removeClock() {
  if (this.expired()) {
    setTimeout(() => {
      game.el.countdownWrapper.classList.remove('show')
    }, 1000);
  }
}

function formatClock(minutes, seconds) {
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;
  game.el.countdownTime.textContent = `${minutes}:${seconds}`;
}

function handleKey(e) {
  if (window.name === game.settingWindow) {
    channel.postMessage({action: "move", key: e.code});
  }
  switch (e.code || e) {
    case game.keys.left:
      if (game.token.position.y === 0) return;
      game.token.position.y--;
      break;
    case game.keys.up:
      if (game.token.position.x === 0) return;
      game.token.position.x--;
      break;
    case game.keys.right:
      if (game.token.position.y === game.grid.cols - 1) return;
      game.token.position.y++;
      break;
      case game.keys.down:
      if (game.token.position.x === game.grid.rows - 1) return;
      game.token.position.x++;
      break;
    default: return
  }

  let gridItem = document.querySelector(".grid-item-" + game.token.position.x + "-" + game.token.position.y);
  gridItem.appendChild(game.token.element);
}

function storeTarget(item) {
  let target = item;
  if(item.target) {
    target = item.target
  }
  if (game.zoneTarget.length < game.safeZoneWidth.length) {
    game.zoneTarget.push(target);
  }
}

function calculateFallbackItem() {
  // At zero clickcounts, we know for sure that only the center is a valid option
  if (game.clickCount === 0) {
    const center = document.querySelector(game.centerSelector);
    game.zoneTarget.push(center);

    return center;
  }

  // by checking array length - 1 we always return the previous zone-target
  const item = game.zoneTarget[game.zoneTarget.length - 1];
  game.zoneTarget.push(item);

  return item ?? document.querySelector(game.centerSelector);
}

function handleCirclePlacement(item) {
  item = item ?? calculateFallbackItem(); 

  if (game.clickCount === 0) {
    placeWall(item);
    game.el.root.style.setProperty('--next-circle-width', game.safeZoneWidth[game.clickCount + 1])
  } else if (game.clickCount < game.safeZoneWidth.length) {
    game.el.wall.classList.remove('closeCircle')

    let startTop = game.el.root.style.getPropertyValue("--end-top");
    let startLeft = game.el.root.style.getPropertyValue("--end-left");
    let pos = getItemOffset(item);
  
    setWallStartPosition(startTop, startLeft);
    setWallEndPosition(pos.top, pos.left);
    
    game.el.root.style.setProperty('--start-width', game.safeZoneWidth[game.clickCount - 1] * game.grid.cellSize + "px");
    game.el.root.style.setProperty('--circle-width', game.safeZoneWidth[game.clickCount]);
    game.el.root.style.setProperty('--next-circle-width', game.safeZoneWidth[game.clickCount + 1])
    game.el.wall.classList.add('closeCircle')
  }
  // game.el.wall.addEventListener("animationstart", function(){
  //   playSound(game.sound.closing)
  // }, false);
  placeCircle(item);
  playSound(game.sound.closing);
}

function placeCircle(gridCell) {
  game.el.gridNodes.forEach(function(gridItem) {
    gridItem.classList.remove("selected")
  })

  gridCell.classList.add("selected");
}

function playSound(sound) {
  var horn = new Audio(`./sounds/${sound}`);
  horn.volume = game.sound.volume;
  horn.play();
}

function placeWall(item) {
  const offset = getItemOffset(item);
  
  setWallStartPosition(offset.top, offset.left);
  setWallEndPosition(offset.top, offset.left);
  
  game.el.wall.classList.add('closeCircle')
}

function setWallStartPosition(top, left) {
  top = parseInt(top, 10);
  left = parseInt(left, 10);
  game.el.root.style.setProperty("--start-top", top + "px");
  game.el.root.style.setProperty("--start-left", left + "px");
}

function setWallEndPosition(top, left) {
  game.el.root.style.setProperty("--end-top", top + "px");
  game.el.root.style.setProperty("--end-left", left + "px");
}

function getItemOffset(item) {
  return {
    top: item.offsetTop + (game.grid.cellSize / 2),
    left: item.offsetLeft + (game.grid.cellSize / 2),
  };
}

function kill() {
  if(window.name === game.settingWindow) {
    channel.postMessage({action: "kill"})
  }
  game.combatants.remaining -= 1
  game.el.combatants.innerHTML = game.combatants.remaining
}

function toggleOverlay() {
  if (window.name === game.settingWindow) {
    channel.postMessage({action: "overlay"})
  } else {
    game.el.overlay.classList.toggle("show");
  }
}


function openSettings() {
  window.open('dmview.html', game.settingWindow, "width=1080,height=800");
}

game.el.root.addEventListener('mousemove', e => { 
  let x = e.pageX;
  let y = e.pageY;
  
  game.el.root.style.setProperty('--mouse-x', x + "px");
  game.el.root.style.setProperty('--mouse-y', y + "px");
});

const channel = new BroadcastChannel("wubg");

if(window.name === game.settingWindow) {
  game.grid.cellSize = 24;
  game.token.size = 20;
  game.el.root.style.setProperty("--show-timebar", "block");
}

setGameTime();
initGame();

window.addEventListener("keydown", handleKey);
window.addEventListener("keydown", pauseGame);

if(window.name === game.settingWindow) {
  game.el.gridNodes.forEach(function(item) {
    item.addEventListener("click", function(item) {
      channel.postMessage({action: "place", target: item.target.classList[1]})
    })
  });
  game.el.play.addEventListener("click", () => {
    pauseGame(game.keys.space);
  })
  game.el.pause.addEventListener("click", () => {
    pauseGame(game.keys.space);
  })
}

game.el.gridNodes.forEach(function(item) {
  item.addEventListener("click", storeTarget);
})

if(game.el.settings !== null) {
  game.el.settings.addEventListener("click", openSettings);
}

channel.onmessage = function(e) {
  if (e.data.action === "pause") {
    pauseGame(game.keys.space);
  }
  if (e.data.action === "place") {
    let target = document.querySelector(`.${e.data.target}`)
    storeTarget(target);
  }
  if (e.data.action === "move") {
    handleKey(e.data.key)
  }
  if (e.data.action === "kill") {
    kill();
  }
  if (e.data.action === "overlay") {
    toggleOverlay();
  }
}


// Countdown Clock: Credits robbmj https://stackoverflow.com/questions/20618355/how-to-write-a-countdown-timer-in-javascript
function CountDownTimer(duration, granularity) {
  this.duration = duration;
  this.granularity = granularity || 1000;
  this.tickFtns = [];
  this.running = false;
}

CountDownTimer.prototype.start = function() {
  if (this.running) {
    return;
  }
  this.running = true;
  var start = Date.now(),
      that = this,
      diff, obj;

  (function timer() {
    diff = that.duration - (((Date.now() - start) / 1000) | 0);

    if (diff > 0) {
      setTimeout(timer, that.granularity);
    } else {
      diff = 0;
      that.running = false;
    }

    obj = CountDownTimer.parse(diff);
    that.tickFtns.forEach(function(ftn) {
      ftn.call(this, obj.minutes, obj.seconds);
    }, that);
  }());
};

CountDownTimer.prototype.onTick = function(ftn) {
  if (typeof ftn === 'function') {
    this.tickFtns.push(ftn);
  }
  return this;
};

CountDownTimer.prototype.expired = function() {
  return !this.running;
};

CountDownTimer.parse = function(seconds) {
  return {
    'minutes': (seconds / 60) | 0,
    'seconds': (seconds % 60) | 0
  };
};

function setGameTime() {
  const value = game.el.timer.gameTimeInput.value;

  game.time.total = calculateMilliseconds(value);
  setTimerDisplay();
  initGame();
};

function setTimerDisplay() {
  game.el.timer.timerDisplay.textContent = formatTime(game.time.total);
}

function updateTimerDisplay() {
  if (game.time.current > 0) {
    game.el.timer.timerSetButton.setAttribute('disabled', 'disabled');
    game.el.timer.gameTimeInput.setAttribute('disabled', 'disabled');
    game.el.timer.timerAlertMessage.style.display = 'block';
  }
  game.el.timer.timerDisplay.textContent = formatTime(game.time.total - game.time.current);
}

function formatTime(time) {
  var seconds = Math.floor((time / 1000) % 60),
    minutes = Math.floor((time / (1000 * 60)) % 60),
    hours = Math.floor((time / (1000 * 60 * 60)) % 24);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return `${hours}:${minutes}:${seconds}`;
}