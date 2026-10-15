// CRATE NIGHT — app shell and hash router.
import {
  watchSession,
  isAdminUser,
  handleGoogleRedirect,
  signOutUser,
  authErrorMessage,
} from "./firebase.js";
import { h, toast } from "./js/ui.js";
import { renderAuth } from "./js/auth.js";
import { renderApply } from "./js/apply.js";
import { renderStatus } from "./js/status.js";
import { renderAdmin } from "./js/admin.js";

const view = document.getElementById("view");
const nav = document.getElementById("nav");
const adminLink = document.getElementById("admin-link");
const signOutButton = document.getElementById("sign-out");

const PUBLIC_PATHS = new Set(["/", "/login"]);
const PATHS = ["/", "/login", "/apply", "/status", "/admin"];

let user = null;
let admin = false;

function currentPath() {
  const path = (location.hash || "#/").slice(1);
  return PATHS.includes(path) ? path : "/";
}

function renderHome() {
  view.append(
    h("section", { class: "hero" },
      h("h1", {}, "CRATE NIGHT"),
      h("p", { class: "lede" }, "Guest list and table requests, handled in one place."),
      h("a", { class: "btn primary", href: "#/login" }, "Get on the list")),
  );
}

function render() {
  const path = currentPath();
  if (!user && !PUBLIC_PATHS.has(path)) {
    location.hash = "#/login";
    return;
  }
  if (user && (path === "/" || path === "/login")) {
    location.hash = "#/apply";
    return;
  }
  if (path === "/admin" && !admin) {
    toast("Admin review is restricted.");
    location.hash = "#/status";
    return;
  }
  view.replaceChildren();
  if (path === "/") renderHome();
  else if (path === "/login") renderAuth(view);
  else if (path === "/apply") renderApply(view, user);
  else if (path === "/status") renderStatus(view, user);
  else if (path === "/admin") renderAdmin(view, user, render);
  nav.hidden = !user;
  for (const link of nav.querySelectorAll("a")) {
    link.classList.toggle("active", link.getAttribute("href") === "#" + path);
  }
}

signOutButton.addEventListener("click", async () => {
  try {
    await signOutUser();
    location.hash = "#/";
    toast("Signed out.");
  } catch (error) {
    toast(authErrorMessage(error));
  }
});

window.addEventListener("hashchange", render);

watchSession(async (current) => {
  user = current;
  admin = await isAdminUser(current);
  adminLink.hidden = !admin;
  render();
});

// Surface the Google redirect result once per page load.
handleGoogleRedirect()
  .then((result) => {
    if (result) toast("Signed in with Google.");
  })
  .catch((error) => {
    toast(authErrorMessage(error));
    location.hash = "#/login";
  });

render();
