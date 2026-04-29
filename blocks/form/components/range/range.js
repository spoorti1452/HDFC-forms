const LOAN_STEPS = [50000, 200000, 400000, 600000, 800000, 1000000, 1500000];
const TENURE_STEPS = [12, 24, 36, 48, 60, 72, 84];

function isLoan(fieldDiv) {
  return fieldDiv.classList.contains("field-loanamount");
}

function format(val, loan) {
  return loan
    ? "₹" + Number(val).toLocaleString("en-IN")
    : val + " months";
}

export default function decorate(fieldDiv) {
  const input = fieldDiv.querySelector("input");
  if (!input) return fieldDiv;

  const originalName = input.name;
  const loan = isLoan(fieldDiv);
  const steps = loan ? LOAN_STEPS : TENURE_STEPS;

  /* ===== OVERRIDE VALUE (KEY FIX) ===== */
  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  );

  Object.defineProperty(input, "value", {
    get() {
      return this._actualValue ?? descriptor.get.call(this);
    },
    set(val) {
      const num = Number(val);

      // if actual value passed → convert to index
      const index = steps.findIndex(v => v === num);

      if (index !== -1) {
        descriptor.set.call(this, index);
      } else {
        descriptor.set.call(this, val);
      }
    }
  });

  /* ===== HIDDEN INPUT ===== */
  const hidden = document.createElement("input");
  hidden.type = "hidden";
  hidden.name = originalName;

  input.removeAttribute("name");

  /* ===== SLIDER ===== */
  input.type = "range";
  input.min = 0;
  input.max = steps.length - 1;
  input.step = 1; // ✅ IMPORTANT
  input.value = steps.length - 1;

  /* ===== UI ===== */
  const wrapper = document.createElement("div");
  wrapper.className = "range-widget-wrapper decorated";

  const bubble = document.createElement("span");
  bubble.className = "range-bubble";

  input.after(wrapper);
  wrapper.appendChild(bubble);
  wrapper.appendChild(input);
  wrapper.appendChild(hidden);

  /* ===== TICKS ===== */
  steps.forEach((val, i) => {
    const tick = document.createElement("span");
    tick.className = "custom-range-tick";

    const label = document.createElement("span");
    label.innerText = loan
      ? (val === 50000 ? "50K" : val / 100000 + "L")
      : val + "m";

    tick.style.left = `${(i / (steps.length - 1)) * 100}%`;
    tick.appendChild(label);

    label.onclick = () => {
      input.value = i;
      update();
    };

    wrapper.appendChild(tick);
  });

  /* ===== UPDATE ===== */
  function update() {
    const index = Number(descriptor.get.call(input));
    const actual = steps[index];

    const percent = (index / (steps.length - 1)) * 100;

    bubble.innerText = format(actual, loan);
    bubble.style.left = `calc(${percent}% - 15px)`;

    // 🔥 CRITICAL
    input._actualValue = actual;
    hidden.value = actual;

    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  input.addEventListener("input", update);

  /* ===== INIT ===== */
  update();

  return fieldDiv;
}