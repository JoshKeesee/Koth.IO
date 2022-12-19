const socket = io();
const canvas = document.getElementById("ctx");
const ctx = canvas.getContext("2d");
var id;
var chatOpen = -1;
var gameStarted = false;
var defaults = {};
var speed = 0;
var devMode = false;
var connected = false;
var lastJumpVal;

const playerMovement = {
  u: false,
  l: false,
  r: false,
  d: false,
  flying: false,
  cW: ctx.canvas.width,
  cH: ctx.canvas.height,
  platforms: []
};

const keyDownHandler = (e) => {
  if (e.key == "ArrowRight") {
    playerMovement.r = true;
  } else if (e.key == "ArrowLeft") {
    playerMovement.l = true;
  } else if (e.key == "ArrowUp") {
    playerMovement.u = true;
  } else if (e.key == "ArrowDown") {
    playerMovement.d = true;
  }
};

const keyUpHandler = (e) => {
  if (e.key == "ArrowRight") {
    playerMovement.r = false;
  } else if (e.key == "ArrowLeft") {
    playerMovement.l = false;
  } else if (e.key == "ArrowUp") {
    playerMovement.u = false;
  } else if (e.key == "ArrowDown") {
    playerMovement.d = false;
  } else if (e.key == "Escape" && devMode) {
    if (playerMovement.flying === false) {
      playerMovement.flying = true;
    } else {
      playerMovement.flying = false;
    }
  }
};

const drawPlayer = (player, leaderboard) => {
  ctx.beginPath();
  ctx.roundRect(player.x, player.y, player.w, player.h, 15);
  if (player.num === 1) {
    ctx.fillStyle = "#0095DD";
  } else if (player.num === 2) {
    ctx.fillStyle = "red";
  } else if (player.num === 3) {
    ctx.fillStyle = "green";
  } else if (player.num === 4) {
    ctx.fillStyle = "indigo";
  } else if (player.num === 5) {
    ctx.fillStyle = "orange";
  } else if (player.num === 6) {
    ctx.fillStyle = "blue";
  } else if (player.num === 7) {
    ctx.fillStyle = "purple";
  } else if (player.num === 8) {
    ctx.fillStyle = "yellow";
  } else {
    ctx.fillStyle = "black";
  }
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.roundRect(player.x + (player.w / 5.5), player.y + (player.h / 5.5), player.w / 1.5, player.h / 1.5, 50);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.roundRect((player.x + (player.w / 2.9)) + player.xVel, (player.y + (player.h / 2.9)) + player.yVel, player.w / 3, player.h / 3, 50);
  ctx.fillStyle = "black";
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.roundRect((player.x + (player.w / 1.9)) + player.xVel, (player.y + (player.h / 2.6)) + player.yVel, player.w / 10, player.h / 10, 50);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();

  if (Object.keys(leaderboard)[0] === player.id && leaderboard[Object.keys(leaderboard)[0]] > 0 && leaderboard[Object.keys(leaderboard)[0]] !== leaderboard[Object.keys(leaderboard)[1]]) {
    ctx.beginPath();
    ctx.moveTo(player.x + 1, player.y - 20);
    ctx.lineTo(player.x + 1, player.y);
    ctx.lineTo(player.x + 20, player.y);
    ctx.fillStyle = "yellow";
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.moveTo(player.x + (player.w / 2) - 20, player.y);
    ctx.lineTo(player.x + (player.w / 2), player.y - 30);
    ctx.lineTo(player.x + (player.w / 2) + 20, player.y);
    ctx.fillStyle = "yellow";
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.moveTo(player.x + player.w - 1, player.y - 20);
    ctx.lineTo(player.x + player.w - 1, player.y);
    ctx.lineTo(player.x + player.w - 20, player.y);
    ctx.fillStyle = "yellow";
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.roundRect(player.x - 4, player.y - 24, 8, 8, 8);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.roundRect(player.x + (player.w / 2) - 6, player.y - 34, 12, 12, 12);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.roundRect(player.x + player.w - 6, player.y - 24, 8, 8, 8);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.roundRect(player.x - 1, player.y - 1, player.w + 2, player.h / 5, 4);
    ctx.fillStyle = tinycolor("yellow").darken(5);
    ctx.fill();
    ctx.closePath();

    if (player.name != null) {
      ctx.fillStyle = "rgba(0, 0, 150, " + (player.h + 30) / 100 + ")";
      ctx.font = "bold 30px Arial";
      ctx.textAlign = "center";
      ctx.fillText(player.name, player.x + (player.w / 2), player.y - 40);
    }
  } else if (player.name !== null) {
    ctx.fillStyle = "rgba(0, 0, 150, " + (player.h + 30) / 100 + ")";
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.fillText(player.name, player.x + (player.w / 2), player.y - 10);
  }

  if (player.id !== id) {
    var left = player.x;
    var top = player.y;
    var width = player.w;
    var height = player.h;
    createObject(left, top, width, height, "player", null, player.id);
  } else {
    if (player.jumping && lastJumpVal !== player.jumping) {
      lastJumpVal = player.jumping;
      var jump = new Audio("/music/Jump.wav");
      jump.play();
    } else {
      lastJumpVal = player.jumping;
    }

    if (player.touching) {
      var bounce = new Audio("/music/Bounce.mp3");
      bounce.play();
    }
  }
};

socket.on("connect", () => {
  id = socket.id;
  connected = true;
  document.getElementById("play").onclick = () => {
    go();
  };
  document.getElementById("play").classList.remove("cursor-not-allowed");
      document.getElementById("disconnected").classList.add("hidden");
});

socket.on("disconnect", () => {
  document.getElementById("menu").classList.remove("hidden");
    document.getElementById("disconnected").classList.remove("hidden");
  connected = false;
  document.getElementById("play").onclick = () => {};
      document.getElementById("play").classList.add("cursor-not-allowed");
  document.getElementById("chat").classList.replace("left-0", "-left-full");
  document.getElementById("gameMusic").pause();
  document.getElementById("gameMusic").currentTime = 0;
  gameStarted = false;

  defaults.speed = 1;
  defaults.jumps = 1;
  defaults.padding = 1;
  defaults.force = 2;

  devMode = false;
});

function sendData() {
  socket.emit("playerMovement", [playerMovement, defaults, speed]);
}

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

function createObject(l, t, w, h, type, color = "#000cfa", playerId) {
  var length = playerMovement.platforms.length;
  playerMovement.platforms[length] = {};
  playerMovement.platforms[length].t = t;
  playerMovement.platforms[length].l = l;
  playerMovement.platforms[length].w = w;
  playerMovement.platforms[length].h = h;
  playerMovement.platforms[length].type = type;
  playerMovement.platforms[length].r = l + w;
  playerMovement.platforms[length].b = t + h;
  playerMovement.platforms[length].playerId = playerId;

  if (type === "platform") {
    for (var i = 4; i > 0; i--) {
      ctx.beginPath();
      ctx.roundRect(l + i, t - i, w, h, 4);
      ctx.fillStyle = tinycolor(color).darken(15).toString();
      ctx.fill();
      ctx.closePath();
    }

    ctx.beginPath();
    ctx.roundRect(l, t, w, h, 4);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
  }
}

function createBush(x, y) {
  var grd = ctx.createLinearGradient(x, y + 50, x, y);
  grd.addColorStop(0, "green");
  grd.addColorStop(1, "rgb(0, 200, 0)");

  ctx.beginPath();
  ctx.roundRect(x, y - 1, 50, 50, 50);
  ctx.fillStyle = grd;
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.roundRect(x + 40, y - 12 - 1, 50, 50, 50);
  ctx.fillStyle = grd;
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.roundRect(x + 80, y - 1, 50, 50, 50);
  ctx.fillStyle = grd;
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.rect(x + 25, y + 10 - 1, 80, 40);
  ctx.fillStyle = grd;
  ctx.fill();
  ctx.closePath();
}

function createCloud(x, y) {
  ctx.beginPath();
  ctx.roundRect(x, y, 100, 100, 100);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.roundRect(x + 80, y - 20, 100, 100, 100);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.roundRect(x + 160, y, 100, 100, 100);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.rect(x + 45, y + 10, 160, 90);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();
}

function drawMap() {
  createObject(100, 500, 400, 200, "platform", "#000cfa");
  createObject(700, 500, 400, 200, "platform", "#000cfa");
  createObject(200, 250, 100, 50, "platform", "yellow");
  createObject(550, 250, 100, 50, "platform", "green");
  createObject(900, 250, 100, 50, "platform", "red");
  createObject(750, 0, 100, 50, "platform", "yellow");
  createObject(350, 0, 100, 50, "platform", "red");
  createObject(550, -250, 100, 50, "platform", "green");
}

function drawScenery(x, y) {
  ctx.globalCompositeOperation = "destination-over";
  createCloud(-300 + (x / 1.05), -200 + (y / 1.05));
  createCloud(0 + (x / 1.1), -200 + (y / 1.1));
  createCloud(-600 + (x / 1.2), -200 + (y / 1.2));
  createCloud(300 + (x / 1.08), -250 + (y / 1.08));
  createCloud(300 + (x / 1.08), -250 + (y / 1.08));
  createCloud(600 + (x / 1.15), -230 + (y / 1.15));
  ctx.beginPath();
  ctx.roundRect(-800 + (x / 1.01), -400 + (y / 1.01), 300, 300, 500);
  ctx.fillStyle = "yellow";
  ctx.fill();
  ctx.closePath();
  ctx.globalCompositeOperation = "source-over";
  createBush(250, 450);
  createBush(725, 450);
}

function go() {
  var start = new Audio("/music/start.mp3");
  start.play();
  document.getElementById("menu").classList.add("hidden");
      document.getElementById("disconnected").classList.add("hidden");
  document.getElementById("chat").classList.replace("-left-full", "left-0");
  var name = document.getElementById("name").value;
  document.getElementById("gameMusic").play();
  gameStarted = true;

  defaults.speed = 1;
  defaults.jumps = 1;
  defaults.padding = 1;
  defaults.force = 2;

  if (document.getElementById("speed").classList.contains("-translate-y-2")) {
    defaults.speed = 1.5;
  } else if (document.getElementById("jumps").classList.contains("-translate-y-2")) {
    defaults.jumps = 2;
  } else if (document.getElementById("padding").classList.contains("-translate-y-2")) {
    defaults.padding = 0.7;
  } else if (document.getElementById("force").classList.contains("-translate-y-2")) {
    defaults.force = 4;
  }

  speed = defaults.speed;

  if (window.btoa(name) === "c2xhcGZpc2g=") {
    devMode = true;
    name = "Josh";
  }
  
  socket.emit("newPlayer", name);
}

socket.on("state", (gameState) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
  playerMovement.cW = ctx.canvas.width;
  playerMovement.cH = ctx.canvas.height;
  playerMovement.platforms = [];

  if (gameStarted && connected) {
    ctx.save();
    var player = gameState.players[id];
    ctx.translate(-1 * (player.x - ctx.canvas.width / 2) - player.w / 2, -1 * (player.y - ctx.canvas.height / 2) - player.h / 2);
    drawMap();
    drawPlayer(player, gameState.leaderboard);
  } else {
    ctx.save();
    ctx.scale(0.8, 0.8);
    ctx.translate(-1 * (600 - ctx.canvas.width / 1.6), -1 * (300 - ctx.canvas.height / 1.6));
    drawMap();
  }
  
  for (let i = 0; i < Object.keys(gameState.players).length; i++) {
    if (gameState.players[Object.keys(gameState.players)[i]].id !== id && gameState.players[Object.keys(gameState.players)[i]].name !== null) {
      drawPlayer(gameState.players[Object.keys(gameState.players)[i]], gameState.leaderboard);
    }
  }
      
  if (Object.keys(gameState.players[id]).length !== 0 && gameState.players[id].id === id && connected) {
    drawScenery(gameState.players[id].x, gameState.players[id].y);
  } else {
    drawScenery(canvas.width / 2, canvas.height / 2);
  }

  ctx.restore();
  ctx.beginPath();
  ctx.globalCompositeOperation = "destination-over";
  ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = "skyblue";
  ctx.fill();
  ctx.closePath();
  
  for (var i = 0; i < 3; i++) {
    document.getElementById("name" + (i + 1)).innerHTML = "";
}
  
  for (var i = 0; i < Object.keys(gameState.leaderboard).length && i < 3; i++) {
    document.getElementById("name" + (i + 1)).innerHTML = i + 1 + ") " + gameState.players[Object.keys(gameState.leaderboard)[i]].name + "<br>" +  gameState.leaderboard[Object.keys(gameState.leaderboard)[i]];
}

  if (Object.keys(gameState.players[id]).length !== 0 && gameState.players[id].id === id) { 
    document.getElementById("currName").innerHTML = "You) " + gameState.leaderboard[id];
  } else {
    document.getElementById("currName").innerHTML = "";
  }

  setTimeout(sendData, 0);
});

function enableChat() {
  document.getElementById("chatWindow").classList.replace("-left-full", "left-0");
  document.getElementById("notification").classList.add("hidden");
  chatOpen = 1;
  document.getElementById("chat").onclick = () => {
    disableChat();
  }
}

function disableChat() {
  document.getElementById("chatWindow").classList.replace("left-0", "-left-full");
  document.getElementById("notification").classList.add("hidden");
  chatOpen = -1;
  document.getElementById("chat").onclick = () => {
    enableChat();
  }
}

document.getElementById("input").addEventListener("keydown", (e) => {
  if (e.key == "Enter" && connected) {
    socket.emit("chat message", document.getElementById("input").value);
    document.getElementById("input").value = "";
  }
  e.preventDefault;
});

document.getElementById("name").addEventListener("keydown", (e) => {
  if (e.key == "Enter" && connected) {
    go();
  }
  e.preventDefault;
});

socket.on("newMessage", (message) => {
  var div = document.createElement("div");
  div.innerHTML = "<div class='font-bold'>" + message[0] + "</div><div>" + message[1] + "</div><hr class='my-4 h-px border-none bg-gray-300'>";
  div.classList = "break-words w-54";
  document.getElementById("messages").appendChild(div);
  if (chatOpen < 0) {
    var start = new Audio("/music/start.mp3");
    start.play();
    document.getElementById("notification").classList.remove("hidden");
  }
  document.getElementById("messages").scrollTop = document.getElementById("messages").scrollHeight;
});

socket.on("add score", (player) => {
  socket.emit("update leaderboard", player);
});

function choose(powerup) {
  document.getElementById("speed").classList.remove("-translate-y-2");
  document.getElementById("jumps").classList.remove("-translate-y-2");
  document.getElementById("padding").classList.remove("-translate-y-2");
  document.getElementById("force").classList.remove("-translate-y-2");
  document.getElementById(powerup).classList.add("-translate-y-2");
  var click = new Audio("/music/click.mp3");
  click.play();
}