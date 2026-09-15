const repaired = document.body.dataset.mode === "repaired";
const datasets = {
  q1: [
    { name: "Apples", units: 10 },
    { name: "Pears", units: 20 }
  ],
  q2: [
    { name: "Apples", units: 30 },
    { name: "Pears", units: 0 }
  ],
  empty: []
};
const select = document.querySelector("#quarter");
function render(initial = false) {
  const data = datasets[select.value];
  const label = select.selectedOptions[0].textContent;
  document.querySelector("#chart-title").textContent = `Sales in ${label}`;
  document.querySelector("#chart-summary").textContent = data.length
    ? `${label} sales: ${data.map((row) => `${row.name} ${row.units} units`).join(", ")}.`
    : "No sales data available for this selection.";
  const bars = document.querySelector("#bars");
  bars.replaceChildren();
  for (const [index, row] of data.entries()) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.dataset.product = row.name;
    group.dataset.value = String(row.units);
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "100");
    rect.setAttribute("y", String(20 + index * 60));
    rect.setAttribute("height", "25");
    rect.setAttribute("width", String(row.units * 6));
    rect.setAttribute("fill", "#174ea6");
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "5");
    text.setAttribute("y", String(38 + index * 60));
    text.textContent = `${row.name}: ${row.units}`;
    group.append(rect, text);
    bars.append(group);
  }
  if (initial || repaired) {
    document.querySelector("#data-caption").textContent =
      `Sales in ${label}, units`;
    const body = document.querySelector("#sales-data");
    body.replaceChildren();
    for (const row of data) {
      const tr = document.createElement("tr");
      const name = document.createElement("th");
      name.scope = "row";
      name.textContent = row.name;
      const value = document.createElement("td");
      value.textContent = String(row.units);
      tr.append(name, value);
      body.append(tr);
    }
  }
  document.querySelector("#chart-status").textContent = initial
    ? ""
    : `${label} loaded. ${data.length} products.`;
}
select.addEventListener("change", () => render());
render(true);
