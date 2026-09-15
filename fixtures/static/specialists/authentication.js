const repaired = document.body.dataset.mode === "repaired";
const digits = [...document.querySelectorAll(".digits input")];
const error = document.querySelector("#otp-error");
const status = document.querySelector("#auth-status");
let expired = false;
function clearError() {
  error.textContent = "";
  digits.forEach((input) => input.removeAttribute("aria-invalid"));
}
digits.forEach((input, index) => {
  input.addEventListener("paste", (event) => {
    event.preventDefault();
    const value = event.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(value)) return;
    clearError();
    if (repaired) {
      const start = value.length === 6 ? 0 : index;
      [...value.slice(0, 6 - start)].forEach((digit, offset) => {
        digits[start + offset].value = digit;
      });
      digits[Math.min(start + value.length - 1, 5)].focus();
    } else {
      input.value = value[0];
    }
  });
  input.addEventListener("input", () => {
    clearError();
    input.value = input.value.replace(/\D/g, "").slice(-1);
    if (input.value && index < 5) digits[index + 1].focus();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Backspace" && !input.value && index > 0)
      digits[index - 1].focus();
  });
});
document.querySelector("#otp-form").addEventListener("submit", (event) => {
  event.preventDefault();
  status.textContent = "";
  if (expired || digits.map((input) => input.value).join("") !== "012345") {
    error.textContent = expired
      ? "Code expired. Request a new code."
      : "Enter the complete six-digit test code.";
    digits.forEach((input) => input.setAttribute("aria-invalid", "true"));
  } else {
    clearError();
    status.textContent = "Signed in with the test code.";
  }
});
document.querySelector("#expire").addEventListener("click", () => {
  expired = true;
  status.textContent = "Test code expired.";
});
document.querySelector("#resend").addEventListener("click", () => {
  expired = false;
  clearError();
  digits.forEach((input) => {
    input.value = "";
  });
  status.textContent = "New test code sent: 012345.";
});
