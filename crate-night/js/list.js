// Door list: filter and sort all applications by table assignment.
// Security is enforced by firestore.rules; this view is a convenience gate.
import { db, isAdminUser } from "../firebase.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { h, summaryLine } from "./ui.js";

const FILTERS = ["All", "Guest list", "Booth", "High-top", "VIP lounge"];
const TIER_ORDER = { "Booth": 0, "High-top": 1, "VIP lounge": 2 };
const SORTS = [
  ["night", "By night"],
  ["tier", "By table tier"],
  ["name", "By name"],
  ["party", "By party size"],
];

export async function renderList(container, user, rerender) {
  if (!(await isAdminUser(user))) {
    container.append(h("p", { class: "muted" }, "The door list is restricted."));
    return;
  }

  container.append(h("h2", {}, "Door list"));
  let snapshot;
  try {
    snapshot = await getDocs(collection(db, "applications"));
  } catch (error) {
    container.append(h("p", { class: "muted" }, error.message || "Could not load applications."));
    return;
  }

  const items = snapshot.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const count = h("p", { class: "muted" }, "");
  const list = h("div", { class: "stack" });
  const filterSelect = h("select", {},
    ...FILTERS.map((label) => h("option", { value: label }, label)));
  const sortSelect = h("select", {},
    ...SORTS.map(([value, label]) => h("option", { value }, label)));

  function matches(item) {
    const filter = filterSelect.value;
    if (filter === "All") return true;
    if (filter === "Guest list") return item.type === "guest-list";
    return item.tableTier === filter;
  }

  function compare(a, b) {
    switch (sortSelect.value) {
      case "tier": {
        const ta = a.tableTier in TIER_ORDER ? TIER_ORDER[a.tableTier] : 3;
        const tb = b.tableTier in TIER_ORDER ? TIER_ORDER[b.tableTier] : 3;
        return ta - tb || (a.night || "").localeCompare(b.night || "");
      }
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      case "party":
        return (b.partySize || 0) - (a.partySize || 0);
      default:
        return (a.night || "").localeCompare(b.night || "")
          || (a.name || "").localeCompare(b.name || "");
    }
  }

  function refresh() {
    const shown = items.filter(matches).sort(compare);
    list.replaceChildren(...shown.map(listCard));
    count.textContent = shown.length + " of " + items.length + " requests";
  }

  filterSelect.addEventListener("change", refresh);
  sortSelect.addEventListener("change", refresh);

  container.append(
    h("div", { class: "controls" },
      h("label", { class: "field" }, h("span", {}, "Filter"), filterSelect),
      h("label", { class: "field" }, h("span", {}, "Sort"), sortSelect)),
    count,
    list,
  );
  refresh();
}

function listCard(item) {
  const contact = [item.email, item.phone].filter(Boolean).join(" · ");
  return h("article", { class: "card" },
    h("header", { class: "row" },
      h("strong", {}, (item.name || "Guest") + " · " + (item.type === "table" ? "Table — " + (item.tableTier || "table") : "Guest list")),
      h("span", { class: "badge " + item.status }, item.status)),
    h("p", { class: "muted" }, summaryLine(item)),
    contact ? h("p", { class: "muted" }, contact) : null);
}
