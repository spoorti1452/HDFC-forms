/* =========================
   CONFIG
========================= */
const rangeConfigs = {
  loanAmount: {
    ticks: [50000, 200000, 400000, 600000, 800000, 1000000, 1500000],
    defaultIndex: 3, // 600000
    formatBubble: (value) =>
      `₹${Number(value).toLocaleString('en-IN')}`,
    formatTick: (value) =>
      value === 50000 ? '50K' : `${value / 100000}L`,
  },

  loanTenure: {
    ticks: [12, 24, 36, 48, 60, 72, 84],
    defaultIndex: 3, // 48
    formatBubble: (value) => `${value} months`,
    formatTick: (value) => `${value}m`,
  },
};

/* =========================
   UPDATE UI + AEM FIELD
========================= */
function updateUI(input, wrapper, fieldType) {
  const config = rangeConfigs[fieldType];
  if (!config) return;

  const bubble = wrapper.querySelector('.range-bubble');
  const index = Number(input.value);
  const actual = config.ticks[index];

  /* ===== UPDATE CSS PROGRESS ===== */
  wrapper.style.setProperty('--current-steps', index);
  wrapper.style.setProperty('--total-steps', config.ticks.length - 1);

  /* ===== UPDATE BUBBLE ===== */
  if (bubble) {
    bubble.innerText = config.formatBubble(actual);
  }

  /* ===== UPDATE AEM FIELD ===== */
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

      // 🔥 triggers calculateEMI
      globals.functions.dispatchEvent(fieldModel, 'valueCommit');
    }
  }
}

/* =========================
   ADD CUSTOM TICKS
========================= */
function addTicks(wrapper, input, fieldType) {
  const config = rangeConfigs[fieldType];
  if (!config) return;

  config.ticks.forEach((val, idx) => {
    const tick = document.createElement('span');
    tick.className = 'custom-range-tick';
    tick.innerText = config.formatTick(val);

    tick.style.left = `${(idx / (config.ticks.length - 1)) * 100}%`;

    tick.addEventListener('click', () => {
      input.value = idx;

      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    wrapper.appendChild(tick);
  });
}

/* =========================
   MAIN DECORATE
========================= */
export default function decorate(fieldDiv) {
  const input = fieldDiv.querySelector('input');
  if (!input) return fieldDiv;

  input.type = 'range';

  /* ===== CREATE WRAPPER ===== */
  const wrapper = document.createElement('div');
  wrapper.className = 'range-widget-wrapper decorated';

  input.after(wrapper);

  const bubble = document.createElement('span');
  bubble.className = 'range-bubble';

  wrapper.appendChild(bubble);
  wrapper.appendChild(input);

  /* =========================
     IDENTIFY FIELD TYPE
  ========================= */
  let fieldType = null;

  if (fieldDiv.classList.contains('field-loanamount')) {
    fieldType = 'loanAmount';
  }

  if (fieldDiv.classList.contains('field-loantenure')) {
    fieldType = 'loanTenure';
  }

  if (!fieldType) return fieldDiv;

  const config = rangeConfigs[fieldType];

  /* ===== SET RANGE ===== */
  input.min = 0;
  input.max = config.ticks.length - 1;
  input.step = 1;

  /* ===== DEFAULT POSITION ===== */
  input.value = config.defaultIndex;

  /* ===== INITIAL CSS ===== */
  wrapper.style.setProperty('--current-steps', input.value);
  wrapper.style.setProperty('--total-steps', config.ticks.length - 1);

  /* ===== ADD TICKS ===== */
  addTicks(wrapper, input, fieldType);

  /* ===== EVENTS ===== */
  input.addEventListener('input', () => {
    updateUI(input, wrapper, fieldType);
  });

  input.addEventListener('change', () => {
    updateUI(input, wrapper, fieldType);
  });

  /* ===== INITIAL RENDER ===== */
  updateUI(input, wrapper, fieldType);

  /* =========================
     🔥 AUTO TRIGGER EMI ON LOAD
  ========================= */
  setTimeout(() => {
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, 200);

  return fieldDiv;
}