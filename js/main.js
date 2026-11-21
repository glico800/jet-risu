(function () {
  var canvas = document.getElementById('stage');
  var ctx = canvas.getContext('2d');

  var W = 0, H = 0, dpr = 1;
  var sprite = null;
  var squirrels = [];
  var explosions = [];
  var explosionWait = 0;
  var space = new Space(JetSquirrel.HEADING);
  var ANIME_FPS = 14;

  function setup() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var scale = Math.max(0.55, Math.min(0.85, Math.min(W, H) / 900));
    sprite = JetSquirrel.buildFrames(scale, dpr);
    space.resize(W, H, ctx);

    // 元ネタと同じく、画面の広さに応じて数を決める
    var size = sprite.size;
    var count = Math.round((W * H) / (96 * 96) / 3);
    squirrels.length = 0;
    for (var i = 0; i < count; i++) {
      squirrels.push({
        x: Math.random() * (W - size),
        y: Math.random() * (H - size),
        offset: Math.random() * JetSquirrel.FRAMES
      });
    }
    explosions.length = 0;
  }

  function spawnExplosion() {
    var R = Math.max(70, Math.min(180, Math.min(W, H) * 0.22));
    explosions.push(new Explosion(R + Math.random() * (W - 2 * R), R + Math.random() * (H - 2 * R), R));
  }

  var last = performance.now();
  var time = 0;

  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;

    // 非表示タブなどで起動時に画面サイズが 0 だった場合は、サイズが取れるまで待つ
    if (W === 0 || H === 0) {
      if (window.innerWidth > 0 && window.innerHeight > 0) setup();
      requestAnimationFrame(frame);
      return;
    }

    space.update(dt);
    space.draw(ctx);

    // リス（小刻みに震えるのも元ネタ通り）
    var size = sprite.size;
    squirrels.sort(function (a, b) { return a.y - b.y; });
    for (var i = 0; i < squirrels.length; i++) {
      var s = squirrels[i];
      s.x = Math.max(0, Math.min(W - size, s.x + Math.random() * 4 - 2));
      s.y = Math.max(0, Math.min(H - size, s.y + Math.random() * 4 - 2));
      var f = Math.floor(time * ANIME_FPS + s.offset) % JetSquirrel.FRAMES;
      ctx.drawImage(sprite.frames[f], s.x, s.y, size, size);
    }

    // 爆発は常にどこかで 1 つ
    if (explosions.length === 0) {
      explosionWait -= dt;
      if (explosionWait <= 0) {
        spawnExplosion();
        explosionWait = Math.random() * 0.5;
      }
    }
    for (var j = explosions.length - 1; j >= 0; j--) {
      explosions[j].update(dt);
      explosions[j].draw(ctx);
      if (explosions[j].isEnd()) explosions.splice(j, 1);
    }

    requestAnimationFrame(frame);
  }

  var timer = null;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(setup, 200);
  });

  setup();
  requestAnimationFrame(function (now) {
    last = now;
    frame(now);
  });
})();
