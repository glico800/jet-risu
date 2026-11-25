(function () {
  var canvas = document.getElementById('stage');
  var ctx = canvas.getContext('2d');

  var W = 0, H = 0, dpr = 1;
  var sprite = null;
  var squirrels = [];
  var explosions = [];
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

    placeSquirrels();
    explosions.length = 0;
  }

  // 元ネタと同じく、画面の広さに応じて数を決めてランダムに並べる
  function placeSquirrels() {
    var size = sprite.size;
    var count = Math.round((W * H) / (96 * 96) / 3);
    squirrels.length = 0;
    for (var i = 0; i < count; i++) {
      squirrels.push({
        x: Math.random() * (W - size),
        y: Math.random() * (H - size),
        offset: Math.random() * JetSquirrel.FRAMES,
        vx: 0,
        vy: 0
      });
    }
  }

  document.getElementById('reset').addEventListener('click', placeSquirrels);

  // タップ（クリック）した場所で爆発させる
  function spawnExplosion(x, y) {
    var R = Math.max(70, Math.min(180, Math.min(W, H) * 0.22));
    explosions.push(new Explosion(x, y, R));
    knockBack(x, y, R);
  }

  // 爆発の円の中にいるリスを、中心から外へ弾き飛ばす
  var KNOCK_FRICTION = 12; // 大きいほどサッと動いてすぐ止まる（進む距離は変わらない）
  function knockBack(x, y, R) {
    var half = sprite.size / 2;
    var reach = R * 1.4; // 衝撃波の輪と同じ大きさ
    for (var i = 0; i < squirrels.length; i++) {
      var s = squirrels[i];
      var dx = s.x + half - x;
      var dy = s.y + half - y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d >= reach) continue;
      if (d < 1) {
        var a = Math.random() * Math.PI * 2;
        dx = Math.cos(a); dy = Math.sin(a); d = 1;
      }
      // 円の外まで出られる初速を与える（中心に近いほど強く飛ぶ）
      var dist = reach - d + half;
      var v = dist * KNOCK_FRICTION;
      s.vx += dx / d * v;
      s.vy += dy / d * v;
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    var rect = canvas.getBoundingClientRect();
    spawnExplosion(e.clientX - rect.left, e.clientY - rect.top);
  });

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
      // 弾かれた勢いで動き、だんだん止まる。画面の端では跳ね返る
      if (s.vx !== 0 || s.vy !== 0) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.x < 0 || s.x > W - size) s.vx = -s.vx;
        if (s.y < 0 || s.y > H - size) s.vy = -s.vy;
        var damp = Math.exp(-KNOCK_FRICTION * dt);
        s.vx *= damp;
        s.vy *= damp;
        if (Math.abs(s.vx) < 1 && Math.abs(s.vy) < 1) s.vx = s.vy = 0;
      }
      s.x = Math.max(0, Math.min(W - size, s.x + Math.random() * 4 - 2));
      s.y = Math.max(0, Math.min(H - size, s.y + Math.random() * 4 - 2));
      var f = Math.floor(time * ANIME_FPS + s.offset) % JetSquirrel.FRAMES;
      ctx.drawImage(sprite.frames[f], s.x, s.y, size, size);
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
