/* ===== STEP CONFIG ===== */
const LOAN_STEPS = [50000, 200000, 400000, 600000, 800000, 1000000, 1500000];
const TENURE_STEPS = [12, 24, 36, 48, 60, 72, 84];

/* ===== DEBOUNCE ===== */
function debounce(fn, delay = 400) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ===== HELPERS ===== */
function isLoanField(fieldDiv) {
  return fieldDiv.classList.contains('field-loanamount');
}

function formatValue(value, isLoan) {
  return isLoan
    ? "₹" + Number(value).toLocaleString("en-IN")
    : Math.round(value) + " months";
}

/* ===== MAIN ===== */
export default function decorate(fieldDiv) {
  const input = fieldDiv.querySelector("input");
  if (!input) return fieldDiv;

  const originalName = input.getAttribute("name");

  const isLoan = isLoanField(fieldDiv);
  const steps = isLoan ? LOAN_STEPS : TENURE_STEPS;

  /* ===== CREATE SLIDER ===== */
  input.type = "range";
  input.min = 0;
  input.max = steps.length - 1;
  input.step = 1; // ✅ IMPORTANT (no decimals)
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

  /* ===== TICKS ===== */
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
      update(); // immediate UI update
      triggerAPI(); // debounced API call
    });

    wrapper.appendChild(tick);
  });

  /* ===== UPDATE UI + VALUE ===== */
  function update() {
    const index = Number(input.value);
    const actual = steps[index];

    const percent = (index / (steps.length - 1)) * 100;

    wrapper.style.setProperty("--progress", percent + "%");

    bubble.innerText = formatValue(actual, isLoan);

    // ✅ AEM value fix
    hidden.value = actual;
    input.value = actual; // 🔥 CRITICAL
  }

  /* ===== API TRIGGER (DEBOUNCED) ===== */
  const triggerAPI = debounce(() => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, 400);

  /* ===== EVENTS ===== */
  input.addEventListener("input", () => {
    update();
    triggerAPI(); // debounced call
  });

  /* ===== INIT ===== */
  update();

  return fieldDiv;
}