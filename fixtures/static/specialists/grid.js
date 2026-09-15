const repaired = document.body.dataset.mode === "repaired";
const rows = [
  { id: "apples", name: "Apples", quantity: 2 },
  { id: "pears", name: "Pears", quantity: 3 }
];
const body = document.querySelector("#inventory");
let activeId = "apples";
let column = 1;
function cells() {
  return [...body.querySelectorAll("td")];
}
function activate(cell) {
  cells().forEach((item) => {
    item.tabIndex = item === cell ? 0 : -1;
  });
  activeId = cell.parentElement.dataset.record;
  column = Number(cell.dataset.column);
  cell.focus();
}
function render(restore = false) {
  body.replaceChildren();
  for (const row of rows) {
    const tr = document.createElement("tr");
    tr.dataset.record = row.id;
    [row.name, String(row.quantity)].forEach((value, col) => {
      const td = document.createElement("td");
      td.dataset.column = String(col);
      td.textContent = value;
      td.tabIndex = row.id === activeId && col === column ? 0 : -1;
      td.addEventListener("focus", () => {
        activeId = row.id;
        column = col;
        cells().forEach((item) => {
          item.tabIndex = item === td ? 0 : -1;
        });
      });
      td.addEventListener("keydown", (event) => {
        if (event.target !== td) return;
        const index = rows.findIndex((item) => item.id === row.id);
        let nextRow = index;
        let nextCol = col;
        if (event.key === "ArrowDown")
          nextRow = Math.min(index + 1, rows.length - 1);
        else if (event.key === "ArrowUp") nextRow = Math.max(index - 1, 0);
        else if (event.key === "ArrowRight") nextCol = 1;
        else if (event.key === "ArrowLeft") nextCol = 0;
        else if (event.key === "Home") nextCol = 0;
        else if (event.key === "End") nextCol = 1;
        else if (event.key === "Enter" && col === 1) {
          event.preventDefault();
          edit(td, row);
          return;
        } else return;
        event.preventDefault();
        activate(
          body.querySelector(
            `[data-record="${rows[nextRow].id}"] [data-column="${nextCol}"]`
          )
        );
      });
      tr.append(td);
    });
    body.append(tr);
  }
  if (restore)
    activate(
      body.querySelector(
        `[data-record="${activeId}"] [data-column="${column}"]`
      )
    );
}
function edit(cell, row) {
  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.value = String(row.quantity);
  input.setAttribute("aria-label", `${row.name} quantity`);
  cell.replaceChildren(input);
  input.focus();
  input.select();
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      render(true);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (!input.value || !input.checkValidity()) {
        document.querySelector("#grid-status").textContent =
          "Enter a non-negative whole quantity.";
        return;
      }
      const oldIndex = rows.findIndex((item) => item.id === row.id);
      row.quantity = Number(input.value);
      rows.sort((a, b) => a.quantity - b.quantity);
      activeId = repaired ? row.id : rows[oldIndex].id;
      render(true);
      document.querySelector("#grid-status").textContent =
        `${row.name} quantity saved. Rows sorted by quantity.`;
    }
  });
}
render();
