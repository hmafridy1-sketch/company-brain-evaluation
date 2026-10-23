// Admin review: pending queue plus reviewed history.
// Security is enforced by firestore.rules; this view is a convenience gate.
import { db, isAdminUser } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { h, toast, summaryLine } from "./ui.js";

export async function renderAdmin(container, user, rerender) {
  if (!(await isAdminUser(user))) {
    container.append(h("p", { class: "muted" }, "Admin review is restricted."));
    return;
  }

  container.append(h("h2", {}, "Admin review"));
  const pendingList = h("div", { class: "stack" });
  const reviewedList = h("div", { class: "stack" });
  container.append(h("h3", {}, "Pending"), pendingList, h("h3", {}, "Reviewed"), reviewedList);

  let snapshot;
  try {
    snapshot = await getDocs(collection(db, "applications"));
  } catch (error) {
    pendingList.append(h("p", { class: "muted" }, error.message || "Could not load applications."));
    return;
  }

  const items = snapshot.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  const pending = items.filter((item) => item.status === "pending");
  const reviewed = items.filter((item) => item.status !== "pending");

  if (pending.length === 0) pendingList.append(h("p", { class: "muted" }, "Nothing pending."));
  for (const item of pending) pendingList.append(pendingCard(item, user, rerender));
  if (reviewed.length === 0) reviewedList.append(h("p", { class: "muted" }, "No reviewed applications yet."));
  for (const item of reviewed) reviewedList.append(reviewedCard(item));
}

function pendingCard(item, user, rerender) {
  const note = h("input", { type: "text", placeholder: "Optional note back to the guest" });
  const contact = [item.email, item.phone].filter(Boolean).join(" · ");

  async function decide(status) {
    try {
      await updateDoc(doc(db, "applications", item.id), {
        status,
        reviewNote: note.value.trim() || null,
        reviewedAt: serverTimestamp(),
        reviewedBy: user.email || "admin",
      });
      toast(status === "approved" ? "Approved." : "Declined.");
      rerender();
    } catch (error) {
      toast(error.message || "Could not save the decision.");
    }
  }

  return h("article", { class: "card" },
    h("header", { class: "row" },
      h("strong", {}, (item.name || "Guest") + " · " + (item.type === "table" ? "Table" : "Guest list")),
      h("span", { class: "badge pending" }, "pending")),
    h("p", { class: "muted" }, summaryLine(item)),
    contact ? h("p", { class: "muted" }, contact) : null,
    note,
    h("div", { class: "row" },
      h("button", { class: "btn primary", type: "button", onclick: () => decide("approved") }, "Approve"),
      h("button", { class: "btn danger", type: "button", onclick: () => decide("declined") }, "Decline")));
}

function reviewedCard(item) {
  const when = item.reviewedAt?.seconds
    ? new Date(item.reviewedAt.seconds * 1000).toLocaleDateString()
    : "";
  return h("article", { class: "card" },
    h("header", { class: "row" },
      h("strong", {}, (item.name || "Guest") + " · " + (item.type === "table" ? "Table" : "Guest list")),
      h("span", { class: "badge " + item.status }, item.status)),
    h("p", { class: "muted" }, summaryLine(item)),
    item.reviewNote ? h("p", {}, "Note: " + item.reviewNote) : null,
    item.reviewedBy || when
      ? h("p", { class: "muted" }, [item.reviewedBy, when].filter(Boolean).join(" · "))
      : null);
}
