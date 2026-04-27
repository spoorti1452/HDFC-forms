/* =========================
   CONFIG
========================= */
const rangeConfigs = {
  loanAmount: {
    ticks: [50000, 200000, 400000, 600000, 800000, 1000000, 1500000],
    defaultValue: 400000,
    formatBubble: (value) =>
      `₹${Number(value).toLocaleString('en-IN')}`,
    formatTick: (value) =>
      value === 50000 ? '50K' : `${value / 100000}L`,
  },

  loanTenure: {
    ticks: [12, 24, 36, 48, 60, 72, 84],
    defaultValue: 36,
    formatBubble: (value) => `${value} months`,
    formatTick: (value) => `${value}m`,
  },
};

/* =========================
   HELPERS
========================= */
function getActualValue(index, config) {
  return config.ticks[index] || config.ticks[0];
}

/* =========================
   UPDATE UI + EDS MODEL
========================= */
function updateBubbleAndField(input, wrapper, type) {
  const config = rangeConfigs[type];
  if (!config) return;

  const bubble = wrapper.querySelector('.range-bubble');
  if (!bubble) return;

  const index = Number(input.value);
  const actual = getActualValue(index, config);

  /* ===== CSS PROGRESS ===== */
  wrapper.style.setProperty('--current-steps', index);
  wrapper.style.setProperty(
    '--total-steps',
    config.ticks.length - 1
  );

  /* ===== UPDATE BUBBLE ===== */
  bubble.innerText = config.formatBubble(actual);

  /* ===== STORE VALUE ===== */
  input.dataset.actualValue = actual;

  /* =========================
     🔥 UPDATE EDS FIELD + TRIGGER VALUE COMMIT
  ========================= */
  const fieldWrapper = input.closest('.field-wrapper');
  const fieldModel = fieldWrapper?.model;

  if (fieldModel) {
    const globals =
      fieldModel?.form?.context ||
      fieldModel?._form?.context;

    if (globals && globals.functions) {
      // ✅ Update field value
      globals.functions.setProperty(fieldModel, {
        value: actual,
      });

      // 🔥 IMPORTANT: trigger Value Commit (required in your setup)
      if (globals.functions.dispatchEvent) {
        globals.functions.dispatchEvent(fieldModel, 'valueCommit');
      }
    }
  }
}

/* =========================
   ADD TICKS
========================= */
function addTicks(wrapper, input, type) {
  const config = rangeConfigs[type];
  if (!config) return;

  // remove existing ticks
  wrapper.querySelectorAll('.custom-range-tick').forEach((el) => el.remove());

  config.ticks.forEach((val, idx) => {
    const tick = document.createElement('span');
    tick.className = 'custom-range-tick';
    tick.innerText = config.formatTick(val);

    tick.style.left = `${(idx / (config.ticks.length - 1)) * 100}%`;

    tick.onclick = () => {
      input.value = idx;
      updateBubbleAndField(input, wrapper, type);
    };

    wrapper.appendChild(tick);
  });
}

/* =========================
   MAIN ENHANCER
========================= */
function enhance(fieldDiv, type) {
  const input = fieldDiv.querySelector('input[type="range"]');
  const wrapper = fieldDiv.querySelector('.range-widget-wrapper');
  const config = rangeConfigs[type];

  if (!input || !wrapper || !config) return;

  // prevent duplicate init
  if (input.dataset.enhanced === 'true') return;
  input.dataset.enhanced = 'true';

  /* ===== SET RANGE ===== */
  input.min = 0;
  input.max = config.ticks.length - 1;
  input.step = 1;

  /* ===== ADD TICKS ===== */
  addTicks(wrapper, input, type);

  /* ===== SET DEFAULT ===== */
  const defaultIndex =
    config.ticks.indexOf(config.defaultValue) >= 0
      ? config.ticks.indexOf(config.defaultValue)
      : 0;

  input.value = defaultIndex;

  /* ===== INIT CSS ===== */
  wrapper.style.setProperty('--current-steps', defaultIndex);
  wrapper.style.setProperty(
    '--total-steps',
    config.ticks.length - 1
  );

  /* ===== EVENTS ===== */
  input.addEventListener('input', () => {
    requestAnimationFrame(() => {
      updateBubbleAndField(input, wrapper, type);
    });
  });

  input.addEventListener('change', () => {
    updateBubbleAndField(input, wrapper, type);
  });

  /* ===== INITIAL RENDER ===== */
  updateBubbleAndField(input, wrapper, type);
}

/* =========================
   ENTRY
========================= */
export function initRangeEnhancer(fieldDiv) {
  if (fieldDiv.classList.contains('field-loanamount')) {
    enhance(fieldDiv, 'loanAmount');
  }

  if (fieldDiv.classList.contains('field-loantenure')) {
    enhance(fieldDiv, 'loanTenure');
  }
}