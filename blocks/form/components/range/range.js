import { initRangeEnhancer } from './range-enhancer.js';

export default async function decorate(fieldDiv) {
  const input = fieldDiv.querySelector('input');
  if (!input) return fieldDiv;

  // convert to range
  input.type = 'range';

  // wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'range-widget-wrapper decorated';

  input.after(wrapper);

  // bubble
  const bubble = document.createElement('span');
  bubble.className = 'range-bubble';

  // min/max (hidden but required for layout)
  const minEl = document.createElement('span');
  minEl.className = 'range-min';

  const maxEl = document.createElement('span');
  maxEl.className = 'range-max';

  wrapper.appendChild(bubble);
  wrapper.appendChild(input);
  wrapper.appendChild(minEl);
  wrapper.appendChild(maxEl);

  // 🔥 ONLY enhancer handles everything
  initRangeEnhancer(fieldDiv);

  return fieldDiv;
}