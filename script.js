const memories = [
  {
    id: "chatGame",
    date: "3/12",
    title: "摸魚聊天室",
    text: "把今天份的關心收好，累了就靠一下。",
  },
  {
    id: "foodGame",
    date: "5/31",
    title: "晴晴飲食圖鑑",
    text: "從各地特色食物裡，選出晴晴想吃的清單。",
  },
  {
    id: "fishGame",
    date: "5/28",
    title: "敲走討厭鬼",
    text: "連續敲擊集滿能量，讓討厭鬼退散。",
  },
  {
    id: "dreamGame",
    date: "5/29",
    title: "不要做惡夢",
    text: "戳破壞夢泡泡，把它們變成安心睡著的話。",
  },
  {
    id: "wakeGame",
    date: "5/24",
    title: "賴床到中午",
    text: "賴床是共通特質，所以叫醒也要溫柔一點。",
  },
];

const state = {
  completed: new Set(),
  chatScore: 0,
  foodScore: 0,
  fishScore: 0,
  dreamScore: 0,
  wakeScore: 0,
  wakeRound: 1,
  lastWake: 0,
  wakePaused: false,
  wakeResetTimer: null,
  chatTimers: [],
  chatSpawner: null,
  hammerEnergy: 0,
  hammerDecay: null,
  selectedFoods: [],
};

const screens = [...document.querySelectorAll(".screen")];
const memoryList = document.querySelector("#memoryList");
const progressText = document.querySelector("#progressText");
const toFinal = document.querySelector("#toFinal");
const toast = document.querySelector("#toast");
const transitionLayer = document.querySelector("#transitionLayer");
const birthdayUnlockAt = new Date("2026-06-08T00:00:00+08:00").getTime();
const countdownEls = {
  days: document.querySelector("#countdownDays"),
  hours: document.querySelector("#countdownHours"),
  minutes: document.querySelector("#countdownMinutes"),
  seconds: document.querySelector("#countdownSeconds"),
  note: document.querySelector("#countdownNote"),
};
const returnPrompts = {
  chatGame: "帶著摸魚成果回日記",
  foodGame: "把菜單貼回日記",
  fishGame: "帶著勝利回日記",
  dreamGame: "把好夢收進日記",
  wakeGame: "真的起床，回日記",
};

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function padTime(value) {
  return String(value).padStart(2, "0");
}

function updateCountdown() {
  if (!countdownEls.days) return;

  const remaining = birthdayUnlockAt - Date.now();
  if (remaining <= 0) {
    countdownEls.days.textContent = "00";
    countdownEls.hours.textContent = "00";
    countdownEls.minutes.textContent = "00";
    countdownEls.seconds.textContent = "00";
    countdownEls.note.textContent = "生日時間到，可以打開了。";
    clearInterval(updateCountdown.timer);
    showScreen("cover");
    return;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  countdownEls.days.textContent = padTime(days);
  countdownEls.hours.textContent = padTime(hours);
  countdownEls.minutes.textContent = padTime(minutes);
  countdownEls.seconds.textContent = padTime(seconds);
}

function startCountdown() {
  updateCountdown();
  if (birthdayUnlockAt > Date.now()) {
    updateCountdown.timer = setInterval(updateCountdown, 1000);
  }
}

function stopCountdown() {
  clearInterval(updateCountdown.timer);
}

function showScreen(id) {
  screens.forEach((screen) => screen.classList.toggle("active", screen.id === id));

  if (id !== "countdown") stopCountdown();
  if (id !== "chatGame") stopChatGame();
  if (id !== "fishGame") stopHammerDecay();
  if (id === "chatGame") resetChatGame();
  if (id === "fishGame") resetHammerGame();
  if (id === "dreamGame") resetDreamGame();
  if (id === "wakeGame") resetWakeGame();
  updateReturnButton(id);
}

function complete(id, message) {
  if (!state.completed.has(id)) {
    state.completed.add(id);
    renderMemories();
    showToast(message);
  }
  updateReturnButton(id);
}

function updateReturnButton(id) {
  const button = document.querySelector(`#${id} [data-back="timeline"]`);
  if (!button) return;

  const isComplete = state.completed.has(id);
  button.classList.toggle("return-ready", isComplete);
  button.textContent = isComplete ? returnPrompts[id] : "回日記";
}

function renderMemories() {
  memoryList.innerHTML = "";
  memories.forEach((memory, index) => {
    const done = state.completed.has(memory.id);
    const button = document.createElement("button");
    button.className = `memory ${done ? "done" : ""}`;
    button.style.setProperty("--i", index);
    button.innerHTML = `
      <div>
        <strong>${memory.title}</strong>
        <span>${memory.text}</span>
      </div>
      <div class="badge">${done ? "已蓋章" : "開始"}</div>
    `;
    button.addEventListener("click", () => showScreen(memory.id));
    memoryList.appendChild(button);
  });

  progressText.textContent = `${state.completed.size} / ${memories.length}`;
  toFinal.classList.toggle("hidden", state.completed.size !== memories.length);
}

document.addEventListener("click", (event) => {
  const next = event.target.closest("[data-next]");
  const back = event.target.closest("[data-back]");

  if (next) {
    if (next.dataset.next === "timeline" && document.querySelector("#cover").classList.contains("active")) {
      playOpeningTransition();
    } else {
      showScreen(next.dataset.next);
    }
  }
  if (back) showScreen(back.dataset.back);
});

function playOpeningTransition() {
  transitionLayer.classList.add("show");
  setTimeout(() => {
    showScreen("timeline");
  }, 1550);
  setTimeout(() => {
    transitionLayer.classList.remove("show");
  }, 1550);
}

function resetChatGame() {
  const panel = document.querySelector("#chatPanel");
  const score = document.querySelector("#chatScore");
  const messages = [
    "摸魚時間到",
    "午餐有好好吃嗎",
    "今天有沒有偷偷看日記",
    "我在這邊",
    "累了就靠一下",
    "不要硬撐",
    "晚點陪妳",
    "今天也要被照顧",
    "有沒有乖乖喝水",
    "今天辛苦了",
    "偷偷想妳一下",
    "不開心就跟我說",
    "可以慢慢來",
    "先休息一下",
    "不要把委屈吞掉",
    "我會聽妳說",
    "下播後抱抱",
    "今天也很可愛",
    "晴晴要被好好照顧",
    "我一直都在",
  ];

  stopChatGame();
  state.chatTimers.forEach((timer) => clearTimeout(timer));
  state.chatTimers = [];
  state.chatScore = 0;
  score.textContent = state.chatScore;
  panel.querySelectorAll(".bubble").forEach((bubble) => bubble.remove());

  const spawnBubble = () => {
    if (!document.querySelector("#chatGame").classList.contains("active")) return;
    const existing = panel.querySelectorAll(".bubble");
    if (existing.length >= 7) return;

    const bubble = document.createElement("button");
    bubble.className = "bubble";
    bubble.textContent = messages[Math.floor(Math.random() * messages.length)];
    bubble.style.left = `${8 + Math.random() * 58}%`;
    bubble.style.animationDuration = `${4.8 + Math.random() * 1.8}s`;
    bubble.addEventListener("animationend", () => bubble.remove());
    bubble.addEventListener("click", () => {
      bubble.remove();
      state.chatScore += 1;
      score.textContent = state.chatScore;
      if (state.chatScore >= 6) complete("chatGame", "今天份的陪伴收到了。");
    });
    panel.appendChild(bubble);
  };

  spawnBubble();
  state.chatSpawner = setInterval(spawnBubble, 800);
}

function stopChatGame() {
  if (state.chatSpawner) {
    clearInterval(state.chatSpawner);
    state.chatSpawner = null;
  }
}

const foods = [
  ["成都", "火鍋"],
  ["成都", "串串"],
  ["成都", "擔擔麵"],
  ["成都", "甜水麵"],
  ["成都", "鐘水餃"],
  ["成都", "龍抄手"],
  ["成都", "夫妻肺片"],
  ["成都", "冰粉"],
  ["成都", "蛋烘糕"],
  ["成都", "烤魚"],
  ["香港", "港式奶茶"],
  ["香港", "菠蘿油"],
  ["香港", "蛋撻"],
  ["香港", "雲吞麵"],
  ["香港", "燒臘飯"],
  ["香港", "腸粉"],
  ["香港", "魚蛋"],
  ["香港", "車仔麵"],
  ["香港", "楊枝甘露"],
  ["香港", "西多士"],
  ["台灣", "滷肉飯"],
  ["台灣", "鹽酥雞"],
  ["台灣", "珍珠奶茶"],
  ["台灣", "牛肉麵"],
  ["台灣", "蚵仔煎"],
  ["台灣", "滷味"],
  ["台灣", "雞排"],
  ["台灣", "甜不辣"],
  ["台灣", "豆花"],
  ["台灣", "小籠包"],
  ["日本", "壽司"],
  ["日本", "拉麵"],
  ["日本", "燒肉"],
  ["日本", "章魚燒"],
  ["日本", "咖哩飯"],
  ["日本", "丼飯"],
  ["日本", "天婦羅"],
  ["日本", "可麗餅"],
  ["日本", "抹茶甜點"],
  ["日本", "燒鳥"],
];

const foodGoal = 5;

const foodGrid = document.querySelector("#foodGrid");
const foodScore = document.querySelector("#foodScore");
const foodNote = document.querySelector("#foodNote");
const foodReceipt = document.querySelector("#foodReceipt");
const receiptList = document.querySelector("#receiptList");
const receiptStamp = document.querySelector("#receiptStamp");
const receiptLine = document.querySelector("#receiptLine");
let foodDragStartY = 0;
let foodDragStartScroll = 0;
let foodDragPointerId = null;
let foodDragMoved = false;

foodGrid.addEventListener("pointerdown", (event) => {
  if (event.target.closest(".food")) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;

  foodDragStartY = event.clientY;
  foodDragStartScroll = foodGrid.scrollTop;
  foodDragPointerId = event.pointerId;
  foodDragMoved = false;
  foodGrid.classList.add("dragging");
  foodGrid.setPointerCapture(event.pointerId);
});

foodGrid.addEventListener("pointermove", (event) => {
  if (event.pointerId !== foodDragPointerId) return;

  const deltaY = event.clientY - foodDragStartY;
  if (Math.abs(deltaY) < 8) return;

  foodDragMoved = true;
  foodGrid.scrollTop = foodDragStartScroll - deltaY;
  event.preventDefault();
});

function stopFoodDrag(event) {
  if (Number.isInteger(event.pointerId) && foodGrid.hasPointerCapture(event.pointerId)) {
    foodGrid.releasePointerCapture(event.pointerId);
  }
  foodDragPointerId = null;
  foodGrid.classList.remove("dragging");

  if (foodDragMoved) {
    setTimeout(() => {
      foodDragMoved = false;
    }, 160);
  }
}

foodGrid.addEventListener("pointerup", stopFoodDrag);
foodGrid.addEventListener("pointercancel", stopFoodDrag);
foodGrid.addEventListener(
  "click",
  (event) => {
    if (!foodDragMoved || event.target.closest(".food")) return;
    event.preventDefault();
    event.stopPropagation();
    foodDragMoved = false;
  },
  true
);

const receiptLines = [
  "憶已收到，安排中。",
  "這份菜單看起來很適合兩個人一起胖。",
  "辣的先交給晴晴，我負責在旁邊投降。",
  "之後慢慢帶妳去吃，一個都不許漏。",
];

function renderReceipt() {
  if (!state.selectedFoods.length) {
    receiptList.textContent = "還沒點餐。";
    receiptStamp.textContent = "選餐中";
    receiptLine.textContent = "選幾個想吃的，憶先記下來。";
    foodReceipt.classList.remove("complete");
    return;
  }

  const grouped = state.selectedFoods.reduce((groups, item) => {
    groups[item.place] ??= [];
    groups[item.place].push(item.label);
    return groups;
  }, {});

  receiptList.innerHTML = Object.entries(grouped)
    .map(([place, labels]) => `<p><strong>${place}</strong>：${labels.join("、")}</p>`)
    .join("");

  if (state.foodScore >= foodGoal) {
    receiptStamp.textContent = "已點餐";
    receiptLine.textContent = receiptLines[state.foodScore % receiptLines.length];
    foodReceipt.classList.add("complete");
  } else {
    receiptStamp.textContent = `還差 ${foodGoal - state.foodScore}`;
    receiptLine.textContent = "再選幾個，菜單就能交給憶安排。";
    foodReceipt.classList.remove("complete");
  }
}

const groupedFoods = foods.reduce((groups, [place, label]) => {
  groups[place] ??= [];
  groups[place].push(label);
  return groups;
}, {});

Object.entries(groupedFoods).forEach(([place, labels]) => {
  const group = document.createElement("section");
  group.className = "food-group";
  group.innerHTML = `<h3>${place}</h3>`;
  const options = document.createElement("div");
  options.className = "food-options";

  labels.forEach((label) => {
    const button = document.createElement("button");
    button.className = "food";
    button.textContent = label;
    button.addEventListener("click", () => {
      const selected = button.classList.toggle("collected");
      state.foodScore += selected ? 1 : -1;
      if (selected) {
        state.selectedFoods.push({ place, label });
      } else {
        state.selectedFoods = state.selectedFoods.filter((item) => !(item.place === place && item.label === label));
      }
      foodScore.textContent = state.foodScore;
      foodNote.textContent = selected ? `已加入想吃清單：${label}` : `先把 ${label} 放回地圖上。`;
      renderReceipt();
      if (state.foodScore >= foodGoal) complete("foodGame", "晴晴想吃清單完成，之後可以照著慢慢吃。");
    });
    options.appendChild(button);
  });

  group.appendChild(options);
  foodGrid.appendChild(group);
});

const fish = document.querySelector("#fish");
const fishScore = document.querySelector("#fishScore");
const hammerEnergy = document.querySelector("#hammerEnergy");

function setHammerEnergy(value) {
  state.hammerEnergy = Math.max(0, Math.min(100, value));
  fishScore.textContent = Math.round(state.hammerEnergy);
  hammerEnergy.style.width = `${state.hammerEnergy}%`;
}

function stopHammerDecay() {
  if (state.hammerDecay) {
    clearInterval(state.hammerDecay);
    state.hammerDecay = null;
  }
}

function startHammerDecay() {
  stopHammerDecay();
  state.hammerDecay = setInterval(() => {
    if (!document.querySelector("#fishGame").classList.contains("active")) {
      stopHammerDecay();
      return;
    }
    if (state.hammerEnergy < 100) setHammerEnergy(state.hammerEnergy - 1);
  }, 120);
}

function resetHammerGame() {
  setHammerEnergy(0);
  fish.classList.remove("hit", "cleared");
  startHammerDecay();
}

fish.addEventListener("click", () => {
  const wasCleared = state.hammerEnergy >= 100;
  if (!wasCleared) setHammerEnergy(state.hammerEnergy + 14);
  fish.classList.remove("hit");
  void fish.offsetWidth;
  fish.classList.add("hit");

  if (!wasCleared && state.hammerEnergy >= 100) {
    stopHammerDecay();
    fish.classList.add("cleared");
    complete("fishGame", "討厭鬼退散，晴晴今天也要開心。");
  }
});

function resetDreamGame() {
  const bubbleStage = document.querySelector("#dreamCards");
  const score = document.querySelector("#dreamScore");
  const dreams = [
    ["煩惱", "放旁邊", 27, 22],
    ["惡夢", "我守著", 73, 22],
    ["委屈", "抱一下", 50, 46],
    ["頭痛", "早點睡", 27, 72],
    ["嘆氣", "明天會好", 73, 72],
  ];

  state.dreamScore = 0;
  score.textContent = state.dreamScore;
  bubbleStage.innerHTML = "";

  dreams.forEach(([front, back, left, top], index) => {
    const bubble = document.createElement("button");
    bubble.className = "dream-pop";
    bubble.style.left = `${left}%`;
    bubble.style.top = `${top}%`;
    bubble.style.animationDelay = `${index * -0.45}s`;
    bubble.innerHTML = `
      <span class="bad-dream">${front}</span>
      <span class="good-dream">${back}</span>
    `;
    bubble.addEventListener("click", () => {
      if (bubble.classList.contains("popped")) return;
      bubble.classList.add("popped");
      state.dreamScore += 1;
      score.textContent = state.dreamScore;
      if (state.dreamScore >= dreams.length) complete("dreamGame", "壞夢退散，今晚安心睡。");
    });
    bubbleStage.appendChild(bubble);
  });
}

const wakeButton = document.querySelector("#wakeButton");
const wakeHint = document.querySelector("#wakeHint");
const wakeSteps = document.querySelector("#wakeSteps");
const wakeStatus = document.querySelector("#wakeStatus");

for (let index = 0; index < 8; index++) {
  const step = document.createElement("span");
  step.className = "wake-step";
  wakeSteps.appendChild(step);
}

function resetWakeGame() {
  clearTimeout(state.wakeResetTimer);
  state.wakeResetTimer = null;
  state.wakeScore = 0;
  state.wakeRound = 1;
  state.lastWake = 0;
  state.wakePaused = false;
  wakeButton.disabled = false;
  wakeHint.textContent = "輕輕點八下叫醒她。太急不行，溫柔一點。";
  renderWakeSteps();
}

function renderWakeSteps() {
  [...wakeSteps.children].forEach((step, index) => {
    step.classList.toggle("lit", index < state.wakeScore);
  });
  if (state.wakeRound === 2 && state.wakeScore === 0) {
    wakeStatus.textContent = "又賴床了";
  } else {
    wakeStatus.textContent = state.wakeScore >= 8 ? "起床成功" : "輕輕叫醒";
  }
}

wakeButton.addEventListener("click", () => {
  if (state.wakePaused) return;

  const now = Date.now();
  if (now - state.lastWake < 420) {
    wakeHint.textContent = "太急啦，晴晴要被吵醒生氣了。";
    state.lastWake = now;
    return;
  }

  state.lastWake = now;
  state.wakeScore += 1;
  renderWakeSteps();

  if (state.wakeScore < 8) {
    wakeHint.textContent = state.wakeRound === 1 ? "很好，就是這個溫柔節奏。" : "這次要真的起床喔。";
    return;
  }

  if (state.wakeRound === 1) {
    wakeHint.textContent = "起床成功...但她又躺回去了。";
    state.wakeRound = 2;
    state.wakePaused = true;
    wakeButton.disabled = true;
    state.wakeResetTimer = setTimeout(() => {
      state.wakeScore = 0;
      state.lastWake = 0;
      state.wakePaused = false;
      wakeButton.disabled = false;
      renderWakeSteps();
      wakeHint.textContent = "再溫柔叫一次，這次要真的起床。";
      state.wakeResetTimer = null;
    }, 2900);
    return;
  }

  wakeHint.textContent = "這次真的起床成功，今天也可愛。";
  complete("wakeGame", "賴床關卡通過。");
});

startCountdown();
renderMemories();
renderWakeSteps();
