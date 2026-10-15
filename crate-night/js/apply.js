// Guest list & table application form.
import { db } from "../firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { h, toast } from "./ui.js";

const TABLE_TIERS = ["Booth", "High-top", "VIP lounge"];

export function renderApply(container, user) {
  const today = new Date().toISOString().slice(0, 10);
  const nameField = h("input", { type: "text", required: true, autocomplete: "name", placeholder: "Your name", value: user.displayName || "" });
  const phoneField = h("input", { type: "tel", autocomplete: "tel", placeholder: "Phone for door updates (optional)" });
  const night = h("input", { type: "date", min: today, required: true });
  const partySize = h("input", { type: "number", min: "1", max: "20", value: "2", required: true, inputmode: "numeric" });
  const tierSelect = h("select", {}, ...TABLE_TIERS.map((tier) => h("option", { value: tier }, tier)));
  const notes = h("textarea", { rows: "3", placeholder: "Anything the door should know (optional)" });

  const guestInput = h("input", { type: "radio", name: "service", value: "guest-list", checked: true });
  const tableInput = h("input", { type: "radio", name: "service", value: "table" });
  const tierField = h("label", { class: "field", hidden: true }, h("span", {}, "Table tier"), tierSelect);
  guestInput.addEventListener("change", () => { tierField.hidden = true; });
  tableInput.addEventListener("change", () => { tierField.hidden = false; });

  const submit = h("button", { class: "btn primary", type: "submit" }, "Send request");

  const form = h("form", { class: "stack" },
    h("label", { class: "field" }, h("span", {}, "Your name"), nameField),
    h("label", { class: "field" }, h("span", {}, "Phone for door updates (optional)"), phoneField),
    h("label", { class: "field" }, h("span", {}, "Night"), night),
    h("label", { class: "field" }, h("span", {}, "Party size"), partySize),
    h("div", { class: "service" },
      h("label", { class: "choice" }, guestInput, h("span", {}, "Guest list")),
      h("label", { class: "choice" }, tableInput, h("span", {}, "Table"))),
    tierField,
    h("label", { class: "field" }, h("span", {}, "Notes (optional)"), notes),
    submit);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const type = tableInput.checked ? "table" : "guest-list";
    const size = Number(partySize.value);
    const max = type === "table" ? 20 : 10;
    if (!night.value) {
      toast("Pick a night.");
      return;
    }
    if (!Number.isInteger(size) || size < 1 || size > max) {
      toast(type === "table" ? "Tables host 1 to 20 guests." : "The guest list covers 1 to 10 guests.");
      return;
    }
    submit.disabled = true;
    try {
      await addDoc(collection(db, "applications"), {
        uid: user.uid,
        name: (user.displayName || nameField.value || "").trim(),
        email: user.email || null,
        phone: phoneField.value.trim() || null,
        type,
        partySize: size,
        night: night.value,
        tableTier: type === "table" ? tierSelect.value : null,
        notes: notes.value.trim() || null,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast("Request sent — track it under My status.");
      form.reset();
      location.hash = "#/status";
    } catch (error) {
      toast(error.message || "Could not send the request.");
    } finally {
      submit.disabled = false;
    }
  });

  container.append(
    h("section", { class: "card" },
      h("h2", {}, "Guest list & tables"),
      h("p", { class: "muted" }, "Pick your night. The door reviews every request."),
      form),
  );
}
