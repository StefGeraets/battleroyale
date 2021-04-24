const game = {
  container: document.querySelector(".grid"),
  map: document.querySelector(".map"),
  wall: document.querySelector(".animated-wall"),
  timer: document.querySelector(".timer"),
  timeBar: document.querySelector(".timebar"),
  countdownWrapper: document.querySelector('.countdownWrapper'),
  countdownTime: document.querySelector('.countdownTime'),
  gridNodes: "",
  loop: "",
  root: document.documentElement,
  keys: {
    space: 32,
    left: 37,
    up: 38,
    right: 39,
    down: 40,
  },
  clickCount: 0,
  avatar: {
    squareSize: 24,
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
    file: "warhorn.mp3",
    volume: 0.1,
  },
  safeZoneWidth: [20, 10, 5, 2],
  centerSelector: ".grid-item-2-2",
  gameState: "paused", // started || paused || ended
  zoneTarget: [],
  time: {
    total: 3, // in minutes
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
  f: {
    increaseClick: function () { game.clickCount += 1},
  },
}

game.time.total = game.time.total * 60000;

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


addTimesInMilliseconds();

let avatar = document.createElement("div");
avatar.style.width = game.avatar.squareSize + "px";
avatar.style.height = game.avatar.squareSize + "px";
avatar.style.backgroundColor = game.avatar.color;

function makeGrid(rows, cols) {
  game.container.style.setProperty("--grid-rows", rows);
  game.container.style.setProperty("--grid-cols", cols);
  game.container.style.setProperty("--cell-width", game.grid.cellSize + "px");

  let x = 0;
  let y = 0;
  for (let c = 0; c < rows * cols; c++) {
    let cell = document.createElement("div");

    y = c%cols;

    if (y === (rows - 1)) {
      x++
    }

    game.container.appendChild(cell).className = "grid-item grid-item-" + x + "-" + y;
  }
}

function initGame() {
  console.log(game)
  makeGrid(game.grid.rows, game.grid.cols);

  game.gridNodes = document.querySelectorAll(".grid-item");
  let firstGridItem = document.querySelector(".grid-item");
  firstGridItem.appendChild(avatar);

  game.centerSelector = `.grid-item-${game.grid.rows / 2}-${game.grid.cols / 2}`;
  game.root.style.setProperty('--closing-time', `${game.time.circleClosing}ms`);
  game.root.style.setProperty('--circle-delay', `${game.time.circleDelay}ms`);
  game.root.style.setProperty('--game-time', `${game.time.total}ms`);
  game.root.style.setProperty('--countdown-height', `${game.time.countdown}vh`);


  timelineGen();

  game.loop = setInterval(gameTimer, game.time.tickSpeed);
}



function gameState() {
  if (game.gameState !== "paused") {
    game.time.current += game.time.tickSpeed;
    updateMapState();
  }
  
  if(game.time.current > game.time.total) {
    clearInterval(game.loop);
  }
}

function pauseGame(e) {
  if(e.keyCode === game.keys.space) {
    if (game.gameState === "paused") {
      game.gameState = "started"
      game.wall.style.animationPlayState = 'running'
      game.timer.style.animationPlayState = 'running'
    } else {
      game.gameState = "paused"
      game.wall.style.animationPlayState = 'paused'
      game.timer.style.animationPlayState = 'paused'
    }
  }  
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
    game.timeBar.appendChild(time);
  })
}

function countdownClock() {
  let countdownSeconds = (game.time.circleDelay / 1000 | 0)

  var timer = new CountDownTimer(countdownSeconds),
      timeObj = CountDownTimer.parse(countdownSeconds);
  
  formatClock(timeObj.minutes, timeObj.seconds);

  game.countdownWrapper.classList.add("show");
  timer.onTick(formatClock).onTick(removeClock).start();
}

function removeClock() {
  if (this.expired()) {
    setTimeout(() => {
      game.countdownWrapper.classList.remove('show')
    }, 1000);
  }
}

function formatClock(minutes, seconds) {
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;
  game.countdownTime.textContent = `${minutes}:${seconds}`;
}

function handleKey(e) {
  switch (e.keyCode) {
    case game.keys.left:
      game.avatar.position.y--;
      break;
    case game.keys.up:
      game.avatar.position.x--;
      break;
    case game.keys.right:
      game.avatar.position.y++;
      break;
    case game.keys.down:
      game.avatar.position.x++;
      break;
    default: return
  }

  let gridItem = document.querySelector(".grid-item-" + game.avatar.position.x + "-" + game.avatar.position.y);
  gridItem.appendChild(avatar);
}

function storeTarget(item) {
  if (game.zoneTarget.length < game.safeZoneWidth.length) {
    game.zoneTarget.push(item.target);
  }
}

function handleCirclePlacement(item) {
  if (game.clickCount === 0) {
    placeWall(item);
  } else if (game.clickCount < game.safeZoneWidth.length) {
    game.wall.classList.remove('closeCircle')

    let startTop = game.root.style.getPropertyValue("--end-top");
    let startLeft = game.root.style.getPropertyValue("--end-left");
    let pos = getItemOffset(item);
  
    setWallStartPosition(startTop, startLeft);
    setWallEndPosition(pos.top, pos.left);
    
    game.root.style.setProperty('--start-width', game.safeZoneWidth[game.clickCount - 1] * game.grid.cellSize + "px");
    game.root.style.setProperty('--circle-width', game.safeZoneWidth[game.clickCount]);

    game.wall.classList.add('closeCircle')
  }
  game.wall.addEventListener("animationstart", playStartSound, false);
  placeCircle(item);
}

function placeCircle(gridCell) {
  game.gridNodes.forEach(function(gridItem) {
    gridItem.classList.remove("selected")
  })

  gridCell.classList.add("selected");
}

function playStartSound() {
  var horn = new Audio(`./sounds/${game.sound.file}`);
  horn.volume = game.sound.volume;
  horn.play();
}

function placeWall(item) {
  const offset = getItemOffset(item);
  
  setWallStartPosition(offset.top, offset.left);
  setWallEndPosition(offset.top, offset.left);
  
  game.wall.classList.add('closeCircle')
}

function setWallStartPosition(top, left) {
  top = parseInt(top, 10);
  left = parseInt(left, 10);
  game.root.style.setProperty("--start-top", top + "px");
  game.root.style.setProperty("--start-left", left + "px");
}

function setWallEndPosition(top, left) {
  game.root.style.setProperty("--end-top", top + "px");
  game.root.style.setProperty("--end-left", left + "px");
}

function getItemOffset(item) {
  return {
    top: item.offsetTop + (game.grid.cellSize / 2),
    left: item.offsetLeft + (game.grid.cellSize / 2),
  };
}

window.addEventListener("keydown", handleKey);

function checkDm() {
  if (confirm("Are you a DM")) {
    window.open('dmview.html', "_blank");
  }
}

// checkDm();
initGame();


window.addEventListener("keydown", pauseGame);
game.gridNodes.forEach(function(item) {
  item.addEventListener("click", storeTarget);
})

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