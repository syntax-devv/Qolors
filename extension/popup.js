let selectedColors = new Set();

document.getElementById('extract-btn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab.url.startsWith('chrome://')) {
    document.getElementById('status').innerText = "Can't extract from Chrome pages.";
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const colors = new Set();
      function rgbToHex(rgb) {
        if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return null;
        const parts = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
        if (!parts) return null;
        if (parts[4] === '0') return null;
        const r = parseInt(parts[1]).toString(16).padStart(2, '0');
        const g = parseInt(parts[2]).toString(16).padStart(2, '0');
        const b = parseInt(parts[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`.toUpperCase();
      }
      const allElements = document.getElementsByTagName('*');
      for (let i = 0; i < Math.min(allElements.length, 1000); i++) { // Sample first 1000 for speed
        const style = window.getComputedStyle(allElements[i]);
        const bg = rgbToHex(style.backgroundColor);
        if (bg) colors.add(bg);
        const color = rgbToHex(style.color);
        if (color) colors.add(color);
      }
      return Array.from(colors);
    }
  }, (results) => {
    if (results && results[0] && results[0].result) {
      renderColors(results[0].result);
    }
  });
});

function renderColors(colors) {
  const grid = document.getElementById('color-grid');
  const noColors = document.getElementById('no-colors');
  grid.innerHTML = '';
  noColors.style.display = 'none';

  colors.forEach(color => {
    const div = document.createElement('div');
    div.className = 'color-item';
    div.style.backgroundColor = color;
    div.title = color;
    div.addEventListener('click', () => {
      if (selectedColors.has(color)) {
        selectedColors.delete(color);
        div.classList.remove('selected');
        div.style.border = 'none';
      } else if (selectedColors.size < 10) {
        selectedColors.add(color);
        div.classList.add('selected');
        div.style.border = '3px solid #000';
      }
      
      const saveBtn = document.getElementById('save-btn');
      saveBtn.disabled = selectedColors.size === 0;
      saveBtn.innerText = `Save ${selectedColors.size} Colors to Qolors`;
    });
    grid.appendChild(div);
  });
}

document.getElementById('save-btn').addEventListener('click', () => {
  const colorsArray = Array.from(selectedColors).map(c => c.replace('#', ''));
  const url = `http://localhost:5173/generate?palette=${colorsArray.join(',')}`;
  chrome.tabs.create({ url: url });
});
