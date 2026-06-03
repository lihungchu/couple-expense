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
