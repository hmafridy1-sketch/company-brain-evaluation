// Small shared UI helpers: DOM builder, toast, and summary formatting.
export function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2), value);
    } else if (value !== undefined && value !== null && value !== false) {
      node.setAttribute(key, value === true ? "" : value);
    }
  }
  for (const child of children.flat()) {
    if (child === undefined || child === null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    el.classList.remove("show");
    el.textContent = "";
  }, 3200);
}

export function summaryLine(item) {
  const parts = [
    "Night " + (item.night || "unknown"),
    "party of " + (item.partySize || "?"),
  ];
  if (item.tableTier) parts.push(item.tableTier);
  if (item.notes) parts.push(item.notes);
  return parts.join(" · ");
}
