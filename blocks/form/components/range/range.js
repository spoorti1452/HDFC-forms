/* =========================
   CONFIG
========================= */
const rangeConfigs = {
  loanAmount: {
    ticks: [50000, 200000, 400000, 600000, 800000, 1000000, 1500000],
    defaultValue: 400000,
    formatBubble: (v) => `₹${Number(v).toLocaleString('en-IN')}`,
    formatTick: (v) => (v === 50000 ? '50K' : `${v / 100000}L`),
  },

  loanTenure: {
    ticks: [12, 24, 36, 48, 60, 72, 84],
    defaultValue: 36,
    formatBubble: (v) => `${v} months`,
    formatTick: (v) => `${v}m`,
  },
};

/* =========================
   HELPERS
========================= */
function getActualValue(index, config) {
  return config.ticks[index] || config.ticks[0];
}

/* =========================
   MAIN DECORATE
========================= */
export default function decorate(fieldDiv) {
  const input = fieldDiv.querySelector('input');
  if (!input) return fieldDiv;

  input.type = 'range';

  const wrapper = document.createElement('div');
  wrapper.className = 'range-widget-wrapper';

  input.after(wrapper);

  const bubble = document.createElement('span');
  bubble.className = 'range-bubble';

  wrapper.appendChild(bubble);
  wrapper.appendChild(input);

  /* =========================
     IDENTIFY TYPE
  ========================= */
  let type = null;

  if (fieldDiv.classList.contains('field-loanamount')) {
    type = 'loanAmount';
  }

  if (fieldDiv.classList.contains('field-loantenure')) {
    type = 'loanTenure';
  }

  const config = rangeConfigs[type];
  if (!config) return fieldDiv;

  /* =========================
     RANGE SETUP
  ========================= */
  input.min = 0;
  input.max = config.ticks.length - 1;
  input.step = 1;

  /* =========================
     ADD TICKS
  ========================= */
  config.ticks.forEach((val, idx) => {
    const tick = document.createElement('span');
    tick.className = 'custom-range-tick';
    tick.innerText = config.formatTick(val);

    tick.style.left = `${(idx / (config.ticks.length - 1)) * 100}%`;

    tick.onclick = () => {
      input.value = idx;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    wrapper.appendChild(tick);
  });

  /* =========================
     UPDATE FUNCTION
  ========================= */
  function update() {
    const index = Number(input.value);
    const actual = getActualValue(index, config);

    /* bubble */
    bubble.innerText = config.formatBubble(actual);

    /* progress */
    wrapper.style.setProperty('--current-steps', index);
    wrapper.style.setProperty('--total-steps', config.ticks.length - 1);

    /* store */
    input.dataset.actualValue = actual;

    /* =========================
       🔥 UPDATE EDS MODEL
    ========================= */
    const fieldWrapper = input.closest('.field-wrapper');
    const fieldModel = fieldWrapper?.model;

    if (fieldModel) {
      const globals =
        fieldModel?.form?.context ||
        fieldModel?._form?.context;

      if (globals && globals.functions) {
        // double setProperty = guaranteed trigger
        globals.functions.setProperty(fieldModel, { value: actual });
        globals.functions.setProperty(fieldModel, { value: actual });
      }
    }
  }

  /* =========================
     EVENTS
  ========================= */
  input.addEventListener('input', () => {
    requestAnimationFrame(update);
  });

  input.addEventListener('change', update);

  /* =========================
     DEFAULT
  ========================= */
  const defaultIndex =
    config.ticks.indexOf(config.defaultValue) >= 0
      ? config.ticks.indexOf(config.defaultValue)
      : 0;

  input.value = defaultIndex;

  update();

  return fieldDiv;
}