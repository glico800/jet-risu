// タップ（クリック）した場所で起きる爆発（元ネタのエフェクトを手続き的に再現）
var Explosion = function (x, y, radius) {
  this.x = x;
  this.y = y;
  this.R = radius;
  this.t = 0;
  this.duration = 1.1;

  this.blobs = [];
  for (var i = 0; i < 16; i++) {
    var a = Math.random() * Math.PI * 2;
    this.blobs.push({
      dx: Math.cos(a), dy: Math.sin(a),
      dist: radius * (0.15 + Math.random() * 0.5),
      size: radius * (0.25 + Math.random() * 0.3),
      delay: Math.random() * 0.15
    });
  }
  this.sparks = [];
  for (var j = 0; j < 36; j++) {
    var b = Math.random() * Math.PI * 2;
    this.sparks.push({ dx: Math.cos(b), dy: Math.sin(b), v: radius * (1.2 + Math.random() * 1.6) });
  }
};

Explosion.prototype.update = function (dt) {
  this.t += dt;
};

Explosion.prototype.isEnd = function () {
  return this.t >= this.duration;
};

function easeOut(p) {
  return 1 - Math.pow(1 - p, 3);
}

Explosion.prototype.draw = function (ctx) {
  var p = Math.min(1, this.t / this.duration);
  var x = this.x, y = this.y, R = this.R;
  ctx.save();

  // 黒煙（後半）
  if (p > 0.25) {
    var sp = (p - 0.25) / 0.75;
    this.blobs.forEach(function (b) {
      var d = b.dist * (0.8 + 0.6 * easeOut(sp));
      var r = b.size * (1 + sp * 0.8);
      ctx.fillStyle = 'rgba(40,32,40,' + (0.45 * (1 - sp)) + ')';
      ctx.beginPath();
      ctx.arc(x + b.dx * d, y + b.dy * d - sp * R * 0.2, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.globalCompositeOperation = 'lighter';

  // 火球
  this.blobs.forEach(function (b) {
    var q = Math.max(0, Math.min(1, (p - b.delay) / 0.65));
    if (q <= 0 || q >= 1) return;
    var d = b.dist * easeOut(q);
    var r = b.size * (0.4 + easeOut(q));
    var bx = x + b.dx * d, by = y + b.dy * d;
    var a = 1 - q;
    var g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
    g.addColorStop(0, 'rgba(255,250,210,' + a + ')');
    g.addColorStop(0.35, 'rgba(255,180,40,' + a * 0.9 + ')');
    g.addColorStop(0.7, 'rgba(240,70,10,' + a * 0.6 + ')');
    g.addColorStop(1, 'rgba(200,30,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
  });

  // 閃光
  if (p < 0.18) {
    var f = p / 0.18;
    var fr = R * (0.3 + f * 0.7);
    var fg = ctx.createRadialGradient(x, y, 0, x, y, fr);
    fg.addColorStop(0, 'rgba(255,255,255,' + (1 - f) + ')');
    fg.addColorStop(1, 'rgba(255,220,150,0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(x, y, fr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 衝撃波
  ctx.strokeStyle = 'rgba(255,215,160,' + 0.6 * (1 - p) + ')';
  ctx.lineWidth = 3 * (1 - p) + 0.5;
  ctx.beginPath();
  ctx.arc(x, y, R * 1.4 * easeOut(p), 0, Math.PI * 2);
  ctx.stroke();

  // 火花
  var t = this.t;
  ctx.lineCap = 'round';
  ctx.lineWidth = 2;
  this.sparks.forEach(function (s) {
    var d = s.v * t * (1 - p * 0.4);
    var sx = x + s.dx * d, sy = y + s.dy * d;
    ctx.strokeStyle = 'rgba(255,210,120,' + (1 - p) + ')';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - s.dx * 14, sy - s.dy * 14);
    ctx.stroke();
  });

  ctx.restore();
};
