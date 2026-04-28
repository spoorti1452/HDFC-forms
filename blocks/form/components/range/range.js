/* ===== STEP CONFIG ===== */
const LOAN_STEPS = [50000, 200000, 400000, 600000, 800000, 1000000, 1500000];
const TENURE_STEPS = [12, 24, 36, 48, 60, 72, 84];

function isLoanField(fieldDiv) {
  return fieldDiv.classList.contains('field-loanamount');
}

function formatValue(value, isLoan) {
  return isLoan
    ? "₹" + Number(value).toLocaleString("en-IN")
    : Math.round(value) + " months";
}

function getActualValue(index, steps) {
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return steps[lower];

  return steps[lower] + (steps[upper] - steps[lower]) * (index - lower);
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
  const indexValue = Number(slider.value) || 0;

  const isLoan = isLoanField(fieldDiv);
  const stepsArr = isLoan ? LOAN_STEPS : TENURE_STEPS;

  const actual = getActualValue(indexValue, stepsArr);

  const bubble = wrapper.querySelector('.range-bubble');

  bubble.innerText = formatValue(actual, isLoan);

  const percent = (indexValue / (stepsArr.length - 1)) * 100;
  bubble.style.left = `calc(${percent}% - 15px)`;

  wrapper.style.setProperty('--current-steps', indexValue);
  wrapper.style.setProperty('--total-steps', stepsArr.length - 1);

  /* ===== 🔥 REAL FIX: USE AEM FIELD ===== */
  const field = fieldDiv._field;

  if (field) {
    const finalValue = isLoan
      ? Math.round(actual / 1000) * 1000
      : Math.round(actual);

    if (field.value !== finalValue) {
      field.value = finalValue;

      // IMPORTANT: triggers rule engine
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}

/* ===== MAIN ===== */
export default async function decorate(fieldDiv) {

  const originalInput = fieldDiv.querySelector('input');
  if (!originalInput) return fieldDiv;

  const isLoan = isLoanField(fieldDiv);
  const steps = isLoan ? LOAN_STEPS : TENURE_STEPS;

  /* ===== CREATE SLIDER ===== */
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = 0;
  slider.max = steps.length - 1;
  slider.step = 0.01;
  slider.value = steps.length - 1;

  /* ===== HIDE ORIGINAL INPUT ===== */
  originalInput.style.display = 'none';

  /* ===== WRAPPER ===== */
  const wrapper = document.createElement('div');
  wrapper.className = 'range-widget-wrapper decorated';

  originalInput.after(wrapper);

  const bubble = document.createElement('span');
  bubble.className = 'range-bubble';

  const minEl = document.createElement('span');
  const maxEl = document.createElement('span');

  minEl.className = 'range-min';
  maxEl.className = 'range-max';

  wrapper.appendChild(bubble);
  wrapper.appendChild(slider);
  wrapper.appendChild(minEl);
  wrapper.appendChild(maxEl);

  addTicks(wrapper, slider, fieldDiv);

  slider.addEventListener('input', () => {
    updateBubble(slider, wrapper, fieldDiv);
  });

  updateBubble(slider, wrapper, fieldDiv);

  return fieldDiv;
}