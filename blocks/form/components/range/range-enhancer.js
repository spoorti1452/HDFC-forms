function formatIndianCurrency(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

function formatLoanTick(value) {
  const n = Number(value);

  if (n === 50000) return '50K';
  if (n >= 100000) {
    const lakh = n / 100000;
    return `${Number.isInteger(lakh) ? lakh : lakh.toFixed(1)}L`;
  }
  if (n >= 1000) return `${n / 1000}K`;
  return `${n}`;
}

function formatTenureTick(value) {
  return `${value}m`;
}

function formatBubble(input, wrapper, fieldType) {
  const bubble = wrapper.querySelector('.range-bubble');
  const minEl = wrapper.querySelector('.range-min');
  const maxEl = wrapper.querySelector('.range-max');

  if (!bubble) return;

  const value = Number(input.value);
  const min = Number(input.min);
  const max = Number(input.max);

  if (fieldType === 'loanAmount') {
    bubble.innerText = formatIndianCurrency(value);
    if (minEl) minEl.innerText = formatLoanTick(min);
    if (maxEl) maxEl.innerText = formatLoanTick(max);
  }

  if (fieldType === 'loanTenure') {
    bubble.innerText = `${value} months`;
    if (minEl) minEl.innerText = formatTenureTick(min);
    if (maxEl) maxEl.innerText = formatTenureTick(max);
  }
}

function updateSliderPosition(input, wrapper) {
  const step = Number(input.step || 1);
  const max = Number(input.max || 0);
  const min = Number(input.min || 1);
  const value = Number(input.value || 1);

  const current = Math.ceil((value - min) / step);
  const total = Math.ceil((max - min) / step);

  const bubble = wrapper.querySelector('.range-bubble');
  if (!bubble) return;

  const bubbleWidth = bubble.getBoundingClientRect().width || 31;
  const left = `${(current / total) * 100}% - ${(current / total) * bubbleWidth}px`;

  const steps = {
    '--total-steps': total,
    '--current-steps': current,
  };

  const style = Object.entries(steps)
    .map(([varName, varValue]) => `${varName}:${varValue}`)
    .join(';');

  bubble.style.left = `calc(${left})`;
  wrapper.setAttribute('style', style);
}

function setExactValue(input, wrapper, fieldType, value) {
  input.value = value;
  updateSliderPosition(input, wrapper);
  formatBubble(input, wrapper, fieldType);

  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function addCustomTicks(wrapper, input, fieldType) {
  wrapper.querySelectorAll('.custom-range-tick').forEach((el) => el.remove());

  const min = Number(input.min);
  const max = Number(input.max);

  let ticks = [];

  if (fieldType === 'loanAmount') {
    ticks = [50000, 200000, 400000, 600000, 800000, 1000000, 1500000];
  }

  if (fieldType === 'loanTenure') {
    ticks = [12, 24, 36, 48, 60, 72, 84];
  }

  ticks.forEach((tickValue) => {
    const tick = document.createElement('span');
    tick.className = 'custom-range-tick';
    tick.innerText = fieldType === 'loanAmount'
      ? formatLoanTick(tickValue)
      : formatTenureTick(tickValue);

    tick.style.left = `${((tickValue - min) / (max - min)) * 100}%`;

    tick.addEventListener('click', () => {
      setExactValue(input, wrapper, fieldType, tickValue);
    });

    wrapper.appendChild(tick);
  });
}

function enhanceRangeField(field, fieldType) {
  if (!field) return;

  const input = field.querySelector('input[type="range"]');
  const wrapper = field.querySelector('.range-widget-wrapper');

  if (!input || !wrapper) return;

  addCustomTicks(wrapper, input, fieldType);
  formatBubble(input, wrapper, fieldType);
}

export function initRangeEnhancer(fieldDiv) {
  if (!fieldDiv) return;

  if (fieldDiv.classList.contains('field-loanamount')) {
    enhanceRangeField(fieldDiv, 'loanAmount');
  }

  if (fieldDiv.classList.contains('field-loantenure')) {
    enhanceRangeField(fieldDiv, 'loanTenure');
  }
}