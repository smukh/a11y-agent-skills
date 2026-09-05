const form = document.querySelector("#checkout-form");
const email = document.querySelector("#email");
const summary = document.querySelector("#errors");
const error = document.querySelector("#email-error");
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const invalid = !email.validity.valid;
  email.setAttribute("aria-invalid", String(invalid));
  summary.hidden = !invalid;
  error.hidden = !invalid;
  if (invalid) summary.focus();
});

const invoker = document.querySelector("#open-dialog");
const dialog = document.querySelector("#terms-dialog");
invoker.addEventListener("click", () => dialog.showModal());
document
  .querySelector("#close-dialog")
  .addEventListener("click", () => dialog.close());
dialog.addEventListener("close", () => invoker.focus());

const items = [...document.querySelectorAll("#actions-menu [role=menuitem]")];
items.forEach((item, index) => {
  item.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const delta = event.key === "ArrowDown" ? 1 : -1;
    const next = items[(index + delta + items.length) % items.length];
    items.forEach((entry) => (entry.tabIndex = entry === next ? 0 : -1));
    next.focus();
  });
});
