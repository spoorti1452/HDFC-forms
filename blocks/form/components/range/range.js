/* ===== STEP CONFIG ===== */
const LOAN_STEPS = [50000, 200000, 400000, 600000, 800000, 1000000, 1500000];
const TENURE_STEPS = [12, 24, 36, 48, 60, 72, 84];

function isLoanField(fieldDiv) {
  return fieldDiv.classList.contains('field-loanamount');
}

function formatValue(value, isLoan) {
  return isLoan
    ? "₹" + Number(value).toLocaleString("en-IN")
    : value + " months";
}

/* ===== ADD TICKS ===== */
function addTicks(wrapper, slider, fieldDiv) {
  const isLoan = isLoanField(fieldDiv);
  const steps = isLoan ? LOAN_STEPS : TENURE_STEPS;

  steps.forEach((val, i) => {
    const tick = document.createElement('span');
    tick.className = 'custom-range-tick';

    const label = document.createElement('span');

    label.innerText = isLoan
      ? (val === 50000 ? '50K' : val / 100000 + 'L')
      : val + 'm';

    tick.appendChild(label);
    tick.style.left = `${(i / (steps.length - 1)) * 100}%`;

    label.addEventListener('click', (e) => {
      e.stopPropagation();
      slider.value = i;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });

    wrapper.appendChild(tick);
  });
}

/* ===== CORE UPDATE ===== */
function updateBubble(slider, wrapper, fieldDiv) {
  const index = parseInt(slider.value, 10); // ✅ FIXED (no decimals)

  const isLoan = isLoanField(fieldDiv);
  const steps = isLoan ? LOAN_STEPS : TENURE_STEPS;

  const actual = steps[index]; // ✅ DIRECT mapping (no interpolation)

  const bubble = wrapper.querySelector('.range-bubble');
  bubble.innerText = formatValue(actual, isLoan);

  const percent = (index / (steps.length - 1)) * 100;
  bubble.style.left = `calc(${percent}% - 15px)`;

  const field = fieldDiv._field;

  if (field && field.value !== actual) {
    field.value = actual;

    // 🔥 CRITICAL: triggers AEM Rule Editor
    field.dispatchEvent(new Event('valueCommit', { bubbles: true }));
  }
}

/* ===== MAIN ===== */
export default async function decorate(fieldDiv) {
  const originalInput = fieldDiv.querySelector('input');
  if (!originalInput) return fieldDiv;

  const isLoan = isLoanField(fieldDiv);
  const steps = isLoan ? LOAN_STEPS : TENURE_STEPS;

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = 0;
  slider.max = steps.length - 1;
  slider.step = 1; // ✅ FIXED (integer only)
  slider.value = steps.length - 1;

  // hide original field
  originalInput.style.display = 'none';

  const wrapper = document.createElement('div');
  wrapper.className = 'range-widget-wrapper decorated';

  originalInput.after(wrapper);

  const bubble = document.createElement('span');
  bubble.className = 'range-bubble';

  wrapper.appendChild(bubble);
  wrapper.appendChild(slider);

  addTicks(wrapper, slider, fieldDiv);

  slider.addEventListener('input', () => {
    updateBubble(slider, wrapper, fieldDiv);
  });

  // initial trigger
  setTimeout(() => {
    updateBubble(slider, wrapper, fieldDiv);
  }, 0);

  return fieldDiv;
}