export default async function decorate(fieldDiv) {
  const input = fieldDiv.querySelector('input');
  if (!input) return fieldDiv;

  input.type = 'range';

  /* =========================
     CONFIG (INLINE)
  ========================= */
  const isLoanAmount = fieldDiv.classList.contains('field-loanamount');
  const isTenure = fieldDiv.classList.contains('field-loantenure');

  const config = isLoanAmount
    ? {
        ticks: [50000, 200000, 400000, 600000, 800000, 1000000, 1500000],
        format: (v) => `₹${v.toLocaleString('en-IN')}`,
        labels: ['50K', '2L', '4L', '6L', '8L', '10L', '15L'],
      }
    : {
        ticks: [12, 24, 36, 48, 60, 72, 84],
        format: (v) => `${v} months`,
        labels: ['12m', '24m', '36m', '48m', '60m', '72m', '84m'],
      };

  /* =========================
     WRAPPER
  ========================= */
  const wrapper = document.createElement('div');
  wrapper.className = 'range-widget-wrapper';

  input.after(wrapper);

  const bubble = document.createElement('span');
  bubble.className = 'range-bubble';

  wrapper.appendChild(input);
  wrapper.appendChild(bubble);

  /* =========================
     SET RANGE
  ========================= */
  input.min = 0;
  input.max = config.ticks.length - 1;
  input.step = 1;

  /* =========================
     ADD LABELS
  ========================= */
  config.labels.forEach((label, i) => {
    const tick = document.createElement('span');
    tick.className = 'custom-range-tick';
    tick.innerText = label;
    tick.style.left = `${(i / (config.labels.length - 1)) * 100}%`;

    tick.onclick = () => {
      input.value = i;
      update();
    };

    wrapper.appendChild(tick);
  });

  /* =========================
     UPDATE FUNCTION
  ========================= */
  function update() {
    const index = Number(input.value);
    const value = config.ticks[index];

    // bubble text
    bubble.innerText = config.format(value);

    // bubble position
    const percent = index / (config.ticks.length - 1);
    bubble.style.left = `calc(${percent * 100}% - 20px)`;

    // 🔥 THIS FIXES SLIDER FILL
    input.style.background = `
      linear-gradient(to right, #f59e0b 0%, 
      #f59e0b ${percent * 100}%, 
      #e5e7eb ${percent * 100}%, 
      #e5e7eb 100%)
    `;

    /* =========================
       UPDATE EDS FIELD
    ========================= */
    const fieldWrapper = input.closest('.field-wrapper');
    const fieldModel = fieldWrapper?.model;

    if (fieldModel) {
      const globals =
        fieldModel?.form?.context ||
        fieldModel?._form?.context;

      if (globals?.functions) {
        globals.functions.setProperty(fieldModel, {
          value: value,
        });

        globals.functions.dispatchEvent(fieldModel, 'valueCommit');
      }
    }
  }

  /* =========================
     EVENTS
  ========================= */
  input.addEventListener('input', update);

  /* =========================
     INIT
  ========================= */
  input.value = 3; // default mid
  update();

  return fieldDiv;
}