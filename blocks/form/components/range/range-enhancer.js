const rangeConfigs = {
  loanAmount: {
    ticks: [50000, 200000, 400000, 600000, 800000, 1000000, 1500000],
    formatBubble: (v) => `₹${Number(v).toLocaleString('en-IN')}`,
    formatTick: (v) => (v === 50000 ? '50K' : `${v / 100000}L`),
  },
  loanTenure: {
    ticks: [12, 24, 36, 48, 60, 72, 84],
    formatBubble: (v) => `${Math.round(v)} months`,
    formatTick: (v) => `${v}m`,
  },
};

// ✅ Convert slider index → actual value
function getActualValue(input, config) {
  const index = Number(input.value);
  return config.ticks[index] || config.ticks[0];
}

// ✅ Update UI + store actual value
function updateUI(input, wrapper, type) {
  const config = rangeConfigs[type];
  const bubble = wrapper.querySelector('.range-bubble');

  if (!config || !bubble) return;

  const actual = getActualValue(input, config);

  // UI bubble
  bubble.innerText = config.formatBubble(actual);

  // 🔥 store actual value (IMPORTANT)
  input.dataset.actualValue = actual;

  // 🔥 trigger AEM rules
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

// ✅ Add tick labels
function addTicks(wrapper, config) {
  wrapper.querySelectorAll('.custom-range-tick').forEach(el => el.remove());

  config.ticks.forEach((val, idx) => {
    const tick = document.createElement('span');
    tick.className = 'custom-range-tick';
    tick.innerText = config.formatTick(val);
    tick.style.left = `${(idx / (config.ticks.length - 1)) * 100}%`;

    tick.onclick = () => {
      const input = wrapper.querySelector('input[type="range"]');
      input.value = idx;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    wrapper.appendChild(tick);
  });
}

// ✅ Main enhancer
function enhance(fieldDiv, type) {
  const input = fieldDiv.querySelector('input[type="range"]');
  const wrapper = fieldDiv.querySelector('.range-widget-wrapper');
  const config = rangeConfigs[type];

  if (!input || !wrapper || !config) return;

  // ✅ correct slider setup
  input.min = 0;
  input.max = config.ticks.length - 1;
  input.step = 1;

  addTicks(wrapper, config);

  // on slide
  input.addEventListener('input', () => {
    updateUI(input, wrapper, type);
  });

  // initial render
  updateUI(input, wrapper, type);
}

// ✅ entry point
export function initRangeEnhancer(fieldDiv) {
  if (!fieldDiv) return;

  if (fieldDiv.classList.contains('field-loanamount')) {
    enhance(fieldDiv, 'loanAmount');
  }

  if (fieldDiv.classList.contains('field-loantenure')) {
    enhance(fieldDiv, 'loanTenure');
  }
}