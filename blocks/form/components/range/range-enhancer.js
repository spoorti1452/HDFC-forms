const rangeConfigs = {
  loanAmount: {
    ticks: [50000, 200000, 400000, 600000, 800000, 1000000, 1500000],
    defaultValue: 1500000,
    formatBubble: (value) => `₹${Number(value).toLocaleString('en-IN')}`,
    formatTick: (value) => (value === 50000 ? '50K' : `${value / 100000}L`),
  },
  loanTenure: {
    ticks: [12, 24, 36, 48, 60, 72, 84],
    defaultValue: 48,
    formatBubble: (value) => `${Math.round(value)} months`,
    formatTick: (value) => `${value}m`,
  },
};

function getActualValueFromSlider(input, config) {
  const val = Number(input.value);
  const i = Math.floor(val);
  const j = Math.ceil(val);

  if (i === j) return config.ticks[i];

  const low = config.ticks[i];
  const high = config.ticks[j];
  return low + (high - low) * (val - i);
}

function formatActualValue(value, type) {
  if (type === 'loanAmount') return Math.round(value / 1000) * 1000;
  if (type === 'loanTenure') return Math.round(value);
  return value;
}

function updateBubbleAndField(input, wrapper, fieldType) {
  const config = rangeConfigs[fieldType];
  const bubble = wrapper.querySelector('.range-bubble');
  if (!config || !bubble) return;

  const raw = getActualValueFromSlider(input, config);
  const actual = formatActualValue(raw, fieldType);

  // UI
  bubble.innerText = config.formatBubble(actual);

  // 🔥 CRITICAL: update AEM model
  const fieldModel = input.closest('[data-aem-field]')?.model;

  if (fieldModel) {
    fieldModel.value = actual;
  }
}

function addTicks(wrapper, input, fieldType) {
  const config = rangeConfigs[fieldType];
  if (!config) return;

  wrapper.querySelectorAll('.custom-range-tick').forEach(el => el.remove());

  config.ticks.forEach((val, idx) => {
    const tick = document.createElement('span');
    tick.className = 'custom-range-tick';
    tick.innerText = config.formatTick(val);
    tick.style.left = `${(idx / (config.ticks.length - 1)) * 100}%`;

    tick.onclick = () => {
      input.value = idx;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    wrapper.appendChild(tick);
  });
}

function enhance(fieldDiv, type) {
  const input = fieldDiv.querySelector('input[type="range"]');
  const wrapper = fieldDiv.querySelector('.range-widget-wrapper');
  const config = rangeConfigs[type];

  if (!input || !wrapper || !config) return;

  input.min = 0;
  input.max = config.ticks.length - 1;
  input.step = 0.01;

  addTicks(wrapper, input, type);

  // 🔥 ON SLIDE
  input.addEventListener('input', () => {
    updateBubbleAndField(input, wrapper, type);
  });

  // initial
  updateBubbleAndField(input, wrapper, type);
}

export function initRangeEnhancer(fieldDiv) {
  if (fieldDiv.classList.contains('field-loanamount')) {
    enhance(fieldDiv, 'loanAmount');
  }

  if (fieldDiv.classList.contains('field-loantenure')) {
    enhance(fieldDiv, 'loanTenure');
  }
}