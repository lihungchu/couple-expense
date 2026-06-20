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
  walletId: document.getElementById("walletId"),
  note: document.getElementById("note"),
  walletForm: document.getElementById("walletForm"),
  walletName: document.getElementById("walletName"),
  walletOwner: document.getElementById("walletOwner"),
  walletInitialBalance: document.getElementById("walletInitialBalance"),
  walletList: document.getElementById("walletList"),
  walletStatus: document.getElementById("walletStatus"),
  createDefaultWalletsBtn: document.getElementById("createDefaultWalletsBtn"),
  walletSubmitBtn: document.getElementById("walletSubmitBtn"),
  walletTransactionForm: document.getElementById("walletTransactionForm"),
  walletTransactionType: document.getElementById("walletTransactionType"),
  transactionWalletId: document.getElementById("transactionWalletId"),
  transactionToWalletId: document.getElementById("transactionToWalletId"),
  toWalletField: document.getElementById("toWalletField"),
  walletTransactionAmountLabel: document.getElementById("walletTransactionAmountLabel"),
  walletTransactionAmount: document.getElementById("walletTransactionAmount"),
  walletTransactionDate: document.getElementById("walletTransactionDate"),
  walletTransactionNote: document.getElementById("walletTransactionNote"),
  walletTransactionList: document.getElementById("walletTransactionList"),
  monthFilter: document.getElementById("monthFilter"),
  statsWalletFilter: document.getElementById("statsWalletFilter"),
  monthlyTotal: document.getElementById("monthlyTotal"),
  topWalletTotal: document.getElementById("topWalletTotal"),
  walletCountTotal: document.getElementById("walletCountTotal"),
  budgetStatus: document.getElementById("budgetStatus"),
  budgetList: document.getElementById("budgetList"),
  budgetForm: document.getElementById("budgetForm"),
  budgetId: document.getElementById("budgetId"),
  budgetName: document.getElementById("budgetName"),
  budgetAmount: document.getElementById("budgetAmount"),
  budgetStartDate: document.getElementById("budgetStartDate"),
  budgetEndDate: document.getElementById("budgetEndDate"),
  budgetWalletChecklist: document.getElementById("budgetWalletChecklist"),
  budgetSubmitBtn: document.getElementById("budgetSubmitBtn"),
  cancelBudgetEditBtn: document.getElementById("cancelBudgetEditBtn"),
  themeBadge: document.getElementById("themeBadge"),
  themeTitle: document.getElementById("themeTitle"),
  themeDescription: document.getElementById("themeDescription"),
  modeIllustration: document.getElementById("modeIllustration"),
  categoryStats: document.getElementById("categoryStats"),
  categoryChart: document.getElementById("categoryChart"),
  chartEmpty: document.getElementById("chartEmpty"),
  expenseMonthFilter: document.getElementById("expenseMonthFilter"),
  expenseList: document.getElementById("expenseList"),
  recordCount: document.getElementById("recordCount"),
  editDialog: document.getElementById("editDialog"),
  editForm: document.getElementById("editForm"),
  editId: document.getElementById("editId"),
  editDate: document.getElementById("editDate"),
  editAmount: document.getElementById("editAmount"),
  editCategory: document.getElementById("editCategory"),
  editPayer: document.getElementById("editPayer"),
  editWalletId: document.getElementById("editWalletId"),
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

  if (!formElements.walletId.value) {
    throw new Error("請選擇付款錢包");
  }

  return {
    date: formElements.date.value,
    amount,
    category: formElements.category.value,
    payer: formElements.payer.value,
    walletId: formElements.walletId.value,
    note: formElements.note.value.trim()
  };
}

export function getWalletFromForm() {
  const name = dom.walletName.value.trim();
  const initialBalance = Number(dom.walletInitialBalance.value || 0);

  if (!name) {
    throw new Error("請輸入錢包名稱");
  }

  if (!Number.isFinite(initialBalance)) {
    throw new Error("請輸入正確初始餘額");
  }

  return {
    name,
    owner: dom.walletOwner.value,
    initialBalance,
    date: todayString()
  };
}

export function getWalletTransactionFromForm() {
  const type = dom.walletTransactionType.value;
  const amount = Number(dom.walletTransactionAmount.value);

  if (!dom.transactionWalletId.value) {
    throw new Error("請選擇來源錢包");
  }

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("請輸入正確金額");
  }

  if (type === "transfer" && !dom.transactionToWalletId.value) {
    throw new Error("請選擇目標錢包");
  }

  if (type === "transfer" && dom.transactionWalletId.value === dom.transactionToWalletId.value) {
    throw new Error("來源錢包和目標錢包不能相同");
  }

  return {
    type,
    walletId: dom.transactionWalletId.value,
    toWalletId: type === "transfer" ? dom.transactionToWalletId.value : "",
    amount,
    date: dom.walletTransactionDate.value || todayString(),
    note: dom.walletTransactionNote.value.trim()
  };
}

export function getBudgetFromForm() {
  const amount = Number(dom.budgetAmount.value);
  const walletIds = [...dom.budgetWalletChecklist.querySelectorAll("input[type='checkbox']:checked")]
    .map((input) => input.value);

  if (!dom.budgetName.value.trim()) {
    throw new Error("請輸入預算名稱");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("請輸入正確預算金額");
  }

  if (!dom.budgetStartDate.value || !dom.budgetEndDate.value) {
    throw new Error("請選擇預算日期區間");
  }

  if (dom.budgetStartDate.value > dom.budgetEndDate.value) {
    throw new Error("結束日期不能早於開始日期");
  }

  if (!walletIds.length) {
    throw new Error("請至少選擇一個錢包");
  }

  return {
    name: dom.budgetName.value.trim(),
    amount,
    startDate: dom.budgetStartDate.value,
    endDate: dom.budgetEndDate.value,
    walletIds
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
    categories: [],
    topCategory: null,
    categoryCount: 0
  });
  renderWallets([]);
  renderWalletOptions([]);
  renderWalletTransactions([], []);
  setWalletStatus("");
  renderBudgets([]);
  renderExpenseMonthOptions([], "");
  setBudgetStatus("");
}

export function resetAddForm() {
  dom.expenseForm.reset();
  dom.date.value = todayString();
}

export function resetWalletForm() {
  dom.walletForm.reset();
  dom.walletInitialBalance.value = 0;
}

export function setWalletBusy(isBusy, label = "新增錢包") {
  dom.walletSubmitBtn.disabled = isBusy;
  dom.createDefaultWalletsBtn.disabled = isBusy;
  dom.walletSubmitBtn.textContent = isBusy ? "新增中..." : label;
}

export function setWalletStatus(message, type = "") {
  dom.walletStatus.textContent = message;
  dom.walletStatus.className = `status-message ${type}`.trim();
  dom.walletStatus.classList.toggle("hidden", !message);
}

export function resetWalletTransactionForm() {
  dom.walletTransactionForm.reset();
  dom.walletTransactionDate.value = todayString();
  updateWalletTransactionMode();
}

export function resetBudgetForm() {
  dom.budgetForm.reset();
  dom.budgetId.value = "";
  dom.budgetStartDate.value = todayString();
  dom.budgetEndDate.value = todayString();
  dom.budgetWalletChecklist
    .querySelectorAll("input[type='checkbox']")
    .forEach((input) => {
      input.checked = false;
    });
  dom.budgetSubmitBtn.textContent = "新增預算";
  dom.cancelBudgetEditBtn.classList.add("hidden");
}

export function setBudgetStatus(message, type = "") {
  dom.budgetStatus.textContent = message;
  dom.budgetStatus.className = `status-message ${type}`.trim();
  dom.budgetStatus.classList.toggle("hidden", !message);
}

export function updateWalletTransactionMode() {
  const type = dom.walletTransactionType.value;
  const isTransfer = type === "transfer";
  const isAdjustment = type === "adjustment";

  dom.toWalletField.classList.toggle("hidden", !isTransfer);
  dom.transactionToWalletId.required = isTransfer;
  dom.walletTransactionAmountLabel.textContent = isAdjustment ? "調整後餘額" : "金額";
}

export function renderStats(stats) {
  dom.monthlyTotal.textContent = formatCurrency(stats.total);
  dom.topWalletTotal.textContent = stats.topCategory
    ? `${stats.topCategory.name} ${formatCurrency(stats.topCategory.amount)}`
    : "無";
  dom.walletCountTotal.textContent = `${stats.categoryCount || 0}`;
  dom.chartEmpty.classList.toggle("hidden", stats.categories.length > 0);

  drawPieChart(dom.categoryChart, stats.categories);
  renderCategoryStats(stats.categories);
}

export function renderStatsWalletOptions(wallets) {
  const activeWallets = wallets.filter((wallet) => !wallet.archived);
  const currentValue = dom.statsWalletFilter.value;

  dom.statsWalletFilter.replaceChildren();

  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "全部錢包";
  dom.statsWalletFilter.append(allOption);

  activeWallets.forEach((wallet) => {
    const option = document.createElement("option");
    option.value = wallet.id;
    option.textContent = wallet.name;
    dom.statsWalletFilter.append(option);
  });

  if (activeWallets.some((wallet) => wallet.id === currentValue)) {
    dom.statsWalletFilter.value = currentValue;
  }
}

export function renderExpenseMonthOptions(months, preferredMonth) {
  const currentValue = preferredMonth || dom.expenseMonthFilter.value;
  dom.expenseMonthFilter.replaceChildren();

  if (!months.length) {
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "尚無支出";
    dom.expenseMonthFilter.append(empty);
    dom.expenseMonthFilter.disabled = true;
    return "";
  }

  months.forEach((month) => {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = month;
    dom.expenseMonthFilter.append(option);
  });

  const selectedMonth = months.includes(currentValue) ? currentValue : months[0];
  dom.expenseMonthFilter.value = selectedMonth;
  dom.expenseMonthFilter.disabled = false;

  return selectedMonth;
}

export function renderBudgetWalletOptions(wallets) {
  const selected = new Set(
    [...dom.budgetWalletChecklist.querySelectorAll("input[type='checkbox']:checked")]
      .map((input) => input.value)
  );
  const activeWallets = wallets.filter((wallet) => !wallet.archived);

  dom.budgetWalletChecklist.replaceChildren();

  if (!activeWallets.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state compact-empty";
    empty.textContent = "請先新增錢包";
    dom.budgetWalletChecklist.append(empty);
    return;
  }

  activeWallets.forEach((wallet) => {
    const option = document.createElement("label");
    option.className = "wallet-check-option";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = wallet.id;
    input.checked = selected.has(wallet.id);

    const text = document.createElement("span");
    text.textContent = `${wallet.name} (${formatCurrency(wallet.balance)})`;

    option.append(input, text);
    dom.budgetWalletChecklist.append(option);
  });
}

export function renderBudgets(budgetSummaries) {
  dom.budgetList.replaceChildren();

  if (!budgetSummaries.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "尚無預算，新增一個日期區間開始規劃";
    dom.budgetList.append(empty);
    return;
  }

  budgetSummaries.forEach((budget) => {
    const item = document.createElement("article");
    item.className = `budget-card ${budget.overAmount > 0 ? "over-budget" : ""}`;

    const heading = document.createElement("div");
    heading.className = "budget-heading";

    const title = document.createElement("strong");
    title.textContent = budget.name;

    const range = document.createElement("span");
    range.className = "muted";
    range.textContent = `${budget.startDate} 到 ${budget.endDate}`;

    const wallets = document.createElement("p");
    wallets.className = "budget-wallets";
    wallets.textContent = budget.walletNames.join("、") || "未選錢包";

    const source = document.createElement("p");
    source.className = "budget-source";
    source.textContent = "根據支出紀錄計算";

    const metrics = document.createElement("div");
    metrics.className = "budget-metrics";
    metrics.append(
      createMetric("預算", formatCurrency(budget.amount)),
      createMetric("期間支出", formatCurrency(budget.spent)),
      createMetric("剩餘", formatCurrency(Math.max(budget.remaining, 0))),
      createMetric("每日可花", formatCurrency(budget.dailyAvailable))
    );

    const over = document.createElement("p");
    over.className = "budget-over";
    if (budget.overAmount > 0) {
      over.textContent = `已超支 ${formatCurrency(budget.overAmount)}`;
    } else if (budget.isExpired) {
      over.textContent = `已結束，剩餘 ${formatCurrency(Math.max(budget.remaining, 0))}`;
    } else {
      over.textContent = `${budget.daysLeft} 天可用`;
    }

    const actions = document.createElement("div");
    actions.className = "budget-actions";

    const edit = document.createElement("button");
    edit.className = "secondary-button compact-button";
    edit.type = "button";
    edit.dataset.action = "edit-budget";
    edit.dataset.id = budget.id;
    edit.textContent = "編輯";

    const archive = document.createElement("button");
    archive.className = "danger-button compact-button";
    archive.type = "button";
    archive.dataset.action = "archive-budget";
    archive.dataset.id = budget.id;
    archive.textContent = "封存";

    actions.append(edit, archive);
    heading.append(title, range);
    item.append(heading, wallets, source, metrics, over, actions);
    dom.budgetList.append(item);
  });
}

export function openBudgetEdit(budget) {
  dom.budgetId.value = budget.id;
  dom.budgetName.value = budget.name || "";
  dom.budgetAmount.value = Number(budget.amount || 0);
  dom.budgetStartDate.value = budget.startDate || todayString();
  dom.budgetEndDate.value = budget.endDate || todayString();

  [...dom.budgetWalletChecklist.querySelectorAll("input[type='checkbox']")].forEach((input) => {
    input.checked = (budget.walletIds || []).includes(input.value);
  });

  dom.budgetSubmitBtn.textContent = "儲存預算";
  dom.cancelBudgetEditBtn.classList.remove("hidden");
}

export function renderWallets(wallets) {
  dom.walletList.replaceChildren();
  dom.createDefaultWalletsBtn.classList.toggle("hidden", wallets.length > 0);

  const visibleWallets = wallets.filter((wallet) => !wallet.archived);

  if (!visibleWallets.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "還沒有錢包，先建立預設錢包或新增一個帳戶";
    dom.walletList.append(empty);
    return;
  }

  visibleWallets.forEach((wallet) => {
    const item = document.createElement("article");
    item.className = "wallet-card";

    const body = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = wallet.name || "未命名錢包";

    const owner = document.createElement("span");
    owner.className = "pill";
    owner.textContent = wallet.owner || "共同";

    const balance = document.createElement("p");
    balance.className = "wallet-balance";
    balance.textContent = formatCurrency(wallet.balance);

    const archiveBtn = document.createElement("button");
    archiveBtn.className = "danger-button compact-button";
    archiveBtn.type = "button";
    archiveBtn.dataset.action = "archive-wallet";
    archiveBtn.dataset.id = wallet.id;
    archiveBtn.textContent = "封存";

    body.append(name, owner);
    item.append(body, balance, archiveBtn);
    dom.walletList.append(item);
  });
}

export function renderWalletOptions(wallets) {
  const activeWallets = wallets.filter((wallet) => !wallet.archived);
  const selects = [dom.walletId, dom.editWalletId, dom.transactionWalletId, dom.transactionToWalletId];

  selects.forEach((select) => {
    const currentValue = select.value;
    select.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = activeWallets.length ? "請選擇錢包" : "請先新增錢包";
    select.append(placeholder);

    activeWallets.forEach((wallet) => {
      const option = document.createElement("option");
      option.value = wallet.id;
      option.textContent = `${wallet.name} (${formatCurrency(wallet.balance)})`;
      select.append(option);
    });

    if (activeWallets.some((wallet) => wallet.id === currentValue)) {
      select.value = currentValue;
    }
  });
}

function createMetric(label, value) {
  const item = document.createElement("div");
  const labelNode = document.createElement("span");
  const valueNode = document.createElement("strong");

  labelNode.textContent = label;
  valueNode.textContent = value;
  item.append(labelNode, valueNode);

  return item;
}

export function renderWalletTransactions(transactions, wallets) {
  dom.walletTransactionList.replaceChildren();

  if (!transactions.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "尚無錢包流水";
    dom.walletTransactionList.append(empty);
    return;
  }

  transactions.slice(0, 8).forEach((entry) => {
    const item = document.createElement("article");
    item.className = "wallet-transaction-item";

    const title = document.createElement("strong");
    title.textContent = getTransactionTitle(entry, wallets);

    const meta = document.createElement("span");
    meta.className = "muted";
    meta.textContent = `${entry.date || "未填日期"} · ${entry.note || "無備註"}`;

    const amount = document.createElement("span");
    const isOutflow = entry.type === "expense"
      || entry.type === "transfer"
      || entry.type === "budgetDeduction"
      || entry.amount < 0;
    amount.className = isOutflow ? "wallet-outflow" : "wallet-inflow";
    amount.textContent = `${isOutflow ? "-" : ""}${formatCurrency(Math.abs(entry.amount || 0))}`;

    item.append(title, meta, amount);
    dom.walletTransactionList.append(item);
  });
}

function getTransactionTitle(entry, wallets) {
  const walletName = getWalletName(wallets, entry.walletId);
  const toWalletName = getWalletName(wallets, entry.toWalletId);

  if (entry.type === "income") {
    return `收入到 ${walletName}`;
  }

  if (entry.type === "transfer") {
    return `${walletName} 轉到 ${toWalletName}`;
  }

  if (entry.type === "adjustment") {
    return `調整 ${walletName}`;
  }

  if (entry.type === "expense") {
    return `${walletName} 支出`;
  }

  if (entry.type === "budgetDeduction") {
    return `${walletName} 預算扣款`;
  }

  return walletName;
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

export function renderExpenses(expenses, wallets = []) {
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
    dom.expenseList.append(createExpenseItem(expense, wallets));
  });
}

function createExpenseItem(expense, wallets) {
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

  const wallet = document.createElement("span");
  wallet.className = "pill";
  wallet.textContent = getWalletName(wallets, expense.walletId);

  const note = document.createElement("p");
  note.className = "expense-note";
  note.textContent = expense.note || "無備註";

  topline.append(amount, date);
  meta.append(category, payer, wallet);
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
  dom.editWalletId.value = expense.walletId || "";
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

function getWalletName(wallets, walletId) {
  if (!walletId) {
    return "未連動錢包";
  }

  return wallets.find((wallet) => wallet.id === walletId)?.name || "已封存錢包";
}
