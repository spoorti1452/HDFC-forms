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
function addTicks(wrapper, input, fieldDiv) {
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
      input.value = i;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
 
    wrapper.appendChild(tick);
  });
}
 
/* ===== CORE UPDATE ===== */
function updateBubble(input, element, fieldDiv) {
  const value = Number(input.value) || 0;
 
  const isLoan = isLoanField(fieldDiv);
  const stepsArr = isLoan ? LOAN_STEPS : TENURE_STEPS;
 
  const actual = getActualValue(value, stepsArr);
 
  const bubble = element.querySelector('.range-bubble');
 
  /* ===== FORMAT UI ===== */
  bubble.innerText = formatValue(actual, isLoan);
 
  /* ===== POSITION ===== */
  const percent = (value / (stepsArr.length - 1)) * 100;
  bubble.style.left = `calc(${percent}% - 15px)`;
 
  element.style.setProperty('--current-steps', value);
  element.style.setProperty('--total-steps', stepsArr.length - 1);
 
  /* ===== 🔥 AEM SYNC (FINAL FIX) ===== */
  const field = fieldDiv?._field;
 
  if (field) {
    const finalValue = isLoan
      ? Math.round(actual / 1000) * 1000
      : Math.round(actual);
 
    // prevent loop
    if (field.value !== finalValue) {
      field.value = finalValue;
 
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}
 
/* ===== MAIN ===== */
export default async function decorate(fieldDiv) {
  const input = fieldDiv.querySelector('input');
  if (!input) return fieldDiv;
 
  const isLoan = isLoanField(fieldDiv);
  const steps = isLoan ? LOAN_STEPS : TENURE_STEPS;
 
  /* ===== SLIDER SETUP ===== */
  input.type = 'range';
  input.min = 0;
  input.max = steps.length - 1;
  input.step = 0.01;
  input.value = steps.length - 1;
 
  /* ===== WRAPPER ===== */
  const wrapper = document.createElement('div');
  wrapper.className = 'range-widget-wrapper decorated';
 
  input.after(wrapper);
 
  const bubble = document.createElement('span');
  bubble.className = 'range-bubble';
 
  const minEl = document.createElement('span');
  const maxEl = document.createElement('span');
 
  minEl.className = 'range-min';
  maxEl.className = 'range-max';
 
  wrapper.appendChild(bubble);
  wrapper.appendChild(input);
  wrapper.appendChild(minEl);
  wrapper.appendChild(maxEl);
 
  /* ===== ADD TICKS ===== */
  addTicks(wrapper, input, fieldDiv);
 
  /* ===== EVENTS ===== */
  input.addEventListener('input', () => {
    updateBubble(input, wrapper, fieldDiv);
  });
 
  /* ===== INITIAL ===== */
  updateBubble(input, wrapper, fieldDiv);
 
  return fieldDiv;
}