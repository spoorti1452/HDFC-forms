/* =========================
   CONFIG
========================= */
const rangeConfigs = {
  loanAmount: {
    ticks: [50000, 200000, 400000, 600000, 800000, 1000000, 1500000],
    defaultValue: 600000,
    formatBubble: (value) =>
      `₹${Number(value).toLocaleString('en-IN')}`,
    formatTick: (value) =>
      value === 50000 ? '50K' : `${value / 100000}L`,
  },

  loanTenure: {
    ticks: [12, 24, 36, 48, 60, 72, 84],
    defaultValue: 48,
    formatBubble: (value) => `${value} months`,
    formatTick: (value) => `${value}m`,
  },
};

/* =========================
   HELPERS
========================= */
function getNearestIndex(value) {
  return Math.round(value);
}

function getActualValue(index, config) {
  return config.ticks[index];
}

function getSliderFromActual(actual, config) {
  const ticks = config.ticks;

  for (let i = 0; i < ticks.length - 1; i++) {
    if (actual >= ticks[i] && actual <= ticks[i + 1]) {
      const percent =
        (actual - ticks[i]) / (ticks[i + 1] - ticks[i]);
      return i + percent;
    }
  }
  return 0;
}

/* =========================
   UPDATE UI + AEM
========================= */
function updateUI(input, wrapper, fieldType) {
  const config = rangeConfigs[fieldType];
  if (!config) return;

  const bubble = wrapper.querySelector('.range-bubble');

  const rawValue = Number(input.value);
  const index = getNearestIndex(rawValue);
  const actual = getActualValue(index, config);

  /* ===== CSS ===== */
  wrapper.style.setProperty('--current-steps', rawValue);
  wrapper.style.setProperty('--total-steps', config.ticks.length - 1);

  /* ===== BUBBLE ===== */
  if (bubble) {
    bubble.innerText = config.formatBubble(actual);
  }

  input.dataset.actualValue = actual;

  /* ===== AEM UPDATE ===== */
  const fieldWrapper = input.closest('.field-wrapper');
  const fieldModel = fieldWrapper?.model;

  if (fieldModel) {
    const globals =
      fieldModel?.form?.context ||
      fieldModel?._form?.context;

    if (globals?.functions) {
      globals.functions.setProperty(fieldModel, {
        value: actual,
      });

      globals.functions.dispatchEvent(fieldModel, 'valueCommit');
    }
  }
}

/* =========================
   ADD TICKS
========================= */
function addTicks(wrapper, input, fieldType) {
  const config = rangeConfigs[fieldType];

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

/* =========================
   MAIN
========================= */
export default function decorate(fieldDiv) {
  const input = fieldDiv.querySelector('input');
  if (!input) return fieldDiv;

  input.type = 'range';

  const wrapper = document.createElement('div');
  wrapper.className = 'range-widget-wrapper decorated';

  input.after(wrapper);

  const bubble = document.createElement('span');
  bubble.className = 'range-bubble';

  wrapper.appendChild(bubble);
  wrapper.appendChild(input);

  /* FIELD TYPE */
  let fieldType = null;

  if (fieldDiv.classList.contains('field-loanamount')) {
    fieldType = 'loanAmount';
  }

  if (fieldDiv.classList.contains('field-loantenure')) {
    fieldType = 'loanTenure';
  }

  if (!fieldType) return fieldDiv;

  const config = rangeConfigs[fieldType];

  /* RANGE SETTINGS */
  input.min = 0;
  input.max = config.ticks.length - 1;

  // 🔥 smooth movement
  input.step = 0.01;

  /* DEFAULT */
  const defaultSlider = getSliderFromActual(
    config.defaultValue,
    config
  );

  input.value = defaultSlider;

  /* CSS INIT */
  wrapper.style.setProperty('--current-steps', input.value);
  wrapper.style.setProperty('--total-steps', config.ticks.length - 1);

  /* TICKS */
  addTicks(wrapper, input, fieldType);

  /* EVENTS */
  input.addEventListener('input', () => {
    updateUI(input, wrapper, fieldType);
  });

  /* INITIAL */
  updateUI(input, wrapper, fieldType);

  /* AUTO TRIGGER EMI */
  setTimeout(() => {
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, 200);

  return fieldDiv;
}