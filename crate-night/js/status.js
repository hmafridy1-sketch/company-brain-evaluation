// My status: the signed-in guest's own applications.
import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { h, summaryLine } from "./ui.js";

export async function renderStatus(container, user) {
  container.append(h("h2", {}, "My status"));
  const list = h("div", { class: "stack" });
  container.append(list);

  let snapshot;
  try {
    snapshot = await getDocs(query(collection(db, "applications"), where("uid", "==", user.uid)));
  } catch (error) {
    list.append(h("p", { class: "muted" }, error.message || "Could not load your requests."));
    return;
  }

  const items = snapshot.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  if (items.length === 0) {
    list.append(h("p", { class: "muted" }, "No requests yet — apply for the guest list or a table."));
    return;
  }

  for (const item of items) {
    list.append(h("article", { class: "card" },
      h("header", { class: "row" },
        h("strong", {}, item.type === "table" ? "Table — " + (item.tableTier || "table") : "Guest list"),
        h("span", { class: "badge " + item.status }, item.status)),
      h("p", { class: "muted" }, summaryLine(item)),
      item.reviewNote ? h("p", {}, "Note from the door: " + item.reviewNote) : null));
  }
}
