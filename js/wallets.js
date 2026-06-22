import {
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { db } from "./firebase.js";

const walletsRef = collection(db, "wallets");
const walletTransactionsRef = collection(db, "walletTransactions");
const expensesRef = collection(db, "expenses");

export function subscribeWallets(onChange, onError) {
  const walletsQuery = query(walletsRef, orderBy("createdAt", "asc"));

  return onSnapshot(
    walletsQuery,
    (snapshot) => {
      onChange(snapshot.docs.map((walletDoc) => ({
        id: walletDoc.id,
        ...walletDoc.data()
      })));
    },
    onError
  );
}

export function subscribeWalletTransactions(onChange, onError) {
  const transactionsQuery = query(walletTransactionsRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    transactionsQuery,
    (snapshot) => {
      onChange(snapshot.docs.map((transactionDoc) => ({
        id: transactionDoc.id,
        ...transactionDoc.data()
      })));
    },
    onError
  );
}

export function createDefaultWallets() {
  return runTransaction(db, async (transaction) => {
    const dragonWallet = doc(walletsRef);
    const capybaraWallet = doc(walletsRef);
    const createdAt = serverTimestamp();

    transaction.set(dragonWallet, {
      name: "龍的錢包",
      owner: "龍",
      initialBalance: 0,
      balance: 0,
      archived: false,
      createdAt,
      updatedAt: createdAt
    });

    transaction.set(capybaraWallet, {
      name: "卡皮巴拉的錢包",
      owner: "卡皮巴拉",
      initialBalance: 0,
      balance: 0,
      archived: false,
      createdAt,
      updatedAt: createdAt
    });
  });
}

export function createWallet(wallet) {
  const walletRef = doc(walletsRef);
  const initialBalance = Number(wallet.initialBalance || 0);

  return runTransaction(db, async (transaction) => {
    const createdAt = serverTimestamp();

    transaction.set(walletRef, {
      name: wallet.name,
      owner: wallet.owner,
      initialBalance,
      balance: initialBalance,
      archived: false,
      createdAt,
      updatedAt: createdAt
    });

    if (initialBalance !== 0) {
      transaction.set(doc(walletTransactionsRef), {
        type: "adjustment",
        walletId: walletRef.id,
        toWalletId: "",
        amount: initialBalance,
        targetBalance: initialBalance,
        date: wallet.date,
        note: "初始餘額",
        expenseId: "",
        createdAt
      });
    }
  });
}

export function archiveWallet(walletId) {
  return runTransaction(db, async (transaction) => {
    transaction.update(doc(db, "wallets", walletId), {
      archived: true,
      updatedAt: serverTimestamp()
    });
  });
}

export function createWalletTransaction(entry) {
  const amount = Number(entry.amount || 0);

  return runTransaction(db, async (transaction) => {
    const createdAt = serverTimestamp();
    const walletRef = doc(db, "wallets", entry.walletId);

    if (entry.type === "income") {
      transaction.update(walletRef, {
        balance: increment(amount),
        updatedAt: createdAt
      });
    }

    if (entry.type === "transfer") {
      const toWalletRef = doc(db, "wallets", entry.toWalletId);

      transaction.update(walletRef, {
        balance: increment(-amount),
        updatedAt: createdAt
      });
      transaction.update(toWalletRef, {
        balance: increment(amount),
        updatedAt: createdAt
      });
    }

    if (entry.type === "adjustment") {
      const walletSnapshot = await transaction.get(walletRef);
      const currentBalance = Number(walletSnapshot.data()?.balance || 0);
      const difference = amount - currentBalance;

      transaction.update(walletRef, {
        balance: amount,
        updatedAt: createdAt
      });

      transaction.set(doc(walletTransactionsRef), {
        type: entry.type,
        walletId: entry.walletId,
        toWalletId: "",
        amount: difference,
        targetBalance: amount,
        date: entry.date,
        note: entry.note || "",
        expenseId: "",
        createdAt
      });
      return;
    }

    transaction.set(doc(walletTransactionsRef), {
      type: entry.type,
      walletId: entry.walletId,
      toWalletId: entry.toWalletId || "",
      amount,
      date: entry.date,
      note: entry.note || "",
      expenseId: "",
      createdAt
    });
  });
}

export function removeManualWalletTransaction(entry) {
  const transactionRef = doc(db, "walletTransactions", entry.id);

  return runTransaction(db, async (transaction) => {
    const transactionSnapshot = await transaction.get(transactionRef);
    const currentEntry = {
      id: entry.id,
      ...transactionSnapshot.data()
    };
    const updatedAt = serverTimestamp();

    validateManualWalletTransaction(currentEntry);
    reverseWalletTransaction(transaction, currentEntry, updatedAt);
    transaction.delete(transactionRef);
  });
}

export function saveManualWalletTransaction(transactionId, nextEntry) {
  const transactionRef = doc(db, "walletTransactions", transactionId);
  const amount = Number(nextEntry.amount || 0);

  return runTransaction(db, async (transaction) => {
    const transactionSnapshot = await transaction.get(transactionRef);
    const previousEntry = {
      id: transactionId,
      ...transactionSnapshot.data()
    };
    const updatedAt = serverTimestamp();
    const normalizedNextEntry = {
      type: nextEntry.type,
      walletId: nextEntry.walletId,
      toWalletId: nextEntry.type === "transfer" ? nextEntry.toWalletId : "",
      amount,
      date: nextEntry.date,
      note: nextEntry.note || ""
    };

    validateManualWalletTransaction(previousEntry);
    validateManualWalletTransaction(normalizedNextEntry);

    reverseWalletTransaction(transaction, previousEntry, updatedAt);
    applyWalletTransaction(transaction, normalizedNextEntry, updatedAt);

    transaction.update(transactionRef, {
      ...normalizedNextEntry,
      updatedAt
    });
  });
}

function validateManualWalletTransaction(entry) {
  const amount = Number(entry.amount || 0);

  if (!entry || !["income", "transfer"].includes(entry.type) || entry.expenseId || entry.budgetId) {
    throw new Error("這筆流水不能在錢包流水中編輯或刪除");
  }

  if (!entry.walletId) {
    throw new Error("流水缺少來源錢包");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("請輸入正確金額");
  }

  if (entry.type === "transfer" && !entry.toWalletId) {
    throw new Error("轉帳缺少目標錢包");
  }

  if (entry.type === "transfer" && entry.walletId === entry.toWalletId) {
    throw new Error("來源錢包和目標錢包不能相同");
  }
}

function reverseWalletTransaction(transaction, entry, updatedAt) {
  const amount = Number(entry.amount || 0);

  if (entry.type === "income") {
    transaction.update(doc(db, "wallets", entry.walletId), {
      balance: increment(-amount),
      updatedAt
    });
    return;
  }

  transaction.update(doc(db, "wallets", entry.walletId), {
    balance: increment(amount),
    updatedAt
  });
  transaction.update(doc(db, "wallets", entry.toWalletId), {
    balance: increment(-amount),
    updatedAt
  });
}

function applyWalletTransaction(transaction, entry, updatedAt) {
  const amount = Number(entry.amount || 0);

  if (entry.type === "income") {
    transaction.update(doc(db, "wallets", entry.walletId), {
      balance: increment(amount),
      updatedAt
    });
    return;
  }

  transaction.update(doc(db, "wallets", entry.walletId), {
    balance: increment(-amount),
    updatedAt
  });
  transaction.update(doc(db, "wallets", entry.toWalletId), {
    balance: increment(amount),
    updatedAt
  });
}

export function createExpenseWithWallet(expense) {
  const expenseRef = doc(expensesRef);
  const transactionRef = doc(db, "walletTransactions", `expense_${expenseRef.id}`);
  const walletRef = doc(db, "wallets", expense.walletId);
  const amount = Number(expense.amount);

  return runTransaction(db, async (transaction) => {
    const createdAt = serverTimestamp();

    transaction.set(expenseRef, {
      date: expense.date,
      amount,
      category: expense.category,
      payer: expense.payer,
      walletId: expense.walletId,
      note: expense.note || "",
      createdAt
    });

    transaction.update(walletRef, {
      balance: increment(-amount),
      updatedAt: createdAt
    });

    transaction.set(transactionRef, {
      type: "expense",
      walletId: expense.walletId,
      toWalletId: "",
      amount,
      date: expense.date,
      note: expense.note || expense.category || "共同支出",
      expenseId: expenseRef.id,
      createdAt
    });
  });
}

export function saveExpenseWithWallet(expenseId, expense) {
  const expenseRef = doc(db, "expenses", expenseId);
  const transactionRef = doc(db, "walletTransactions", `expense_${expenseId}`);
  const amount = Number(expense.amount);

  return runTransaction(db, async (transaction) => {
    const expenseSnapshot = await transaction.get(expenseRef);
    const previousExpense = expenseSnapshot.data() || {};
    const updatedAt = serverTimestamp();

    if (previousExpense.walletId) {
      transaction.update(doc(db, "wallets", previousExpense.walletId), {
        balance: increment(Number(previousExpense.amount || 0)),
        updatedAt
      });
    }

    transaction.update(doc(db, "wallets", expense.walletId), {
      balance: increment(-amount),
      updatedAt
    });

    transaction.update(expenseRef, {
      date: expense.date,
      amount,
      category: expense.category,
      payer: expense.payer,
      walletId: expense.walletId,
      note: expense.note || "",
      updatedAt
    });

    transaction.set(transactionRef, {
      type: "expense",
      walletId: expense.walletId,
      toWalletId: "",
      amount,
      date: expense.date,
      note: expense.note || expense.category || "共同支出",
      expenseId,
      createdAt: previousExpense.createdAt || updatedAt,
      updatedAt
    });
  });
}

export function removeExpenseWithWallet(expenseId) {
  const expenseRef = doc(db, "expenses", expenseId);
  const transactionRef = doc(db, "walletTransactions", `expense_${expenseId}`);

  return runTransaction(db, async (transaction) => {
    const expenseSnapshot = await transaction.get(expenseRef);
    const expense = expenseSnapshot.data();
    const updatedAt = serverTimestamp();

    if (expense?.walletId) {
      transaction.update(doc(db, "wallets", expense.walletId), {
        balance: increment(Number(expense.amount || 0)),
        updatedAt
      });
      transaction.delete(transactionRef);
    }

    transaction.delete(expenseRef);
  });
}
