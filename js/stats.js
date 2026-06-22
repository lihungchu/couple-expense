export function normalizePayer(payer) {
  if (payer === "Lihung" || payer === "龍") {
    return "龍";
  }

  if (payer === "女友" || payer === "卡皮巴拉") {
    return "卡皮巴拉";
  }

  return payer || "";
}

export function filterExpensesByMonth(expenses, month) {
  if (!month) {
    return expenses;
  }

  return expenses.filter((expense) => String(expense.date || "").startsWith(month));
}

export function getExpenseMonths(expenses) {
  return [...new Set(
    expenses
      .map((expense) => String(expense.date || "").slice(0, 7))
      .filter((month) => /^\d{4}-\d{2}$/.test(month))
  )].sort((a, b) => b.localeCompare(a));
}

export function filterExpensesByDate(expenses, date) {
  if (!date) {
    return [];
  }

  return expenses.filter((expense) => expense.date === date);
}

export function getExpenseDates(expenses) {
  return [...new Set(
    expenses
      .map((expense) => String(expense.date || ""))
      .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
  )].sort((a, b) => b.localeCompare(a));
}

export function calculateStats(expenses) {
  const categoryMap = new Map();
  const payerTotals = {
    "龍": 0,
    "卡皮巴拉": 0
  };

  let total = 0;

  expenses.forEach((expense) => {
    const amount = Number(expense.amount || 0);
    const category = expense.category || "其他";
    const payer = normalizePayer(expense.payer);

    total += amount;
    categoryMap.set(category, (categoryMap.get(category) || 0) + amount);

    if (payer in payerTotals) {
      payerTotals[payer] += amount;
    }
  });

  const categories = [...categoryMap.entries()]
    .map(([name, amount]) => ({
      name,
      amount,
      percent: total > 0 ? amount / total : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    total,
    payerTotals,
    categories
  };
}

export function calculateCategoryStats(expenses, walletId = "") {
  const filteredExpenses = walletId
    ? expenses.filter((expense) => expense.walletId === walletId)
    : expenses;
  const categoryTotals = new Map();
  let total = 0;

  filteredExpenses.forEach((expense) => {
    const amount = Number(expense.amount || 0);
    const category = expense.category || "其他";

    total += amount;
    categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);
  });

  const categories = [...categoryTotals.entries()]
    .map(([name, amount]) => ({
      name,
      amount,
      percent: total > 0 ? amount / total : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    total,
    categories,
    topCategory: categories[0] || null,
    categoryCount: categories.length
  };
}

export function isDateInRange(date, startDate, endDate) {
  return Boolean(date && startDate && endDate && date >= startDate && date <= endDate);
}

export function calculateBudgetSummaries(budgets, expenses, wallets, today) {
  const walletMap = new Map(wallets.map((wallet) => [wallet.id, wallet]));

  return budgets
    .filter((budget) => !budget.archived)
    .map((budget) => {
      const walletIds = budget.walletIds || [];
      const expenseTotal = expenses.reduce((sum, expense) => {
        if (!isDateInRange(expense.date, budget.startDate, budget.endDate)) {
          return sum;
        }

        if (!walletIds.includes(expense.walletId || "__unlinked__")) {
          return sum;
        }

        return sum + Number(expense.amount || 0);
      }, 0);

      const spent = expenseTotal;
      const amount = Number(budget.amount || 0);
      const remaining = amount - spent;
      const daysLeft = calculateDaysLeft(today, budget.endDate);
      const isExpired = Boolean(today && budget.endDate && today > budget.endDate);
      const dailyAvailable = remaining > 0 && !isExpired ? remaining / daysLeft : 0;
      const walletNames = walletIds.map((walletId) => walletMap.get(walletId)?.name || "未連動錢包");

      return {
        ...budget,
        amount,
        spent,
        remaining,
        overAmount: remaining < 0 ? Math.abs(remaining) : 0,
        daysLeft,
        dailyAvailable,
        isExpired,
        walletNames
      };
    })
    .sort((a, b) => String(a.endDate).localeCompare(String(b.endDate)));
}

function calculateDaysLeft(today, endDate) {
  const todayDate = new Date(`${today}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diffDays = Math.floor((end - todayDate) / 86400000) + 1;

  return Math.max(diffDays, 1);
}
