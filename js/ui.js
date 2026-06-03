import { chartColors, drawPieChart } from "./chart.js";
import { normalizePayer } from "./stats.js";

const modes = {
  capybara: {
    next: "dragon",
    button: "切換到龍模式",
    label: "卡皮巴拉模式",
    title: "柔柔地一起記帳",
    description: "淺紫和淺黃色的療癒帳本，把共同花費整理得輕鬆一點。",
    image: "assets/illustrations/capybara-mode.png?v=3",
    alt: "可愛卡皮巴拉插圖"
  },
  dragon: {
    next: "capybara",
    button: "切換到卡皮巴拉模式",
    label: "龍模式",
    title: "帥氣地掌控花費",
    description: "黑紅閃電風格的共同帳本，讓每一筆支出都俐落有氣勢。",
    image: "assets/illustrations/dragon-mode.png?v=3",
    alt: "黑紅閃電龍插圖"
  }
};

const currencyFormatter = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0
});

export const dom = {
  loginBtn: document.getElementById("loginBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  userInfo: document.getElementById("userInfo"),
  appArea: document.getElementById("appArea"),
  expenseForm: document.getElementById("expenseForm"),
  date: document.getElementById("date"),
  amount: document.getElementById("amount"),
  category: document.getElementById("category"),
  payer: document.getElementById("payer"),
  note: document.getElementById("note"),
  monthFilter: document.getElementById("monthFilter"),
  monthlyTotal: document.getElementById("monthlyTotal"),
  dragonTotal: document.getElementById("dragonTotal"),
  capybaraTotal: document.getElementById("capybaraTotal"),
  themeBadge: document.getElementById("themeBadge"),
  themeTitle: document.getElementById("themeTitle"),
  themeDescription: document.getElementById("themeDescription"),
  modeIllustration: document.getElementById("modeIllustration"),
  categoryStats: document.getElementById("categoryStats"),
  categoryChart: document.getElementById("categoryChart"),
  chartEmpty: document.getElementById("chartEmpty"),
  expenseList: document.getElementById("expenseList"),
  recordCount: document.getElementById("recordCount"),
  editDialog: document.getElementById("editDialog"),
  editForm: document.getElementById("editForm"),
  editId: document.getElementById("editId"),
  editDate: document.getElementById("editDate"),
  editAmount: document.getElementById("editAmount"),
  editCategory: document.getElementById("editCategory"),
  editPayer: document.getElementById("editPayer"),
  editNote: document.getElementById("editNote"),
  closeEditBtn: document.getElementById("closeEditBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  themeToggle: document.getElementById("themeToggle")
};

export function todayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function currentMonthString() {
  return todayString().slice(0, 7);
}

export function formatCurrency(amount) {
  return currencyFormatter.format(Number(amount || 0));
}

export function getExpenseFromForm(formElements) {
  const amount = Number(formElements.amount.value);

  if (!formElements.date.value) {
    throw new Error("請選擇日期");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("請輸入正確金額");
  }

  return {
    date: formElements.date.value,
    amount,
    category: formElements.category.value,
    payer: formElements.payer.value,
    note: formElements.note.value.trim()
  };
}

export function setSignedInView(user) {
  dom.loginBtn.classList.add("hidden");
  dom.logoutBtn.classList.remove("hidden");
  dom.appArea.classList.remove("hidden");
  dom.userInfo.textContent = `目前登入：${user.email}`;
}

export function setSignedOutView() {
  dom.loginBtn.classList.remove("hidden");
  dom.logoutBtn.classList.add("hidden");
  dom.appArea.classList.add("hidden");
  dom.userInfo.textContent = "請先使用 Google 登入";
  renderExpenses([]);
  renderStats({
    total: 0,
    payerTotals: { "龍": 0, "卡皮巴拉": 0 },
    categories: []
  });
}

export function resetAddForm() {
  dom.expenseForm.reset();
  dom.date.value = todayString();
}

export function renderStats(stats) {
  dom.monthlyTotal.textContent = formatCurrency(stats.total);
  dom.dragonTotal.textContent = formatCurrency(stats.payerTotals["龍"]);
  dom.capybaraTotal.textContent = formatCurrency(stats.payerTotals["卡皮巴拉"]);
  dom.chartEmpty.classList.toggle("hidden", stats.categories.length > 0);

  drawPieChart(dom.categoryChart, stats.categories);
  renderCategoryStats(stats.categories);
}

export function renderCategoryStats(categories) {
  dom.categoryStats.replaceChildren();

  if (!categories.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "尚無分類資料";
    dom.categoryStats.append(empty);
    return;
  }

  categories.forEach((category, index) => {
    const row = document.createElement("div");
    row.className = "category-row";

    const dot = document.createElement("span");
    dot.className = "category-dot";
    dot.style.backgroundColor = chartColors[index % chartColors.length];

    const name = document.createElement("span");
    name.className = "category-name";
    name.textContent = category.name;

    const amount = document.createElement("span");
    amount.className = "category-amount";
    amount.textContent = `${formatCurrency(category.amount)} · ${Math.round(category.percent * 100)}%`;

    row.append(dot, name, amount);
    dom.categoryStats.append(row);
  });
}

export function renderExpenses(expenses) {
  dom.expenseList.replaceChildren();
  dom.recordCount.textContent = `${expenses.length} 筆`;

  if (!expenses.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "這個月份還沒有支出紀錄";
    dom.expenseList.append(empty);
    return;
  }

  expenses.forEach((expense) => {
    dom.expenseList.append(createExpenseItem(expense));
  });
}

function createExpenseItem(expense) {
  const item = document.createElement("article");
  item.className = "expense-item";

  const main = document.createElement("div");
  main.className = "expense-main";

  const topline = document.createElement("div");
  topline.className = "expense-topline";

  const amount = document.createElement("span");
  amount.className = "expense-amount";
  amount.textContent = formatCurrency(expense.amount);

  const date = document.createElement("span");
  date.className = "expense-date";
  date.textContent = expense.date || "未填日期";

  const meta = document.createElement("div");
  meta.className = "expense-meta";

  const category = document.createElement("span");
  category.className = "pill";
  category.textContent = expense.category || "其他";

  const payer = document.createElement("span");
  payer.className = "pill";
  payer.textContent = normalizePayer(expense.payer) || "未填付款人";

  const note = document.createElement("p");
  note.className = "expense-note";
  note.textContent = expense.note || "無備註";

  topline.append(amount, date);
  meta.append(category, payer);
  main.append(topline, meta, note);

  const actions = document.createElement("div");
  actions.className = "expense-actions";

  const editBtn = document.createElement("button");
  editBtn.className = "icon-button";
  editBtn.type = "button";
  editBtn.title = "編輯";
  editBtn.setAttribute("aria-label", "編輯支出");
  editBtn.dataset.action = "edit";
  editBtn.dataset.id = expense.id;
  editBtn.textContent = "✎";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "danger-button";
  deleteBtn.type = "button";
  deleteBtn.title = "刪除";
  deleteBtn.setAttribute("aria-label", "刪除支出");
  deleteBtn.dataset.action = "delete";
  deleteBtn.dataset.id = expense.id;
  deleteBtn.textContent = "刪除";

  actions.append(editBtn, deleteBtn);
  item.append(main, actions);

  return item;
}

export function openEditDialog(expense) {
  dom.editId.value = expense.id;
  dom.editDate.value = expense.date || todayString();
  dom.editAmount.value = Number(expense.amount || 0);
  dom.editCategory.value = expense.category || "其他";
  dom.editPayer.value = normalizePayer(expense.payer) || "龍";
  dom.editNote.value = expense.note || "";

  if (typeof dom.editDialog.showModal === "function") {
    dom.editDialog.showModal();
  } else {
    dom.editDialog.setAttribute("open", "");
  }
}

export function closeEditDialog() {
  if (typeof dom.editDialog.close === "function") {
    dom.editDialog.close();
  } else {
    dom.editDialog.removeAttribute("open");
  }
}

export function applyTheme(mode) {
  const activeMode = modes[mode] ? mode : "capybara";
  const modeConfig = modes[activeMode];

  document.documentElement.dataset.mode = activeMode;
  document.documentElement.dataset.theme = activeMode;
  dom.themeToggle.textContent = modeConfig.button;
  dom.themeToggle.setAttribute("aria-label", modeConfig.button);
  dom.themeToggle.title = modeConfig.button;
  dom.themeBadge.textContent = modeConfig.label;
  dom.themeTitle.textContent = modeConfig.title;
  dom.themeDescription.textContent = modeConfig.description;
  dom.modeIllustration.src = modeConfig.image;
  dom.modeIllustration.alt = modeConfig.alt;
}

export function getNextTheme(mode) {
  return modes[mode]?.next || "dragon";
}
