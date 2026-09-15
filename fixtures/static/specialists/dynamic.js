const repaired = document.body.dataset.mode === "repaired";
const answer = document.querySelector("#answer");
const status = document.querySelector("#stream-status");
if (!repaired) answer.setAttribute("aria-live", "assertive");
let generation = 0;
function invalidate(message) {
  generation += 1;
  answer.setAttribute("aria-busy", "false");
  status.textContent = message;
}
document.querySelector("#generate").addEventListener("click", () => {
  const run = ++generation;
  answer.textContent = "";
  answer.setAttribute("aria-busy", "true");
  status.textContent = "Generating response.";
  const tokens = ["Your ", "report ", "is ", "ready."];
  tokens.forEach((token, index) =>
    setTimeout(
      () => {
        if (run !== generation) return;
        answer.textContent += token;
        if (index === tokens.length - 1) {
          answer.setAttribute("aria-busy", "false");
          status.textContent = "Response complete.";
        }
      },
      150 * (index + 1)
    )
  );
});
document
  .querySelector("#stop")
  .addEventListener("click", () => invalidate("Response stopped."));
document
  .querySelector("#fail")
  .addEventListener("click", () =>
    invalidate("Response failed. You can retry with Generate response.")
  );
