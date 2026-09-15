const repaired = document.body.dataset.mode === "repaired";
const input = document.querySelector("#city");
const list = document.querySelector("#cities");
const status = document.querySelector("#city-status");
let requestId = 0;
let active = -1;
function clearActive() {
  active = -1;
  input.removeAttribute("aria-activedescendant");
}
function close() {
  requestId += 1;
  list.hidden = true;
  input.setAttribute("aria-expanded", "false");
  clearActive();
}
function choose(option) {
  input.value = option.textContent;
  document.querySelector("#selection").textContent = option.textContent;
  close();
  input.focus();
}
input.addEventListener("input", async () => {
  const id = ++requestId;
  const query = input.value.trim().toLowerCase();
  clearActive();
  list.replaceChildren();
  list.hidden = true;
  input.setAttribute("aria-expanded", "false");
  if (!query) {
    status.textContent = "";
    return;
  }
  status.textContent = "Loading suggestions.";
  try {
    const response = await fetch(
      `suggestions.json?q=${encodeURIComponent(query)}`
    );
    if (!response.ok) throw new Error("Suggestion request failed");
    const data = await response.json();
    if (repaired && id !== requestId) return;
    const matches = data.filter((city) => city.toLowerCase().startsWith(query));
    list.replaceChildren();
    if (repaired) clearActive();
    matches.forEach((city, index) => {
      const option = document.createElement("li");
      option.id = `city-${id}-${index}`;
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", "false");
      option.textContent = city;
      option.addEventListener("mousedown", (event) => event.preventDefault());
      option.addEventListener("click", () => choose(option));
      list.append(option);
    });
    list.hidden = matches.length === 0;
    input.setAttribute("aria-expanded", String(matches.length > 0));
    status.textContent = matches.length
      ? `${matches.length} suggestions available.`
      : "No cities found.";
  } catch {
    if (id !== requestId) return;
    close();
    status.textContent = "Suggestions unavailable. Edit the query to retry.";
  }
});
input.addEventListener("keydown", (event) => {
  if (event.isComposing) return;
  const options = [...list.children];
  if (
    (event.key === "ArrowDown" || event.key === "ArrowUp") &&
    options.length
  ) {
    event.preventDefault();
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    active =
      event.key === "ArrowDown"
        ? Math.min(active + 1, options.length - 1)
        : Math.max(active - 1, 0);
    options.forEach((option, index) =>
      option.setAttribute("aria-selected", String(index === active))
    );
    input.setAttribute("aria-activedescendant", options[active].id);
    options[active].scrollIntoView({ block: "nearest" });
  } else if (event.key === "Enter" && !list.hidden && options[active]) {
    event.preventDefault();
    choose(options[active]);
  } else if (event.key === "Escape" || event.key === "Tab") close();
});
input.addEventListener("blur", close);
