import { initRangeEnhancer } from './range-enhancer.js';

function updateBubble(input, element) {
  const step = Number(input.step) || 1;
  const max = Number(input.max) || 0;
  const min = Number(input.min) || 0;
  const value = Number(input.value) || 0;

  const current = (value - min) / step;
  const total = (max - min) / step;

  const bubble = element.querySelector('.range-bubble');
  if (!bubble) return;

  const bubbleWidth = bubble.getBoundingClientRect().width || 31;

  const left = `${(current / total) * 100}% - ${(current / total) * bubbleWidth}px`;

  bubble.style.left = `calc(${left})`;

  element.style.setProperty('--total-steps', total);
  element.style.setProperty('--current-steps', current);
}

export default async function decorate(fieldDiv, fieldJson) {
  const input = fieldDiv.querySelector('input');
  if (!input) return fieldDiv;

  input.type = 'range';

  const wrapper = document.createElement('div');
  wrapper.className = 'range-widget-wrapper decorated';

  input.after(wrapper);

  const bubble = document.createElement('span');
  bubble.className = 'range-bubble';

  const minEl = document.createElement('span');
  minEl.className = 'range-min';

  const maxEl = document.createElement('span');
  maxEl.className = 'range-max';

  wrapper.appendChild(bubble);
  wrapper.appendChild(input);
  wrapper.appendChild(minEl);
  wrapper.appendChild(maxEl);

  // 🔥 INIT ONLY ONCE
  initRangeEnhancer(fieldDiv);

  // 🔥 ON SLIDE (ONLY UPDATE UI)
  input.addEventListener('input', () => {
    updateBubble(input, wrapper);
  });

  // initial render
  updateBubble(input, wrapper);

  return fieldDiv;
}