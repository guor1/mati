# 九九乘法限时挑战 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个在 iPad Safari 中运行的单页网页游戏,用限时挑战和数字键盘输入帮助孩子记忆九九乘法口诀表。

**Architecture:** 纯前端、零构建。游戏逻辑(出题、判分、格式化)抽到独立的 `game.js` 纯函数模块,用 Node 内置测试器做 TDD;UI 与交互在 `index.html`(内联 CSS + 脚本)中实现,通过 `<script src="game.js">` 引入逻辑,手动在浏览器中验证。状态用普通 JS 对象管理,最高分存 localStorage。

**Tech Stack:** HTML / CSS / 原生 JavaScript;Node.js v24 内置 `node:test` + `node:assert`(仅用于测试逻辑,运行时不依赖)。

---

## File Structure

- `game.js` — 纯游戏逻辑:`randomInt` / `generateQuestion` / `checkAnswer` / `formatQuestion`。浏览器中挂到 `window.Game`,Node 中通过 `module.exports` 导出。
- `test/game.test.js` — `game.js` 的单元测试。
- `index.html` — UI(开始/游戏/结束三界面)、内联样式、交互脚本、计时、数字键盘、localStorage 最高分。
- `package.json` — 定义 `npm test` 脚本(可选但方便)。

---

### Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `game.js`(占位骨架)
- Create: `test/game.test.js`(占位,先不写用例)

- [ ] **Step 1: 初始化 git 仓库**

Run:
```bash
cd /c/dev/web/mati && git init
```
Expected: `Initialized empty Git repository ...`

- [ ] **Step 2: 创建 `package.json`**

Create `package.json`:
```json
{
  "name": "mati",
  "version": "1.0.0",
  "description": "九九乘法限时挑战",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 3: 创建 `game.js` 骨架(导出空对象)**

Create `game.js`:
```js
(function (global) {
  'use strict';

  var Game = {};

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
  }
  global.Game = Game;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: 确认测试器可运行(空目录也应正常退出)**

Run:
```bash
cd /c/dev/web/mati && node --test 2>&1 | tail -5
```
Expected: 显示 `tests 0` / `pass 0`(没有测试文件时正常退出,无报错)。

- [ ] **Step 5: 提交**

```bash
cd /c/dev/web/mati && git add -A && git commit -m "chore: 项目初始化与 game.js 骨架"
```

---

### Task 2: 游戏逻辑(TDD)

**Files:**
- Modify: `game.js`
- Test: `test/game.test.js`

- [ ] **Step 1: 写失败的测试**

Create `test/game.test.js`:
```js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const Game = require('../game.js');

// 可控随机源:按序返回给定值,循环
function seq(values) {
  let i = 0;
  return function () {
    const v = values[i % values.length];
    i++;
    return v;
  };
}

test('randomInt: rng=0 返回 min', () => {
  assert.strictEqual(Game.randomInt(1, 9, () => 0), 1);
});

test('randomInt: rng≈1 返回 max', () => {
  assert.strictEqual(Game.randomInt(1, 9, () => 0.999), 9);
});

test('randomInt: rng=0.5 返回中间值', () => {
  assert.strictEqual(Game.randomInt(1, 9, () => 0.5), 5);
});

test('generateQuestion: a 取自段位,b 取自 1..9,answer=a*b', () => {
  const q = Game.generateQuestion([6, 7, 8], null, () => 0);
  assert.strictEqual(q.a, 6);
  assert.strictEqual(q.b, 1);
  assert.strictEqual(q.answer, 6);
});

test('generateQuestion: 避免与上一题完全相同', () => {
  const prev = { a: 6, b: 1, answer: 6 };
  // 第一次尝试 a-index0->6, b(rng0)->1 == prev,需重试;
  // 第二次 a-index0->6, b(rng0.5)->5
  const rng = seq([0, 0, 0, 0.5]);
  const q = Game.generateQuestion([6, 7, 8], prev, rng);
  assert.ok(!(q.a === 6 && q.b === 1), '应与上一题不同');
});

test('generateQuestion: 段位为空时抛错', () => {
  assert.throws(() => Game.generateQuestion([], null, () => 0));
});

test('checkAnswer: 输入等于答案返回 true', () => {
  assert.strictEqual(Game.checkAnswer({ a: 7, b: 8, answer: 56 }, '56'), true);
});

test('checkAnswer: 错误或空输入返回 false', () => {
  assert.strictEqual(Game.checkAnswer({ a: 7, b: 8, answer: 56 }, '57'), false);
  assert.strictEqual(Game.checkAnswer({ a: 7, b: 8, answer: 56 }, ''), false);
});

test('formatQuestion: 渲染为 "A × B = ?"', () => {
  assert.strictEqual(Game.formatQuestion({ a: 7, b: 8, answer: 56 }), '7 × 8 = ?');
});
```

- [ ] **Step 2: 运行测试,确认失败**

Run:
```bash
cd /c/dev/web/mati && node --test 2>&1 | tail -15
```
Expected: FAIL —— 报错类似 `Game.randomInt is not a function`。

- [ ] **Step 3: 实现逻辑**

Replace `game.js` 的内容为:
```js
(function (global) {
  'use strict';

  // 返回 [min, max] 闭区间内的整数;rng 为可注入随机源(默认 Math.random)
  function randomInt(min, max, rng) {
    var r = (rng || Math.random)();
    return min + Math.floor(r * (max - min + 1));
  }

  // 生成一题 {a, b, answer}:a 取自 segments(整数数组),b 取自 1..9,
  // 避免与 prev 完全相同(同 a 同 b)。rng 可注入以便测试。
  function generateQuestion(segments, prev, rng) {
    if (!segments || segments.length === 0) {
      throw new Error('segments 不能为空');
    }
    var q;
    var guard = 0;
    do {
      var a = segments[randomInt(0, segments.length - 1, rng)];
      var b = randomInt(1, 9, rng);
      q = { a: a, b: b, answer: a * b };
      guard++;
    } while (prev && q.a === prev.a && q.b === prev.b && guard < 100);
    return q;
  }

  // 校验输入(字符串或数字)是否等于该题答案
  function checkAnswer(question, inputStr) {
    if (inputStr === '' || inputStr === null || inputStr === undefined) {
      return false;
    }
    return Number(inputStr) === question.answer;
  }

  // 格式化题目用于显示,例如 "7 × 8 = ?"
  function formatQuestion(question) {
    return question.a + ' × ' + question.b + ' = ?';
  }

  var Game = {
    randomInt: randomInt,
    generateQuestion: generateQuestion,
    checkAnswer: checkAnswer,
    formatQuestion: formatQuestion
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
  }
  global.Game = Game;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: 运行测试,确认通过**

Run:
```bash
cd /c/dev/web/mati && node --test 2>&1 | tail -15
```
Expected: PASS —— 所有测试通过(`pass 10` / `fail 0`)。

- [ ] **Step 5: 提交**

```bash
cd /c/dev/web/mati && git add -A && git commit -m "feat: 游戏逻辑(出题/判分/格式化)含单元测试"
```

---

### Task 3: 界面与交互(index.html)

**Files:**
- Create: `index.html`

此任务是 UI,靠浏览器手动验证(非 TDD)。逻辑已在 `game.js` 中测试。

- [ ] **Step 1: 创建 `index.html`**

Create `index.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>九九乘法限时挑战</title>
<style>
  :root { --green:#2ecc71; --red:#e74c3c; --blue:#3498db; }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { margin:0; height:100%; font-family:-apple-system,"PingFang SC",sans-serif; background:#fdf6e3; color:#333; }
  body { display:flex; align-items:center; justify-content:center; user-select:none; }
  .screen { display:none; width:100%; max-width:640px; padding:24px; text-align:center; }
  .screen.active { display:block; }
  h1 { font-size:2rem; margin:0 0 24px; }
  .segments { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin:24px 0; }
  .seg { font-size:2rem; padding:20px 0; border-radius:16px; background:#eee; border:3px solid transparent; cursor:pointer; }
  .seg.on { background:var(--blue); color:#fff; border-color:#2c80b4; }
  .btn { font-size:1.6rem; padding:18px 40px; border:none; border-radius:16px; background:var(--green); color:#fff; cursor:pointer; margin:8px; }
  .btn:disabled { background:#bbb; }
  .hud { display:flex; justify-content:space-between; font-size:1.5rem; margin-bottom:16px; }
  .question { font-size:3.2rem; font-weight:bold; margin:24px 0 8px; border-radius:16px; }
  .input-display { font-size:2.4rem; min-height:3rem; color:var(--blue); letter-spacing:4px; }
  .correct-answer { font-size:1.6rem; color:var(--red); min-height:2rem; }
  .pad { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:16px; }
  .key { font-size:2rem; padding:22px 0; border-radius:16px; background:#fff; border:2px solid #ddd; cursor:pointer; }
  .flash-correct { animation:fc .4s; }
  .flash-wrong { animation:fw .4s; }
  @keyframes fc { 0%,100%{background:transparent;} 50%{background:var(--green);color:#fff;} }
  @keyframes fw { 0%,100%{background:transparent;} 50%{background:var(--red);color:#fff;} }
  .final-score { font-size:3rem; font-weight:bold; margin:16px 0; }
  .best { font-size:1.4rem; color:#888; margin-bottom:16px; }
</style>
</head>
<body>

<div id="start" class="screen active">
  <h1>九九乘法限时挑战</h1>
  <p>选择要练习的乘法段位</p>
  <div id="segments" class="segments"></div>
  <button id="start-btn" class="btn">开始 (60秒)</button>
</div>

<div id="game" class="screen">
  <div class="hud">
    <span>⏱ <span id="time">60</span></span>
    <span>得分 <span id="score">0</span></span>
  </div>
  <div id="question" class="question"></div>
  <div id="input-display" class="input-display"></div>
  <div id="correct-answer" class="correct-answer"></div>
  <div id="pad" class="pad"></div>
</div>

<div id="end" class="screen">
  <h1>时间到!</h1>
  <div class="final-score">答对 <span id="final">0</span> 题</div>
  <div id="best" class="best"></div>
  <button id="again-btn" class="btn">再来一局</button>
  <button id="back-btn" class="btn" style="background:#95a5a6;">返回设置</button>
</div>

<script src="game.js"></script>
<script>
(function () {
  'use strict';
  var DURATION = 60;
  var BEST_KEY = 'mati_best_score';

  var state = {
    segments: { 2:true,3:true,4:true,5:true,6:true,7:true,8:true,9:true },
    time: DURATION, score: 0, question: null, input: '', timer: null, locked: false
  };

  function byId(id) { return document.getElementById(id); }
  var el = {
    screens: { start: byId('start'), game: byId('game'), end: byId('end') },
    segments: byId('segments'), startBtn: byId('start-btn'),
    time: byId('time'), score: byId('score'), question: byId('question'),
    inputDisplay: byId('input-display'), correctAnswer: byId('correct-answer'),
    pad: byId('pad'), final: byId('final'), best: byId('best'),
    againBtn: byId('again-btn'), backBtn: byId('back-btn')
  };

  function show(name) {
    Object.keys(el.screens).forEach(function (k) {
      el.screens[k].classList.toggle('active', k === name);
    });
  }

  function selectedSegments() {
    return Object.keys(state.segments)
      .filter(function (k) { return state.segments[k]; })
      .map(Number);
  }

  function renderSegments() {
    el.segments.innerHTML = '';
    [2,3,4,5,6,7,8,9].forEach(function (n) {
      var d = document.createElement('div');
      d.className = 'seg' + (state.segments[n] ? ' on' : '');
      d.textContent = n;
      d.addEventListener('click', function () {
        state.segments[n] = !state.segments[n];
        renderSegments();
        el.startBtn.disabled = selectedSegments().length === 0;
      });
      el.segments.appendChild(d);
    });
  }

  function renderPad() {
    el.pad.innerHTML = '';
    ['1','2','3','4','5','6','7','8','9','删除','0','确定'].forEach(function (k) {
      var b = document.createElement('div');
      b.className = 'key';
      b.textContent = k;
      b.addEventListener('click', function () { onKey(k); });
      el.pad.appendChild(b);
    });
  }

  function onKey(k) {
    if (state.locked) return;
    if (k === '删除') {
      state.input = state.input.slice(0, -1);
    } else if (k === '确定') {
      submit();
      return;
    } else if (state.input.length < 3) {
      state.input += k;
    }
    el.inputDisplay.textContent = state.input;
  }

  function flash(cls) {
    el.question.classList.remove('flash-correct', 'flash-wrong');
    void el.question.offsetWidth;
    el.question.classList.add(cls);
  }

  function nextQuestion() {
    state.question = Game.generateQuestion(selectedSegments(), state.question);
    state.input = '';
    el.question.textContent = Game.formatQuestion(state.question);
    el.inputDisplay.textContent = '';
  }

  function submit() {
    if (state.input === '') return;
    if (Game.checkAnswer(state.question, state.input)) {
      state.score++;
      el.score.textContent = state.score;
      flash('flash-correct');
      nextQuestion();
    } else {
      state.locked = true;
      el.correctAnswer.textContent = '正确答案:' + state.question.answer;
      flash('flash-wrong');
      setTimeout(function () {
        el.correctAnswer.textContent = '';
        state.locked = false;
        nextQuestion();
      }, 1000);
    }
  }

  function tick() {
    state.time--;
    el.time.textContent = state.time;
    if (state.time <= 0) endGame();
  }

  function startGame() {
    state.time = DURATION; state.score = 0; state.input = '';
    state.locked = false; state.question = null;
    el.time.textContent = state.time;
    el.score.textContent = 0;
    el.correctAnswer.textContent = '';
    nextQuestion();
    show('game');
    state.timer = setInterval(tick, 1000);
  }

  function endGame() {
    clearInterval(state.timer);
    var best = Number(localStorage.getItem(BEST_KEY) || 0);
    if (state.score > best) {
      best = state.score;
      localStorage.setItem(BEST_KEY, String(best));
    }
    el.final.textContent = state.score;
    el.best.textContent = '历史最高:' + best + ' 题';
    show('end');
  }

  el.startBtn.addEventListener('click', function () {
    if (selectedSegments().length > 0) startGame();
  });
  el.againBtn.addEventListener('click', startGame);
  el.backBtn.addEventListener('click', function () { show('start'); });

  renderSegments();
  renderPad();
})();
</script>
</body>
</html>
```

- [ ] **Step 2: 在电脑浏览器中打开验证**

Run(Windows,用默认浏览器打开):
```bash
cd /c/dev/web/mati && start index.html
```
逐项确认:
- 开始界面显示 8 个段位方块(默认全部高亮/选中),点击可切换选中态。
- 取消全部段位时「开始」按钮变灰不可点。
- 点「开始」进入游戏界面,出现题目、倒计时从 60 开始递减。
- 数字键盘可输入、"删除"可退格、"确定"提交。
- 答对:题目绿色闪一下,得分 +1,换新题。
- 答错:题目红色闪一下,显示"正确答案:X"约 1 秒后换新题。
- 倒计时到 0 进入结束界面,显示答对数与历史最高分。
- 「再来一局」重新开始;「返回设置」回到开始界面。
- 关闭再打开网页,历史最高分仍在(localStorage 生效)。

- [ ] **Step 3: 提交**

```bash
cd /c/dev/web/mati && git add -A && git commit -m "feat: 游戏界面与交互(index.html)"
```

---

### Task 4: iPad 实机验证与说明

**Files:**
- Create: `README.md`

- [ ] **Step 1: 编写 `README.md`**

Create `README.md`:
```markdown
# 九九乘法限时挑战

在 iPad Safari 中打开 `index.html` 即可游玩(纯前端,无需联网)。

## 玩法
- 在开始界面选择要练习的乘法段位(2~9),默认全选。
- 点「开始」,60 秒内用数字键盘尽量多答对乘法题。
- 答错会显示正确答案并继续,不扣时间。
- 结束后显示本局答对数与历史最高分。

## 放到 iPad 上
把整个文件夹(至少包含 `index.html` 和 `game.js`)传到 iPad,
用 Safari 打开 `index.html`,可通过"分享 → 添加到主屏幕"当作 App 使用。

## 开发
- 运行逻辑测试:`npm test`(需要 Node.js)。
```

- [ ] **Step 2: 在 iPad 上实机验证(需用户操作)**

将 `index.html` 与 `game.js` 传到 iPad,用 Safari 打开,确认:
- 触屏点击段位、数字键盘、按钮均灵敏,按钮足够大。
- 竖屏与横屏下布局都可正常使用、无需缩放。
- 完整玩一局无异常。

- [ ] **Step 3: 提交**

```bash
cd /c/dev/web/mati && git add -A && git commit -m "docs: 添加 README 与使用说明"
```

---

## Self-Review

- **Spec coverage:** 段位可选(Task 3 段位方块)、数字键盘输入(Task 3 pad)、60 秒固定时长(DURATION)、答对绿闪+1、答错红闪显示答案不扣时间、结束显示得分与最高分、localStorage 持久化、出题不重复(Task 2)、iPad 触屏优化(viewport/大按钮/Task 4)——均已覆盖。
- **Placeholder scan:** 无 TBD/TODO;所有代码步骤含完整代码。
- **Type consistency:** `question` 结构 `{a,b,answer}` 在 game.js 与 index.html 中一致;`Game.generateQuestion/checkAnswer/formatQuestion` 签名前后一致。
