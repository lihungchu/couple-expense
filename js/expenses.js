import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { db } from "./firebase.js";

const expensesRef = collection(db, "expenses");

export function subscribeExpenses(onChange, onError) {
  const expensesQuery = query(expensesRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    expensesQuery,
    (snapshot) => {
      const expenses = snapshot.docs.map((expenseDoc) => ({
        id: expenseDoc.id,
        ...expenseDoc.data()
      }));

      onChange(expenses);
    },
    onError
  );
}

export function createExpense(expense) {
  return addDoc(expensesRef, {
    date: expense.date,
    amount: Number(expense.amount),
    category: expense.category,
    payer: expense.payer,
    note: expense.note || "",
    createdAt: serverTimestamp()
  });
}

export function saveExpense(expenseId, expense) {
  return updateDoc(doc(db, "expenses", expenseId), {
    date: expense.date,
    amount: Number(expense.amount),
    category: expense.category,
    payer: expense.payer,
    note: expense.note || "",
    updatedAt: serverTimestamp()
  });
}

export function removeExpense(expenseId) {
  return deleteDoc(doc(db, "expenses", expenseId));
}
