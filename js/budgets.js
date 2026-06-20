import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { db } from "./firebase.js";

const budgetsRef = collection(db, "budgets");

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
