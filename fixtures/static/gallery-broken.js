const form = document.querySelector("#checkout-form");
form.addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector("#errors").hidden = false;
});

const dialog = document.querySelector("#terms-dialog");
document.querySelector("#open-dialog").addEventListener("click", () => {
  dialog.hidden = false;
  document.querySelector("#close-dialog").focus();
});
document.querySelector("#close-dialog").addEventListener("click", () => {
  dialog.hidden = true;
});
