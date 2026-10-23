// Sign-in view: email/password, Google (redirect), and phone (SMS + reCAPTCHA).
// User-to-user messaging is deliberately absent (CRATE-NIGHT-AGENT.md).
import {
  signUpEmail,
  signInEmail,
  signInGoogle,
  sendPhoneCode,
  confirmPhoneCode,
  authErrorMessage,
} from "../firebase.js";
import { h, toast } from "./ui.js";

export function renderAuth(container) {
  const emailPanel = buildEmailPanel();
  const googlePanel = buildGooglePanel();
  const phonePanel = buildPhonePanel();
  const panels = { email: emailPanel, google: googlePanel, phone: phonePanel };

  const tabs = h("div", { class: "tabs" },
    tabButton("Email", "email"),
    tabButton("Google", "google"),
    tabButton("Phone", "phone"));

  function tabButton(label, name) {
    return h("button", {
      class: "tab",
      type: "button",
      onclick: () => {
        for (const tab of tabs.querySelectorAll(".tab")) {
          tab.classList.toggle("active", tab.dataset.tab === name);
        }
        for (const [key, panel] of Object.entries(panels)) {
          panel.hidden = key !== name;
        }
      },
    }, label);
  }

  container.append(
    h("section", { class: "card auth" },
      h("h2", {}, "Sign in"),
      h("p", { class: "muted" }, "Email, Google, or phone — pick a door."),
      tabs,
      emailPanel,
      googlePanel,
      phonePanel),
  );
  tabs.querySelector(".tab").classList.add("active");
}

function buildEmailPanel() {
  let mode = "signin";
  const title = h("h3", {}, "Sign in with email");
  const email = h("input", { type: "email", autocomplete: "email", placeholder: "you@example.com", required: true });
  const password = h("input", { type: "password", autocomplete: "current-password", placeholder: "Password", required: true });
  const submit = h("button", { class: "btn primary", type: "submit" }, "Sign in");
  const toggle = h("button", { class: "link", type: "button" }, "New here? Create an account");

  toggle.addEventListener("click", () => {
    mode = mode === "signin" ? "signup" : "signin";
    title.textContent = mode === "signin" ? "Sign in with email" : "Create account";
    submit.textContent = mode === "signin" ? "Sign in" : "Create account";
    password.setAttribute("autocomplete", mode === "signin" ? "current-password" : "new-password");
    toggle.textContent = mode === "signin" ? "New here? Create an account" : "Have an account? Sign in";
  });

  const form = h("form", { class: "stack" }, title, email, password, submit, toggle);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    try {
      if (mode === "signin") await signInEmail(email.value.trim(), password.value);
      else await signUpEmail(email.value.trim(), password.value);
      toast("Welcome to CRATE NIGHT.");
      location.hash = "#/apply";
    } catch (error) {
      toast(authErrorMessage(error));
    } finally {
      submit.disabled = false;
    }
  });

  return h("div", { class: "auth-panel" }, form);
}

function buildGooglePanel() {
  const button = h("button", {
    class: "btn",
    type: "button",
    onclick: () => {
      button.disabled = true;
      signInGoogle().catch((error) => {
        toast(authErrorMessage(error));
        button.disabled = false;
      });
    },
  }, "Continue with Google");
  return h("div", { class: "auth-panel", hidden: true },
    h("p", { class: "muted" }, "Redirects to Google and back — the mobile-friendly flow."),
    button);
}

function buildPhonePanel() {
  const phone = h("input", { type: "tel", autocomplete: "tel", placeholder: "+1 555 123 4567" });
  const send = h("button", { class: "btn primary", type: "button" }, "Send code");
  const recaptchaHolder = h("div", { id: "recaptcha-container" });
  const code = h("input", { type: "text", inputmode: "numeric", autocomplete: "one-time-code", placeholder: "6-digit code", maxlength: "8" });
  const verify = h("button", { class: "btn primary", type: "button" }, "Verify code");
  const codeStep = h("div", { class: "stack", hidden: true }, code, verify);
  let confirmation = null;

  send.addEventListener("click", async () => {
    const number = phone.value.trim();
    if (!number.startsWith("+")) {
      toast("Include the country code, e.g. +15551234567.");
      return;
    }
    send.disabled = true;
    try {
      confirmation = await sendPhoneCode(number, "recaptcha-container");
      codeStep.hidden = false;
      send.textContent = "Code sent";
      toast("SMS code sent.");
    } catch (error) {
      toast(authErrorMessage(error));
      send.textContent = "Send code";
    } finally {
      send.disabled = false;
    }
  });

  verify.addEventListener("click", async () => {
    if (!confirmation) return;
    verify.disabled = true;
    try {
      await confirmPhoneCode(confirmation, code.value.trim());
      toast("Welcome to CRATE NIGHT.");
      location.hash = "#/apply";
    } catch (error) {
      toast(authErrorMessage(error));
    } finally {
      verify.disabled = false;
    }
  });

  return h("div", { class: "auth-panel", hidden: true },
    h("div", { class: "stack" }, phone, send, recaptchaHolder, codeStep));
}
