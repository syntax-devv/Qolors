// Content script to extract colors from the page
function extractPageColors() {
  const colors = new Set();
  
  // Helper to standardise color to hex
  function rgbToHex(rgb) {
    if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return null;
    const parts = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
    if (!parts) return null;
    
    // Skip if transparent
    if (parts[4] === '0') return null;

    const r = parseInt(parts[1]).toString(16).padStart(2, '0');
    const g = parseInt(parts[2]).toString(16).padStart(2, '0');
    const b = parseInt(parts[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }

  // Scan all elements for colored properties
  const allElements = document.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    const style = window.getComputedStyle(allElements[i]);
    
    const bg = rgbToHex(style.backgroundColor);
    if (bg) colors.add(bg);
    
    const color = rgbToHex(style.color);
    if (color) colors.add(color);
    
    const border = rgbToHex(style.borderTopColor);
    if (border) colors.add(border);
  }
  
  return Array.from(colors);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract") {
    const colors = extractPageColors();
    sendResponse({ colors: colors });
  }
});
