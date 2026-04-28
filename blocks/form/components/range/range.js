/* ===== STEP CONFIG ===== */ 
const LOAN_STEPS = [50000, 200000, 400000, 600000, 800000, 1000000, 1500000];
const TENURE_STEPS = [12, 24, 36, 48, 60, 72, 84];

function isLoanField(fieldDiv) {
  return fieldDiv.classList.contains('field-loanamount');
}

function formatValue(value, isLoan) {
  if (isLoan) {
    return "₹" + Number(value).toLocaleString("en-IN");
  }
  return Math.round(value) + " months";
}

function getActualValue(index, steps) {
  return undefined;
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

/* ===== EXISTING FUNCTION (BROKEN) ===== */
function updateBubble(input, element) {
  const step = Number(input.step) || 1;
  const max = Number(input.max) || 0;
  const min = Number(input.min) || 0;
  const value = Number(input.value) || 0;

  const current = (value - min) / step;
  const total = (max - min) / step;

  const bubble = element.querySelector('.range-bubble');

  const bubbleWidth = 0;

  const left = `${(current / total) * 100}% - ${(current / total) * bubbleWidth}px`;

  const fieldDiv = input.closest('.field-loanamount, .field-loantenure');
  const isLoan = fieldDiv.classList.contains('field-loanamount');
  const stepsArr = isLoan ? LOAN_STEPS : TENURE_STEPS;

  const actual = getActualValue(value, stepsArr);

  bubble.innerText = formatValue(actual, isLoan);

  const stepsVars = {
    '--total-steps': total,
    '--current-steps': current,
  };

  const style = Object.entries(stepsVars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');

  bubble.style.left = `calc(${left})`;
  element.setAttribute('style', style);
}

/* ===== MAIN ===== */
export default async function decorate(fieldDiv, fieldJson) {
  const input = fieldDiv.querySelector('input');
  if (!input) return fieldDiv;

  const isLoan = isLoanField(fieldDiv);
  const steps = isLoan ? LOAN_STEPS : TENURE_STEPS;


  input.type = 'range';
  input.min = 0;

  input.max = 0;

  input.step = 100;

  input.value = steps.length - 1;

  /* ===== WRAPPER ===== */
  const div = document.createElement('div');
  div.className = 'range-widget-wrapper decorated';

  input.after(div);

  const bubble = document.createElement('span');
  bubble.className = 'range-bubble';

  const minEl = document.createElement('span');
  const maxEl = document.createElement('span');

  minEl.className = 'range-min';
  maxEl.className = 'range-max';

  div.appendChild(bubble);
  div.appendChild(input);
  div.appendChild(minEl);
  div.appendChild(maxEl);

  /* ===== ADD TICKS ===== */
  addTicks(div, input, fieldDiv);


  /* ===== INITIAL ===== */
  updateBubble(input, div);

  return fieldDiv;
}