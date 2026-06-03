import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBW1DS9-rvbpFBXaPdlf7obCGXc7Phm5kA",
  authDomain: "couple-expense-6ff5e.firebaseapp.com",
  projectId: "couple-expense-6ff5e",
  storageBucket: "couple-expense-6ff5e.firebasestorage.app",
  messagingSenderId: "556730491665",
  appId: "1:556730491665:web:d19b92ef9d0cef70a622b0",
  measurementId: "G-S1WEWHHW8L"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");
const appArea = document.getElementById("appArea");
const listArea = document.getElementById("listArea");
const addBtn = document.getElementById("addBtn");
const expenseList = document.getElementById("expenseList");

loginBtn.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    appArea.classList.remove("hidden");
    listArea.classList.remove("hidden");
    userInfo.textContent = `目前登入：${user.email}`;
    loadExpenses();
  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    appArea.classList.add("hidden");
    listArea.classList.add("hidden");
    userInfo.textContent = "";
  }
});

addBtn.addEventListener("click", async () => {
  const amount = Number(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const payer = document.getElementById("payer").value;
  const note = document.getElementById("note").value;

  if (!amount || amount <= 0) {
    alert("請輸入正確金額");
    return;
  }

  await addDoc(collection(db, "expenses"), {
    amount,
    category,
    payer,
    note,
    createdAt: new Date()
  });

  document.getElementById("amount").value = "";
  document.getElementById("note").value = "";

  loadExpenses();
});

async function loadExpenses() {
  const q = query(
    collection(db, "expenses"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  let html = "";

  snapshot.forEach((doc) => {
    const data = doc.data();

    html += `
      <div class="expense-item">
        <strong>${data.amount} 元</strong><br>
        類別：${data.category}<br>
        付款人：${data.payer}<br>
        備註：${data.note || "無"}
      </div>
    `;
  });

  expenseList.innerHTML = html || "目前沒有支出紀錄";
}