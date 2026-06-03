import {
  auth,
  googleProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "./firebase.js";
import {
  createExpense,
  removeExpense,
  saveExpense,
  subscribeExpenses
} from "./expenses.js";
import { calculateStats, filterExpensesByMonth } from "./stats.js";
import {
  applyTheme,
  closeEditDialog,
  currentMonthString,
  dom,
  getNextTheme,
  getExpenseFromForm,
  openEditDialog,
  renderExpenses,
  renderStats,
  resetAddForm,
  setSignedInView,
  setSignedOutView,
  todayString
} from "./ui.js";

let allExpenses = [];
let unsubscribeExpenses = null;

const savedMode = localStorage.getItem("mode");
localStorage.removeItem("theme");

dom.date.value = todayString();
dom.monthFilter.value = currentMonthString();
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

  try {
    await createExpense(getExpenseFromForm({
      date: dom.date,
      amount: dom.amount,
      category: dom.category,
      payer: dom.payer,
      note: dom.note
    }));
    resetAddForm();
  } catch (error) {
    alert(error.message);
  }
});

dom.monthFilter.addEventListener("change", refreshView);

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
      await removeExpense(expense.id);
    }
  }
});

dom.editForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await saveExpense(dom.editId.value, getExpenseFromForm({
      date: dom.editDate,
      amount: dom.editAmount,
      category: dom.editCategory,
      payer: dom.editPayer,
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

  if (!user) {
    allExpenses = [];
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
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

function refreshView() {
  const filteredExpenses = filterExpensesByMonth(allExpenses, dom.monthFilter.value);
  const stats = calculateStats(filteredExpenses);

  renderStats(stats);
  renderExpenses(filteredExpenses);
}
