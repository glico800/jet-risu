// 宇宙の背景。リスは左上へ進むので、星雲・星・惑星は右下へ流れていく。
var Space = function (heading) {
  // 流れる向き（リスの進行方向の逆）
  this.dx = Math.cos(heading);
  this.dy = Math.sin(heading);
  this.nebulaOffset = 0;
  this.planet = null;
  this.planetWait = 1.5;
  this.nebula = this.buildNebula(1024);
  this.layers = [];
};

Space.prototype.resize = function (w, h, ctx) {
  this.w = w;
  this.h = h;
  this.pattern = ctx.createPattern(this.nebula, 'repeat');
  var area = w * h;
  // [密度の分母, 速さ(px/s), 尾の長さ(秒換算), 太さ, 不透明度]
  var defs = [
    [2200, 70, 0, 1, 0.55],
    [9000, 420, 0.02, 1.2, 0.75],
    [32000, 1900, 0.045, 1.8, 0.9]
  ];
  this.layers = defs.map(function (d) {
    var stars = [];
    var n = Math.round(area / d[0]);
    for (var i = 0; i < n; i++) {
      stars.push({ x: Math.random() * w, y: Math.random() * h, tw: Math.random() * Math.PI * 2 });
    }
    return { stars: stars, speed: d[1], tail: d[2], width: d[3], alpha: d[4] };
  });
};

// 継ぎ目なく敷き詰められる星雲タイル
Space.prototype.buildNebula = function (size) {
  var c = document.createElement('canvas');
  c.width = c.height = size;
  var g = c.getContext('2d');
  g.fillStyle = '#06041a';
  g.fillRect(0, 0, size, size);
  var colors = ['120,60,200', '40,120,210', '200,60,150', '30,170,170', '90,40,160'];
  g.globalCompositeOperation = 'lighter';
  for (var i = 0; i < 16; i++) {
    var x = Math.random() * size, y = Math.random() * size;
    var r = size * (0.12 + Math.random() * 0.28);
    var col = colors[i % colors.length];
    var a = 0.05 + Math.random() * 0.08;
    for (var ox = -1; ox <= 1; ox++) {
      for (var oy = -1; oy <= 1; oy++) {
        var cx = x + ox * size, cy = y + oy * size;
        var grad = g.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, 'rgba(' + col + ',' + a + ')');
        grad.addColorStop(1, 'rgba(' + col + ',0)');
        g.fillStyle = grad;
        g.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
    }
  }
  return c;
};

Space.prototype.spawnPlanet = function () {
  var r = Math.min(this.w, this.h) * (0.08 + Math.random() * 0.12);
  if (r < 4) {
    this.planetWait = 2;
    return;
  }
  var pad = r * 2.4;
  var hue = Math.floor(Math.random() * 360);
  var c = document.createElement('canvas');
  var s = Math.ceil(pad * 2);
  c.width = c.height = s;
  var g = c.getContext('2d');
  var m = s / 2;
  var ringed = Math.random() < 0.6;
  var ring = function (front) {
    g.save();
    g.translate(m, m);
    g.rotate(-0.35);
    g.strokeStyle = 'hsla(' + (hue + 30) + ',60%,75%,0.55)';
    g.lineWidth = r * 0.18;
    g.beginPath();
    g.ellipse(0, 0, r * 2, r * 0.55, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
    g.stroke();
    g.restore();
  };
  if (ringed) ring(false);
  var body = g.createRadialGradient(m - r * 0.4, m - r * 0.4, r * 0.1, m, m, r);
  body.addColorStop(0, 'hsl(' + hue + ',55%,70%)');
  body.addColorStop(0.7, 'hsl(' + hue + ',50%,38%)');
  body.addColorStop(1, 'hsl(' + hue + ',45%,16%)');
  g.fillStyle = body;
  g.beginPath();
  g.arc(m, m, r, 0, Math.PI * 2);
  g.fill();
  if (ringed) ring(true);

  // 左上の画面外から現れて右下へ抜ける
  var startX = Math.random() * this.w * 0.9 - pad;
  var startY = -pad;
  if (Math.random() < 0.5) {
    startX = -pad;
    startY = Math.random() * this.h * 0.9 - pad;
  }
  this.planet = { img: c, x: startX, y: startY, half: pad, speed: 90 + Math.random() * 120 };
};

Space.prototype.update = function (dt) {
  this.nebulaOffset += dt * 25;

  var w = this.w, h = this.h, m = 100;
  for (var i = 0; i < this.layers.length; i++) {
    var L = this.layers[i];
    var vx = this.dx * L.speed * dt, vy = this.dy * L.speed * dt;
    for (var j = 0; j < L.stars.length; j++) {
      var s = L.stars[j];
      s.x += vx;
      s.y += vy;
      // 画面より一回り大きいトーラス上で折り返す
      if (s.x > w + m) s.x -= w + 2 * m;
      if (s.y > h + m) s.y -= h + 2 * m;
      s.tw += dt * 3;
    }
  }

  if (this.planet) {
    var p = this.planet;
    p.x += this.dx * p.speed * dt;
    p.y += this.dy * p.speed * dt;
    if (p.x - p.half > w || p.y - p.half > h) {
      this.planet = null;
      this.planetWait = 4 + Math.random() * 8;
    }
  } else {
    this.planetWait -= dt;
    if (this.planetWait <= 0) this.spawnPlanet();
  }
};

Space.prototype.draw = function (ctx) {
  var size = this.nebula.width;
  var ox = (this.dx * this.nebulaOffset) % size;
  var oy = (this.dy * this.nebulaOffset) % size;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.fillStyle = this.pattern;
  ctx.fillRect(-ox, -oy, this.w, this.h);
  ctx.restore();

  for (var i = 0; i < this.layers.length; i++) {
    var L = this.layers[i];
    if (i === 1 && this.planet) this.drawPlanet(ctx);
    ctx.lineCap = 'round';
    for (var j = 0; j < L.stars.length; j++) {
      var s = L.stars[j];
      if (L.tail === 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + (L.alpha * (0.6 + 0.4 * Math.sin(s.tw))) + ')';
        ctx.fillRect(s.x, s.y, L.width, L.width);
      } else {
        var len = L.speed * L.tail;
        var tx = s.x - this.dx * len, ty = s.y - this.dy * len;
        var grad = ctx.createLinearGradient(tx, ty, s.x, s.y);
        grad.addColorStop(0, 'rgba(180,210,255,0)');
        grad.addColorStop(1, 'rgba(255,255,255,' + L.alpha + ')');
        ctx.strokeStyle = grad;
        ctx.lineWidth = L.width;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }
    }
  }
};

Space.prototype.drawPlanet = function (ctx) {
  var p = this.planet;
  ctx.drawImage(p.img, p.x - p.half, p.y - p.half, p.half * 2, p.half * 2);
};
