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

/**
 * 🔥 Converts slider position → actual value
 * WITH snapping to nearest tick when close
 */
function getActualValueFromSlider(input, config) {
  let sliderValue = Number(input.value);

  // 🔥 SNAP to nearest tick if very close
  const snappedIndex = Math.round(sliderValue);
  if (Math.abs(sliderValue - snappedIndex) < 0.01) {
    return config.ticks[snappedIndex];
  }

  const lowerIndex = Math.floor(sliderValue);
  const upperIndex = Math.ceil(sliderValue);

  if (lowerIndex === upperIndex) {
    return config.ticks[lowerIndex];
  }

  const lowerValue = config.ticks[lowerIndex];
  const upperValue = config.ticks[upperIndex];
  const percentage = sliderValue - lowerIndex;

  return lowerValue + ((upperValue - lowerValue) * percentage);
}

/**
 * 🔥 Converts actual value → slider position
 */
function getSliderValueFromActual(actualValue, config) {
  const ticks = config.ticks;

  if (actualValue <= ticks[0]) return 0;
  if (actualValue >= ticks[ticks.length - 1]) return ticks.length - 1;

  for (let i = 0; i < ticks.length - 1; i += 1) {
    if (actualValue >= ticks[i] && actualValue <= ticks[i + 1]) {
      const percentage =
        (actualValue - ticks[i]) / (ticks[i + 1] - ticks[i]);
      return i + percentage;
    }
  }

  return 0;
}

/**
 * 🔥 Final formatting
 */
function formatActualValue(actualValue, fieldType) {
  if (fieldType === 'loanAmount') {
    return Math.round(actualValue / 1000) * 1000;
  }

  if (fieldType === 'loanTenure') {
    return Math.round(actualValue);
  }

  return actualValue;
}

/**
 * 🔥 Sync slider → UI → AEM
 */
function updateBubbleText(input, wrapper, fieldType) {
  const config = rangeConfigs[fieldType];
  const bubble = wrapper.querySelector('.range-bubble');

  if (!config || !bubble) return;

  const rawActualValue = getActualValueFromSlider(input, config);
  const actualValue = formatActualValue(rawActualValue, fieldType);

  // UI update
  input.dataset.actualValue = actualValue;
  bubble.innerText = config.formatBubble(actualValue);

  // 🔥 Update AEM field
  const fieldDiv = input.closest('[data-aem-field]');
  if (fieldDiv && fieldDiv._field) {
    fieldDiv._field.value = actualValue;

    fieldDiv._field.dispatchEvent(
      new Event('change', { bubbles: true })
    );
  }
}

/**
 * 🔥 Create clickable ticks
 */
function addCustomTicks(wrapper, input, fieldType) {
  const config = rangeConfigs[fieldType];
  if (!config) return;

  wrapper.querySelectorAll('.custom-range-tick').forEach((el) =>
    el.remove()
  );

  config.ticks.forEach((tickValue, index) => {
    const tick = document.createElement('span');
    tick.className = 'custom-range-tick';
    tick.innerText = config.formatTick(tickValue);

    tick.style.left = `${
      (index / (config.ticks.length - 1)) * 100
    }%`;

    tick.addEventListener('click', () => {
      // 🔥 FORCE exact index (NO interpolation)
      input.value = index;

      // trigger UI + logic
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    wrapper.appendChild(tick);
  });
}

/**
 * 🔥 Main enhancer
 */
function enhanceRangeField(field, fieldType) {
  if (!field) return;

  const input = field.querySelector('input[type="range"]');
  const wrapper = field.querySelector('.range-widget-wrapper');
  const config = rangeConfigs[fieldType];

  if (!input || !wrapper || !config) return;

  if (field.dataset.rangeEnhanced !== 'true') {
    const originalActualValue = Number(
      input.value || config.defaultValue
    );

    const sliderValue = getSliderValueFromActual(
      originalActualValue,
      config
    );

    input.min = 0;
    input.max = config.ticks.length - 1;

    // 🔥 keep smooth sliding
    input.step = 0.01;

    input.value = sliderValue;

    addCustomTicks(wrapper, input, fieldType);

    field.dataset.rangeEnhanced = 'true';
  }

  // initial render
  updateBubbleText(input, wrapper, fieldType);

  // 🔥 listen to movement
  input.addEventListener('input', () => {
    updateBubbleText(input, wrapper, fieldType);
  });
}

/**
 * 🔥 Entry point
 */
export function initRangeEnhancer(fieldDiv) {
  if (!fieldDiv) return;

  if (fieldDiv.classList.contains('field-loanamount')) {
    enhanceRangeField(fieldDiv, 'loanAmount');
  }

  if (fieldDiv.classList.contains('field-loantenure')) {
    enhanceRangeField(fieldDiv, 'loanTenure');
  }
}