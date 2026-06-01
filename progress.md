# Progress

## Project Goal
茅ヶ崎ヘッドランドビーチを舞台とした、ライフセービング救助連携 3D シミュレータを GitHub Pages 上で公開・運用する。モバイル最適化された俯瞰3Dビューで、パトロール本部・チューブ・ボード・IRB・PWC・ドローン等の連携動線をタイムライン再生・編集できる教育/訓練ツール。

## Current Status
- 現在のフェーズ：拡張機能実装完了（ローカルビルド成功・GitHub Pages 公開前）
- 最新の安定状態：`main` 未push。`npm run build` 成功（JS 508KB / gzip 130KB）
- デプロイURL：未公開（リポジトリ push 後 `https://<user>.github.io/rescue-sim/`）
- 使用技術：Vite 5 + TypeScript 5 / Three.js 0.169 / Tailwind CSS 3 / GitHub Actions（Pages 自動デプロイ）

## Completed Tasks

### 2026-06-01 初期版プロジェクト構築
- 変更内容：Vite+TS+Three.js+Tailwind の最小構成を作成、汎用ビーチ＋固定シナリオで6アセット連携を可視化
- 変更ファイル：`package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/{main,scene,environment,assets,scenario,ui,style.css}.ts`, `.github/workflows/deploy.yml`, `.gitignore`
- 確認したこと：`npm install` / `npm run build` 成功
- build/test結果：成功（JS 492KB / gzip 124KB）
- 補足：base パスは `/rescue-sim/`

### 2026-06-01 茅ヶ崎ヘッドランド特化拡張
- 変更内容：
  - 地形を茅ヶ崎ヘッドランド（T字堤防・砂浜・道路・監視塔・旗）に置換
  - 要救助者を遊泳者/サーファー/SUP の3種から選択可、海面タップで初期位置指定
  - 環境設定（季節/天候/風向/風速）を追加し背景・フォグ・光源・海面色・旗・雨粒に反映
  - シナリオをオブジェクト化しプリセット3本（離岸流遊泳者/負傷サーファー/SUP漂流）を同梱
  - シナリオビルダー（編集モードで配置・時刻調整・フェーズ追加）＋ localStorage 保存・JSON I/O
  - UI を 4 ドロワー式（シナリオ/要救助者/環境/編集）に再構成、再生速度 1x/2x/4x
- 変更ファイル：
  - 新規：`src/{location,scenario-types,environment-state,storage,weather,victim,builder}.ts`, `src/scenarios/{drift-swimmer,injured-surfer,sup-drift}.ts`
  - 改修：`src/{environment,assets,scenario,ui,main,style.css}.ts`, `index.html`
- 確認したこと：`npm run build` 成功、TypeScript 型エラーなし
- build/test結果：成功（JS 508KB / gzip 130KB、20 modules）
- 補足：地形寸法は提供画像の比率を参考に概算。座標系は X=東西（+X東）、Z=南北（+Z内陸、-Z沖）

### 2026-06-01 base パス相対化（公開URL空白問題の修正）
- 変更内容：[vite.config.ts](vite.config.ts) の `base` を `/rescue-sim/` から `./` に変更。GitHub Pages 公開URLでアセット 404 になり 3D シーンが描画されなかった問題を解消
- 変更ファイル：`vite.config.ts`
- 確認したこと：`npm run build` 成功、`dist/index.html` の `<script>` / `<link>` が `./assets/...` の相対パスで出力されることを確認
- build/test結果：成功（JS 508KB / gzip 130KB、20 modules）
- 補足：リポジトリ名に依存しなくなったため、`file://` 直開きや任意サブパス配信でも動作する

### 2026-06-01 地形リアル化（海岸線・ヘッドランド堤防の輪郭曲線化）
- 変更内容：
  - 砂浜と波打ち際を `PlaneGeometry` から `THREE.Shape` + `ShapeGeometry` に置換し、海側/内陸側エッジを正弦合成でうねらせた
  - T字ヘッドランド堤防を `Box×2` から単一の `Shape` + `ExtrudeGeometry` に置換。先端を `absarc` の半円で丸め、付け根は `quadraticCurveTo` でテーパー
  - `HEADLAND.head.tipRadius` / `HEADLAND.rootTaper` を `src/location.ts` に追加
- 変更ファイル：`src/environment.ts`, `src/location.ts`
- 確認したこと：`npm run build` 成功（JS 539KB / gzip 140KB、20 modules）。`EnvironmentRefs` シグネチャ維持で他モジュールへの波及なし
- build/test結果：成功
- 補足：このコミット（1e6c0f6）で砂浜 Mesh に `scale.z=-1` を当てたため法線が反転し描画消失（次タスクで修正）

### 2026-06-01 スケール整合+表示回復+天候アニメ撤去
- 変更内容：
  - 表示回復: 砂浜/波打ち際の `scale.z=-1` を撤去し、Shape 構築時に y 符号を反転する方式に変更。砂浜/波打ち際/堤防マテリアルに `DoubleSide` を保険適用
  - 実測スケール反映: `HEADLAND.stem.length` 120→200、`head.width` 90→180、`head.depth` 30→80、`head.tipRadius` 15→30、`stem.rootZ` -5→0、`rootTaper` 4→8（マップ実測 200m/379m に整合）
  - 砂浜と突堤の地続き化: `shorelinePoints` に `clampHalf` を導入し、付け根 X 区間で揺らぎを 0 にクランプ
  - 沖側ビュー拡大: `OCEAN` を 1400×900・centerZ -380 に拡張。カメラ far 500→1500、`maxDistance` 150→450、注視点 z=-100、初期位置 (0,200,200)、フォグ遠端 200/800
  - 天候アニメ撤去: 雨パーティクル（`toggleRain`/`tickWeather`）と旗はためき（`Math.sin(now/200)`）を削除。背景・フォグ・光・旗向きの静的反映は維持
- 変更ファイル：`src/location.ts`, `src/environment.ts`, `src/scene.ts`, `src/weather.ts`, `src/main.ts`
- 確認したこと：`npm run build` 成功（JS 536KB / gzip 139KB、20 modules）
- build/test結果：成功

### 2026-06-01 海岸線スムージング+明るい配色化
- 変更内容：
  - 海岸線曲線化: `shorelinePoints` を制御点 11 個 + `CatmullRomCurve3` (tension 0.5) に置換。サンプリング数を seaEdge 96 / landEdge 80 に増加。低周波 (π×1.6 / π×2.8) 合成で「実線をトレース」した滑らかな曲線に。突堤付け根クランプは維持
  - 波打ち際幅 2.5m → 4m に拡張（明るい白帯が見えやすい）
  - 配色を明るく更新: 砂浜 `#edd9a8`→`#f6e3b0`、波 `#d6ecff`→`#f2faff`、海面ベース `#1d6fa5`→`#3fb6d4`（roughness 0.7/metalness 0.15）、堤防 `#6b7280`→`#c6ccd4`、プロムナード `#9ca3af`→`#dfe3ea`、道路 `#4b5563`→`#7a8493`
  - 天候配色を全体的に明度アップ: clear `#87ceeb`→`#bfe7ff`（フォグ 260/1000）、cloudy `#b8c2cc`→`#dfe7ee`、rainy `#6b7280`→`#a9b4be`、foggy `#d1d5db`→`#e7edf2`
  - ライティング刷新: `HemisphereLight(0xcfeeff, 0xf3e6c4, 0.85)` を追加し、Ambient を 0.35 に下げ、Sun は暖色 `#fff6e0` で 1.05。屋外のクリアな見え方に
  - 季節別海面色も明るい寒色系に再調整
- 変更ファイル：`src/environment.ts`, `src/weather.ts`, `src/scene.ts`
- build/test結果：成功（JS 537KB / gzip 139KB、20 modules）

## Current Task
- タスク名：（次の作業待ち）
- 目的：
- 対象ファイル：
- 完了条件：

## Known Issues
- 既存プリセットシナリオ（[src/scenarios/](src/scenarios/)）の沖側ターゲットは旧スケール（z=-50〜-60）のまま。新堤防は z=-200 まで伸びるため、IRB/PWC が T 字ヘッド上に乗る配置になっている → シナリオ座標を新スケールに沿って再配置する別タスクが必要
- ビルド時に chunk size 警告（500KB 超）。Three.js が大半。dynamic import で分割の余地あり
- 編集モードのピック対象は海面のみ。砂浜上のアセット配置（本部周辺の出動準備位置）はクリックで置けない
- 風・天候は「静的な見た目のみ」反映で、アセット/要救助者の漂流計算はしない（方針として確定）。雨/旗はためきのアニメは撤去済み
- スマホ実機でのフレームレート・タッチ感度の計測未実施

## Design Decisions
- ロケーションは茅ヶ崎ヘッドランドビーチ（35.31688, 139.41601）に固定
- 地形は抽象ローポリで再現（衛星画像テクスチャは使わない／軽量・編集容易を優先）
- 風・天候は描画への影響のみで物理シミュレーションは行わない
- シナリオビルダーは GUI 編集＋localStorage 保存＋JSON I/O まで含める
- シナリオは `Scenario { id, name, events[], phases[], custom? }` 形式。プリセットを TS モジュール、ユーザー作成分を localStorage に格納
- 座標系：1単位 = 1m、海岸線は X 軸方向（+X 東、+Z 内陸、-Z 沖）

## Next Tasks
1. GitHub リポジトリ作成・初回 push → Pages の Source を「GitHub Actions」に設定 → 公開URLで実機確認
2. スマホ実機（iOS / Android）で fps・タッチ操作・ドロワー UX をチェックし、必要に応じ調整
3. ヘッドランド堤防/海岸線の寸法を実測・空撮資料と照合して [src/location.ts](src/location.ts) を微調整
4. 編集モードのピック対象を砂浜まで拡張、配置済みウェイポイントのドラッグ移動・時刻インライン編集を追加
5. 代表的な救助シナリオ（夜間・複数要救助者・船舶火災等）のプリセット追加
6. Three.js を vendor チャンク分離して初回ロードを軽量化
