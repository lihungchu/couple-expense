import {
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { db } from "./firebase.js";

const budgetsRef = collection(db, "budgets");
const budgetDeductionsRef = collection(db, "budgetDeductions");
const walletTransactionsRef = collection(db, "walletTransactions");

export function subscribeBudgets(onChange, onError) {
  const budgetsQuery = query(budgetsRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    budgetsQuery,
    (snapshot) => {
      onChange(snapshot.docs.map((budgetDoc) => ({
        id: budgetDoc.id,
        ...budgetDoc.data()
      })));
    },
    onError
  );
}

export function subscribeBudgetDeductions(onChange, onError) {
  const deductionsQuery = query(budgetDeductionsRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    deductionsQuery,
    (snapshot) => {
      onChange(snapshot.docs.map((deductionDoc) => ({
        id: deductionDoc.id,
        ...deductionDoc.data()
      })));
    },
    onError
  );
}

export function createBudget(budget) {
  const budgetRef = doc(budgetsRef);
  const createdAt = serverTimestamp();

  return runTransaction(db, async (transaction) => {
    transaction.set(budgetRef, {
      name: budget.name,
      walletIds: budget.walletIds,
      amount: Number(budget.amount),
      startDate: budget.startDate,
      endDate: budget.endDate,
      archived: false,
      createdAt,
      updatedAt: createdAt
    });
  });
}

export function saveBudget(budgetId, budget) {
  return updateDoc(doc(db, "budgets", budgetId), {
    name: budget.name,
    walletIds: budget.walletIds,
    amount: Number(budget.amount),
    startDate: budget.startDate,
    endDate: budget.endDate,
    updatedAt: serverTimestamp()
  });
}

export function archiveBudget(budgetId) {
  return updateDoc(doc(db, "budgets", budgetId), {
    archived: true,
    updatedAt: serverTimestamp()
  });
}

export function createBudgetDeduction(entry) {
  const deductionRef = doc(budgetDeductionsRef);
  const amount = Number(entry.amount);

  return runTransaction(db, async (transaction) => {
    const createdAt = serverTimestamp();
    let walletTransactionId = "";

    if (entry.affectsWallet) {
      const walletTransactionRef = doc(walletTransactionsRef);
      walletTransactionId = walletTransactionRef.id;

      transaction.update(doc(db, "wallets", entry.walletId), {
        balance: increment(-amount),
        updatedAt: createdAt
      });

      transaction.set(walletTransactionRef, {
        type: "budgetDeduction",
        walletId: entry.walletId,
        toWalletId: "",
        amount,
        date: entry.date,
        note: entry.note || "預算扣款",
        expenseId: "",
        budgetId: entry.budgetId,
        createdAt
      });
    }

    transaction.set(deductionRef, {
      budgetId: entry.budgetId,
      walletId: entry.walletId,
      amount,
      date: entry.date,
      note: entry.note || "",
      affectsWallet: Boolean(entry.affectsWallet),
      walletTransactionId,
      createdAt
    });
  });
}

export function removeBudgetDeduction(deduction) {
  return runTransaction(db, async (transaction) => {
    const updatedAt = serverTimestamp();

    if (deduction.affectsWallet && deduction.walletId) {
      transaction.update(doc(db, "wallets", deduction.walletId), {
        balance: increment(Number(deduction.amount || 0)),
        updatedAt
      });
    }

    if (deduction.walletTransactionId) {
      transaction.delete(doc(db, "walletTransactions", deduction.walletTransactionId));
    }

    transaction.delete(doc(db, "budgetDeductions", deduction.id));
  });
}
