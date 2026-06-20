import {
  auth,
  googleProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "./firebase.js";
import {
  subscribeExpenses
} from "./expenses.js";
import {
  archiveWallet,
  createDefaultWallets,
  createExpenseWithWallet,
  createWallet,
  createWalletTransaction,
  removeExpenseWithWallet,
  saveExpenseWithWallet,
  subscribeWallets,
  subscribeWalletTransactions
} from "./wallets.js";
import {
  calculateBudgetSummaries,
  calculateCategoryStats,
  filterExpensesByMonth,
  getExpenseMonths
} from "./stats.js";
import {
  archiveBudget,
  createBudget,
  saveBudget,
  subscribeBudgets
} from "./budgets.js";
import {
  applyTheme,
  closeEditDialog,
  currentMonthString,
  dom,
  getNextTheme,
  getBudgetFromForm,
  getExpenseFromForm,
  getWalletFromForm,
  getWalletTransactionFromForm,
  openBudgetEdit,
  openEditDialog,
  renderExpenses,
  renderBudgetWalletOptions,
  renderExpenseMonthOptions,
  renderBudgets,
  renderStatsWalletOptions,
  renderStats,
  renderWalletOptions,
  renderWallets,
  renderWalletTransactions,
  resetAddForm,
  resetBudgetForm,
  resetWalletForm,
  resetWalletTransactionForm,
  setWalletBusy,
  setWalletStatus,
  setBudgetStatus,
  setSignedInView,
  setSignedOutView,
  todayString,
  updateWalletTransactionMode
} from "./ui.js";

let allExpenses = [];
let allWallets = [];
let allWalletTransactions = [];
let allBudgets = [];
let unsubscribeExpenses = null;
let unsubscribeWallets = null;
let unsubscribeWalletTransactions = null;
let unsubscribeBudgets = null;

const savedMode = localStorage.getItem("mode");
localStorage.removeItem("theme");

dom.date.value = todayString();
dom.monthFilter.value = currentMonthString();
dom.walletTransactionDate.value = todayString();
dom.budgetStartDate.value = todayString();
dom.budgetEndDate.value = todayString();
updateWalletTransactionMode();
applyTheme(savedMode || "capybara");

dom.loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    alert(`登入失敗：${error.message}`);
  }
});

dom.logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

dom.themeToggle.addEventListener("click", () => {
  const currentTheme = document.documentElement.dataset.mode || "capybara";
  const nextTheme = getNextTheme(currentTheme);
  localStorage.setItem("mode", nextTheme);
  applyTheme(nextTheme);
  refreshView();
});

dom.expenseForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!allWallets.some((wallet) => !wallet.archived)) {
    alert("請先新增錢包，再新增支出");
    return;
  }

  try {
    await createExpenseWithWallet(getExpenseFromForm({
      date: dom.date,
      amount: dom.amount,
      category: dom.category,
      payer: dom.payer,
      walletId: dom.walletId,
      note: dom.note
    }));
    resetAddForm();
  } catch (error) {
    alert(error.message);
  }
});

dom.monthFilter.addEventListener("change", refreshView);
dom.statsWalletFilter.addEventListener("change", refreshView);
dom.expenseMonthFilter.addEventListener("change", refreshExpenseList);

dom.walletTransactionType.addEventListener("change", updateWalletTransactionMode);

dom.createDefaultWalletsBtn.addEventListener("click", async () => {
  setWalletBusy(true);
  setWalletStatus("正在建立預設錢包...");

  try {
    await createDefaultWallets();
    setWalletStatus("預設錢包已建立，正在同步列表...", "success");
  } catch (error) {
    setWalletStatus(getWalletErrorMessage(error), "error");
  } finally {
    setWalletBusy(false);
  }
});

dom.walletForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setWalletBusy(true);
  setWalletStatus("正在新增錢包...");

  try {
    await createWallet(getWalletFromForm());
    resetWalletForm();
    setWalletStatus("錢包已新增，正在同步列表...", "success");
  } catch (error) {
    setWalletStatus(getWalletErrorMessage(error), "error");
  } finally {
    setWalletBusy(false);
  }
});

dom.walletTransactionForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await createWalletTransaction(getWalletTransactionFromForm());
    resetWalletTransactionForm();
  } catch (error) {
    alert(error.message);
  }
});

dom.budgetForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const budget = getBudgetFromForm();

    if (dom.budgetId.value) {
      await saveBudget(dom.budgetId.value, budget);
      setBudgetStatus("預算已更新", "success");
    } else {
      await createBudget(budget);
      setBudgetStatus("預算已新增", "success");
    }

    resetBudgetForm();
  } catch (error) {
    setBudgetStatus(getBudgetErrorMessage(error), "error");
  }
});

dom.cancelBudgetEditBtn.addEventListener("click", resetBudgetForm);

dom.budgetList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const budget = allBudgets.find((item) => item.id === button.dataset.id);

  if (!budget) {
    return;
  }

  if (button.dataset.action === "edit-budget") {
    renderBudgetWalletOptions(allWallets);
    openBudgetEdit(budget);
    return;
  }

  if (button.dataset.action === "archive-budget") {
    const confirmed = confirm("確定要封存這個預算嗎？");

    if (confirmed) {
      await archiveBudget(budget.id);
    }
  }
});

dom.walletList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action='archive-wallet']");

  if (!button) {
    return;
  }

  const confirmed = confirm("確定要封存這個錢包嗎？封存後不會出現在新交易選單，但歷史紀錄會保留。");

  if (confirmed) {
    await archiveWallet(button.dataset.id);
  }
});

dom.expenseList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const expense = allExpenses.find((item) => item.id === button.dataset.id);

  if (!expense) {
    return;
  }

  if (button.dataset.action === "edit") {
    openEditDialog(expense);
    return;
  }

  if (button.dataset.action === "delete") {
    const confirmed = confirm(`確定要刪除「${expense.note || expense.category || "這筆支出"}」嗎？`);

    if (confirmed) {
      await removeExpenseWithWallet(expense.id);
    }
  }
});

dom.editForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await saveExpenseWithWallet(dom.editId.value, getExpenseFromForm({
      date: dom.editDate,
      amount: dom.editAmount,
      category: dom.editCategory,
      payer: dom.editPayer,
      walletId: dom.editWalletId,
      note: dom.editNote
    }));
    closeEditDialog();
  } catch (error) {
    alert(error.message);
  }
});

dom.closeEditBtn.addEventListener("click", closeEditDialog);
dom.cancelEditBtn.addEventListener("click", closeEditDialog);

onAuthStateChanged(auth, (user) => {
  if (unsubscribeExpenses) {
    unsubscribeExpenses();
    unsubscribeExpenses = null;
  }

  if (unsubscribeWallets) {
    unsubscribeWallets();
    unsubscribeWallets = null;
  }

  if (unsubscribeWalletTransactions) {
    unsubscribeWalletTransactions();
    unsubscribeWalletTransactions = null;
  }

  if (unsubscribeBudgets) {
    unsubscribeBudgets();
    unsubscribeBudgets = null;
  }

  if (!user) {
    allExpenses = [];
    allWallets = [];
    allWalletTransactions = [];
    allBudgets = [];
    setSignedOutView();
    return;
  }

  setSignedInView(user);

  unsubscribeExpenses = subscribeExpenses(
    (expenses) => {
      allExpenses = expenses;
      refreshView();
    },
    (error) => {
      alert(`讀取資料失敗：${error.message}`);
    }
  );

  unsubscribeWallets = subscribeWallets(
    (wallets) => {
      allWallets = wallets;
      if (wallets.length > 0) {
        setWalletStatus("");
      }
      refreshWalletView();
      refreshView();
    },
    (error) => {
      setWalletStatus(getWalletErrorMessage(error), "error");
    }
  );

  unsubscribeWalletTransactions = subscribeWalletTransactions(
    (transactions) => {
      allWalletTransactions = transactions;
      refreshWalletView();
    },
    (error) => {
      setWalletStatus(getWalletErrorMessage(error), "error");
    }
  );

  unsubscribeBudgets = subscribeBudgets(
    (budgets) => {
      allBudgets = budgets;
      refreshBudgetView();
    },
    (error) => {
      setBudgetStatus(getBudgetErrorMessage(error), "error");
    }
  );
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

function refreshView() {
  const filteredExpenses = filterExpensesByMonth(allExpenses, dom.monthFilter.value);
  const stats = calculateCategoryStats(filteredExpenses, dom.statsWalletFilter.value);

  renderStats(stats);
  refreshExpenseList();
  refreshBudgetView();
}

function refreshExpenseList() {
  const selectedMonth = renderExpenseMonthOptions(
    getExpenseMonths(allExpenses),
    dom.expenseMonthFilter.value || currentMonthString()
  );
  const visibleExpenses = selectedMonth ? filterExpensesByMonth(allExpenses, selectedMonth) : [];

  renderExpenses(visibleExpenses, allWallets);
}

function refreshWalletView() {
  renderWallets(allWallets);
  renderWalletOptions(allWallets);
  renderBudgetWalletOptions(allWallets);
  renderStatsWalletOptions(allWallets);
  renderWalletTransactions(allWalletTransactions, allWallets);
  refreshBudgetView();
}

function getWalletErrorMessage(error) {
  const message = error?.message || String(error);

  if (error?.code === "permission-denied" || message.includes("Missing or insufficient permissions")) {
    return "錢包讀寫被 Firestore 規則擋住了。請到 Firebase Console > Firestore Database > Rules，貼上 firestore.rules 內容並發布；GitHub Pages 不會自動發布規則。";
  }

  return `錢包操作失敗：${message}`;
}

function refreshBudgetView() {
  const summaries = calculateBudgetSummaries(
    allBudgets,
    allExpenses,
    allWallets,
    todayString()
  );

  renderBudgets(summaries);
}

function getBudgetErrorMessage(error) {
  const message = error?.message || String(error);

  if (error?.code === "permission-denied" || message.includes("Missing or insufficient permissions")) {
    return "預算讀寫被 Firestore 規則擋住了。請到 Firebase Console > Firestore Database > Rules，加入 budgets 規則並發布。";
  }

  return `預算操作失敗：${message}`;
}
