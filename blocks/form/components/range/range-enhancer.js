const rangeConfigs = {
  loanAmount: {
    ticks: [50000, 200000, 400000, 600000, 800000, 1000000, 1500000],
    formatBubble: (value) => `₹${Number(value).toLocaleString('en-IN')}`,
    formatTick: (value) => {
      if (value === 50000) return '50K';
      return `${value / 100000}L`;
    },
  },
  loanTenure: {
    ticks: [12, 24, 36, 48, 60, 72, 84],
    formatBubble: (value) => `${value} months`,
    formatTick: (value) => `${value}m`,
  },
};

function getNearestIndex(ticks, actualValue) {
  return ticks.reduce((nearest, tick, index) => {
    return Math.abs(tick - actualValue) < Math.abs(ticks[nearest] - actualValue)
      ? index
      : nearest;
  }, 0);
}

function formatBubble(input, wrapper, fieldType) {
  const config = rangeConfigs[fieldType];
  const bubble = wrapper.querySelector('.range-bubble');
  if (!config || !bubble) return;

  const index = Number(input.value);
  const actualValue = config.ticks[index];

  input.dataset.actualValue = actualValue;
  bubble.innerText = config.formatBubble(actualValue);
}

function addCustomTicks(wrapper, input, fieldType) {
  const config = rangeConfigs[fieldType];
  if (!config) return;

  wrapper.querySelectorAll('.custom-range-tick').forEach((el) => el.remove());

  config.ticks.forEach((tickValue, index) => {
    const tick = document.createElement('span');
    tick.className = 'custom-range-tick';
    tick.innerText = config.formatTick(tickValue);

    /* equal spacing */
    tick.style.left = `${(index / (config.ticks.length - 1)) * 100}%`;

    tick.addEventListener('click', () => {
      input.value = index;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    wrapper.appendChild(tick);
  });
}

function enhanceRangeField(field, fieldType) {
  if (!field || field.dataset.rangeEnhanced === 'true') return;

  const input = field.querySelector('input[type="range"]');
  const wrapper = field.querySelector('.range-widget-wrapper');
  const config = rangeConfigs[fieldType];

  if (!input || !wrapper || !config) return;

  const originalValue = Number(input.value || input.max || config.ticks[0]);
  const nearestIndex = getNearestIndex(config.ticks, originalValue);

  input.min = 0;
  input.max = config.ticks.length - 1;
  input.step = 1;
  input.value = nearestIndex;

  field.dataset.rangeEnhanced = 'true';

  addCustomTicks(wrapper, input, fieldType);
  formatBubble(input, wrapper, fieldType);

  input.addEventListener('input', () => {
    formatBubble(input, wrapper, fieldType);
  });

  input.addEventListener('change', () => {
    formatBubble(input, wrapper, fieldType);
  });
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