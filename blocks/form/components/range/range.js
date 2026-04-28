const LOAN_STEPS = [50000, 200000, 400000, 600000, 800000, 1000000, 1500000];
const TENURE_STEPS = [12, 24, 36, 48, 60, 72, 84];

function formatINR(value) {
  return "₹" + Number(value).toLocaleString("en-IN");
}

function formatMonths(value) {
  return Math.round(value) + " months";
}

export default function decorate(fieldDiv) {
  const input = fieldDiv.querySelector("input");
  if (!input) return fieldDiv;

  const originalName = input.getAttribute("name");

  const isLoan = fieldDiv.classList.contains("field-loanamount");
  const steps = isLoan ? LOAN_STEPS : TENURE_STEPS;

  /* ===== SLIDER ===== */
  input.type = "range";
  input.min = 0;
  input.max = steps.length - 1;
  input.step = 1; // ✅ IMPORTANT FIX
  input.value = steps.length - 1;

  /* ===== HIDDEN INPUT (AEM FIX) ===== */
  const hidden = document.createElement("input");
  hidden.type = "hidden";
  hidden.name = originalName;

  input.removeAttribute("name");

  /* ===== WRAPPER ===== */
  const wrapper = document.createElement("div");
  wrapper.className = "range-widget-wrapper decorated";
  input.after(wrapper);

  const bubble = document.createElement("span");
  bubble.className = "range-bubble";

  wrapper.appendChild(bubble);
  wrapper.appendChild(input);
  wrapper.appendChild(hidden);

  /* ===== LABELS ===== */
  steps.forEach((val, i) => {
    const tick = document.createElement("span");
    tick.className = "custom-range-tick";

    const label = document.createElement("span");

    label.innerText = isLoan
      ? (val === 50000 ? "50K" : val / 100000 + "L")
      : val + "m";

    tick.appendChild(label);
    tick.style.left = `${(i / (steps.length - 1)) * 100}%`;

    label.addEventListener("click", () => {
      input.value = i;
      update();
    });

    wrapper.appendChild(tick);
  });

  /* ===== UPDATE ===== */
  function update() {
    const index = Number(input.value);
    const actual = steps[index];

    const percent = (index / (steps.length - 1)) * 100;

    wrapper.style.setProperty("--progress", percent + "%");

    bubble.innerText = isLoan
      ? formatINR(actual)
      : formatMonths(actual);

    // ✅ CRITICAL (AEM sync)
    hidden.value = actual;

    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  input.addEventListener("input", update);

  /* ===== INIT ===== */
  update();

  return fieldDiv;
}