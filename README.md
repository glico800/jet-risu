# JET-RISU

背中のジェットで宇宙を左上へ飛んでいく、エゾリスの群れを眺めるだけの Web アプリです。

[JET-SHIKA](https://de-teiu.github.io/jet-shika/) へのオマージュとして作りました。ジェットはそのままに、鹿を帯広にゆかりのあるエゾリスに、草原を宇宙に置き換えています。

## 動かし方

ビルドは不要です。`index.html` をブラウザで開くか、ローカルサーバーで配信します。

```bash
python3 -m http.server 8000
```

その後 http://localhost:8000/ を開きます。

## 構成

| ファイル | 役割 |
| --- | --- |
| `index.html` | エントリーポイント |
| `css/style.css` | 全画面 Canvas とクレジット表記 |
| `js/squirrel.js` | ジェット・エゾリスのスプライトを Canvas で描画 |
| `js/space.js` | 星雲・流れる星・通り過ぎる惑星 |
| `js/explosion.js` | タップ（クリック）した場所で起きる爆発 |
| `js/main.js` | 全体のループと画面サイズへの追従 |

画像や音声の素材は使わず、すべて Canvas API で描いています。
