// ジェット・エゾリスのスプライト生成
// 毎フレーム描くと重いので、アニメーションの各コマを事前にオフスクリーン Canvas へ描いておく。
var JetSquirrel = (function () {
  var BOX = 140;          // スプライト 1 コマの論理サイズ
  var FRAMES = 6;         // アニメーションのコマ数
  var HEADING = 0.68;     // 左向きから時計回りに回す角度 (rad)。左上を向かせる

  var FUR = '#8c7b70';        // 冬毛の灰褐色
  var FUR_DARK = '#5f5048';
  var FUR_FAR = '#6e5f56';    // 奥側の脚
  var BELLY = '#f4efe7';
  var TAIL = '#7a6a60';
  var TAIL_EDGE = '#a8978a';
  var TUFT = '#3a2f29';       // 耳の房毛

  function bez(p, t) {
    var u = 1 - t;
    return [
      u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
      u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1]
    ];
  }

  function circle(g, x, y, r, color) {
    g.fillStyle = color;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }

  function ellipse(g, x, y, rx, ry, rot, color) {
    g.fillStyle = color;
    g.beginPath();
    g.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
    g.fill();
  }

  function lerp(a, b, k) {
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  }

  function leg(g, x0, y0, end, width, color) {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(end[0], end[1]);
    g.stroke();
    circle(g, end[0], end[1], width * 0.62, color);
  }

  // 後方へなびくふさふさの尻尾
  function drawTail(g, phase) {
    var w = Math.sin(phase * Math.PI * 2) * 4;
    var P = [[18, 4], [40, 16 + w], [62, 10 - w], [68, -14 + w]];
    var N = 24;
    var pts = [];
    for (var i = 0; i < N; i++) {
      var t = i / (N - 1);
      var p = bez(P, t);
      var r = 4 + 7.5 * Math.sin(Math.PI * (0.12 + 0.8 * t));
      pts.push([p[0], p[1], r, i]);
    }
    // 毛先のギザギザ感を出す外周
    pts.forEach(function (p) {
      circle(g, p[0], p[1], p[2] + 2.2 + Math.sin(p[3] * 2.3) * 1.2, TAIL_EDGE);
    });
    pts.forEach(function (p) {
      circle(g, p[0], p[1], p[2], TAIL);
    });
    // 毛並み
    g.strokeStyle = FUR_DARK;
    g.lineWidth = 1.1;
    g.lineCap = 'round';
    for (var j = 3; j < N - 2; j += 3) {
      var a = pts[j], b = pts[j + 2];
      g.beginPath();
      g.moveTo(a[0], a[1] - a[2] * 0.3);
      g.lineTo(b[0] + 2, b[1] - b[2] * 0.1);
      g.stroke();
    }
  }

  function drawFlame(g, x, y, len) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    var glow = g.createRadialGradient(x + len * 0.3, y, 0, x + len * 0.3, y, len * 0.9);
    glow.addColorStop(0, 'rgba(255,150,40,0.55)');
    glow.addColorStop(1, 'rgba(255,90,0,0)');
    g.fillStyle = glow;
    g.beginPath();
    g.arc(x + len * 0.3, y, len * 0.9, 0, Math.PI * 2);
    g.fill();

    var layers = [
      [1.0, 6.2, '#ff5a00'],
      [0.72, 4.2, '#ffc23a'],
      [0.42, 2.4, '#fffbe6']
    ];
    layers.forEach(function (l) {
      var L = len * l[0], h = l[1];
      g.fillStyle = l[2];
      g.beginPath();
      g.moveTo(x, y - h);
      g.quadraticCurveTo(x + L * 0.55, y - h * 1.15, x + L, y);
      g.quadraticCurveTo(x + L * 0.55, y + h * 1.15, x, y + h);
      g.closePath();
      g.fill();
    });
    g.restore();
  }

  // 背中のジェット（元ネタの「白い筒＋赤いベルト＋炎」を踏襲）
  function drawJet(g, flick) {
    g.save();
    g.translate(4, -13);
    g.rotate(-0.1);

    // 胴に回したベルト
    g.strokeStyle = '#c62828';
    g.lineWidth = 2.6;
    g.lineCap = 'butt';
    g.beginPath();
    g.moveTo(-5, 3); g.lineTo(-8, 22);
    g.moveTo(10, 3); g.lineTo(12, 21);
    g.stroke();

    // ノズル
    g.fillStyle = '#4b5563';
    g.beginPath();
    g.moveTo(15, -3.5); g.lineTo(22, -5.5); g.lineTo(22, 5.5); g.lineTo(15, 3.5);
    g.closePath();
    g.fill();

    // タンク
    var grad = g.createLinearGradient(0, -6, 0, 6);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.55, '#e3e7ec');
    grad.addColorStop(1, '#a9b1bb');
    g.fillStyle = grad;
    g.strokeStyle = '#6b7280';
    g.lineWidth = 1;
    g.beginPath();
    g.roundRect(-12, -6, 28, 12, 5.5);
    g.fill();
    g.stroke();
    g.fillStyle = '#d32f2f';
    g.fillRect(-1, -6, 4.5, 12);

    drawFlame(g, 22, 0, 18 + flick * 12);
    g.restore();
  }

  function drawHead(g) {
    g.save();
    g.translate(-21, -6);
    // 奥の耳
    g.fillStyle = FUR_DARK;
    g.beginPath();
    g.moveTo(5, -7); g.lineTo(11, -20); g.lineTo(13, -5);
    g.closePath();
    g.fill();
    drawTufts(g, 11, -20, 0.8);

    circle(g, 0, 0, 11.5, FUR);
    ellipse(g, -9, 3, 7.5, 5.8, -0.1, FUR);
    ellipse(g, -6, 6.5, 6.5, 3.8, -0.1, BELLY);
    circle(g, -16, 1.8, 1.9, '#2a1f1b');

    // 目
    circle(g, -4, -2, 2.9, '#14100e');
    circle(g, -5, -3.1, 1.0, '#ffffff');

    // 手前の耳
    g.fillStyle = FUR;
    g.beginPath();
    g.moveTo(-1, -8); g.lineTo(3, -23); g.lineTo(7, -7);
    g.closePath();
    g.fill();
    g.fillStyle = '#c9a99a';
    g.beginPath();
    g.moveTo(1, -9); g.lineTo(3, -18); g.lineTo(5, -9);
    g.closePath();
    g.fill();
    drawTufts(g, 3, -23, 1);
    g.restore();
  }

  // エゾリスの冬毛の特徴、耳先の長い房毛
  function drawTufts(g, x, y, s) {
    g.strokeStyle = TUFT;
    g.lineWidth = 1.5 * s;
    g.lineCap = 'round';
    [[-4, -9], [-1, -11], [2, -10], [4, -7]].forEach(function (d) {
      g.beginPath();
      g.moveTo(x, y + 1);
      g.quadraticCurveTo(x + d[0] * 0.3, y + d[1] * 0.6, x + d[0] * s + 2, y + d[1] * s);
      g.stroke();
    });
  }

  function drawSquirrel(g, phase, flick) {
    var k = (Math.sin(phase * Math.PI * 2) + 1) / 2;
    var k2 = (Math.sin(phase * Math.PI * 2 + 0.7) + 1) / 2;

    drawTail(g, phase);

    // 奥側の脚
    leg(g, -10, 8, lerp([-11, 20], [-27, 10], k2), 4.4, FUR_FAR);
    leg(g, 18, 10, lerp([12, 21], [34, 13], k2), 5, FUR_FAR);

    // 胴体
    g.save();
    g.translate(4, 4);
    g.rotate(-0.12);
    g.beginPath();
    g.ellipse(0, 0, 21, 12.5, 0, 0, Math.PI * 2);
    g.fillStyle = FUR;
    g.fill();
    g.clip();
    ellipse(g, -5, 10, 18, 7, 0, BELLY);
    g.restore();
    ellipse(g, 15, 6, 10, 8.5, 0.3, FUR); // 後ろ脚の付け根

    // 手前の脚
    leg(g, -12, 9, lerp([-13, 21], [-30, 13], k), 4.6, FUR);
    leg(g, 16, 11, lerp([9, 22], [33, 16], k), 5.4, FUR);

    drawHead(g);
    drawJet(g, flick);
  }

  function hash(i) {
    var s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  // scale: 画面上の大きさ, dpr: devicePixelRatio
  function buildFrames(scale, dpr) {
    var frames = [];
    for (var i = 0; i < FRAMES; i++) {
      var c = document.createElement('canvas');
      var px = Math.ceil(BOX * scale * dpr);
      c.width = c.height = px;
      var g = c.getContext('2d');
      g.scale(scale * dpr, scale * dpr);
      g.translate(BOX / 2, BOX / 2);
      g.rotate(HEADING);
      g.translate(-16, 4);
      drawSquirrel(g, i / FRAMES, hash(i));
      frames.push(c);
    }
    return { frames: frames, size: BOX * scale };
  }

  return { buildFrames: buildFrames, HEADING: HEADING, FRAMES: FRAMES };
})();
