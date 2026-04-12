// Content script to extract colors and fonts from the page
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

function extractPageFonts() {
  const fonts = new Set();
  const typographyData = [];
  
  // Scan all elements for font information
  const allElements = document.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    const style = window.getComputedStyle(element);
    const text = element.textContent?.trim();
    
    // Skip elements without text or with very little text
    if (!text || text.length < 3) continue;
    
    const fontFamily = style.fontFamily;
    const fontSize = style.fontSize;
    const fontWeight = style.fontWeight;
    const lineHeight = style.lineHeight;
    
    // Add font family to set
    if (fontFamily && fontFamily !== 'initial') {
      fonts.add(fontFamily);
    }
    
    // Collect detailed typography data
    typographyData.push({
      fontFamily: fontFamily,
      fontSize: fontSize,
      fontWeight: fontWeight,
      lineHeight: lineHeight,
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      element: element.tagName.toLowerCase()
    });
  }
  
  return {
    fonts: Array.from(fonts),
    typography: typographyData.slice(0, 20) // Limit to first 20 elements
  };
}

function enableEyedropper() {
  // Create eyedropper cursor
  const cursor = document.createElement('div');
  cursor.style.cssText = `
    position: fixed;
    width: 20px;
    height: 20px;
    border: 2px solid #000;
    border-radius: 50%;
    pointer-events: none;
    z-index: 999999;
    mix-blend-mode: difference;
    display: none;
  `;
  document.body.appendChild(cursor);
  
  // Create magnifier
  const magnifier = document.createElement('div');
  magnifier.style.cssText = `
    position: fixed;
    width: 150px;
    height: 150px;
    border: 2px solid #000;
    border-radius: 50%;
    pointer-events: none;
    z-index: 999998;
    display: none;
    overflow: hidden;
    background: white;
  `;
  document.body.appendChild(magnifier);
  
  const magnifierCanvas = document.createElement('canvas');
  magnifierCanvas.width = 150;
  magnifierCanvas.height = 150;
  magnifierCanvas.style.cssText = 'width: 100%; height: 100%;';
  magnifier.appendChild(magnifierCanvas);
  
  const ctx = magnifierCanvas.getContext('2d');
  
  let isActive = false;
  
  function moveEyedropper(e) {
    if (!isActive) return;
    
    cursor.style.left = (e.clientX - 10) + 'px';
    cursor.style.top = (e.clientY - 10) + 'px';
    cursor.style.display = 'block';
    
    magnifier.style.left = (e.clientX + 20) + 'px';
    magnifier.style.top = (e.clientY - 75) + 'px';
    magnifier.style.display = 'block';
    
    // Draw magnified view
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 150, 150);
    
    // Capture screen area around cursor
    const scale = 10;
    const sourceSize = 15;
    
    try {
      const sourceX = Math.max(0, e.clientX - sourceSize/2);
      const sourceY = Math.max(0, e.clientY - sourceSize/2);
      
      // Use html2canvas-like approach with canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = sourceSize;
      tempCanvas.height = sourceSize;
      const tempCtx = tempCanvas.getContext('2d');
      
      // Sample the pixel at cursor position
      const element = document.elementFromPoint(e.clientX, e.clientY);
      if (element) {
        const style = window.getComputedStyle(element);
        const bgColor = style.backgroundColor;
        
        // Draw magnified view
        ctx.fillStyle = bgColor || 'white';
        ctx.fillRect(0, 0, 150, 150);
        
        // Draw center crosshair
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(75, 0);
        ctx.lineTo(75, 150);
        ctx.moveTo(0, 75);
        ctx.lineTo(150, 75);
        ctx.stroke();
        
        // Draw center pixel
        ctx.fillStyle = bgColor || 'white';
        ctx.fillRect(70, 70, 10, 10);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(70, 70, 10, 10);
      }
    } catch (err) {
      // Eyedropper error - silently handle
    }
  }
  
  function pickColor(e) {
    if (!isActive) return;
    
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (element) {
      const style = window.getComputedStyle(element);
      const bgColor = style.backgroundColor;
      
      // Convert to hex
      const rgb = bgColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
      if (rgb) {
        const r = parseInt(rgb[1]).toString(16).padStart(2, '0');
        const g = parseInt(rgb[2]).toString(16).padStart(2, '0');
        const b = parseInt(rgb[3]).toString(16).padStart(2, '0');
        const hex = `#${r}${g}${b}`.toUpperCase();
        
        // Send picked color back to popup
        chrome.runtime.sendMessage({ 
          action: "colorPicked", 
          color: hex,
          x: e.clientX,
          y: e.clientY
        });
      }
    }
    
    disableEyedropper();
  }
  
  function disableEyedropper() {
    if (!isActive) return;
    
    isActive = false;
    
    // Clean up DOM elements
    if (cursor && cursor.parentNode) {
      cursor.parentNode.removeChild(cursor);
    }
    if (magnifier && magnifier.parentNode) {
      magnifier.parentNode.removeChild(magnifier);
    }
    
    // Clean up canvas
    if (magnifierCanvas) {
      const ctx = magnifierCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, magnifierCanvas.width, magnifierCanvas.height);
      }
    }
    
    // Reset body cursor
    document.body.style.cursor = '';
    
    // Remove event listeners to prevent memory leaks
    document.removeEventListener('mousemove', moveEyedropper);
    document.removeEventListener('click', pickColor);
    document.removeEventListener('keydown', handleEscape);
    
    // Clear references
    cursor = null;
    magnifier = null;
    magnifierCanvas = null;
  }
  
  function handleEscape(e) {
    if (e.key === 'Escape' && isActive) {
      disableEyedropper();
      chrome.runtime.sendMessage({ action: "eyedropperCanceled" });
    }
  }
  
  return {
    enable: () => {
      isActive = true;
      document.body.style.cursor = 'none';
      document.addEventListener('mousemove', moveEyedropper);
      document.addEventListener('click', pickColor);
      document.addEventListener('keydown', handleEscape);
    },
    disable: disableEyedropper
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract") {
    const colors = extractPageColors();
    sendResponse({ colors: colors });
  } else if (request.action === "extractFonts") {
    const fonts = extractPageFonts();
    sendResponse({ fonts: fonts });
  } else if (request.action === "extractAll") {
    const colors = extractPageColors();
    const fonts = extractPageFonts();
    sendResponse({ colors: colors, fonts: fonts });
  } else if (request.action === "enableEyedropper") {
    const eyedropper = enableEyedropper();
    eyedropper.enable();
    sendResponse({ success: true });
  }
});
