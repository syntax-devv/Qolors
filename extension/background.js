chrome.commands.onCommand.addListener((command) => {
  if (command === "pick_color") {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          func: () => {
            async function startEyeDropper() {
              if (!window.EyeDropper) {
                startDOMPicker();
                return;
              }

              try {
                const eyeDropper = new EyeDropper();
                const result = await eyeDropper.open();
                
                chrome.runtime.sendMessage({ 
                  action: "colorPicked", 
                  color: result.sRGBHex 
                });
              } catch (e) {
                // EyeDropper cancelled or failed - silently handle
              }
            }

            function startDOMPicker() {
              let isPickerActive = true;
              
              const tooltip = document.createElement('div');
              tooltip.style.cssText = `
                position: fixed;
                pointer-events: none;
                z-index: 100000;
                padding: 8px 12px;
                background: white;
                border: 1px solid #ccc;
                border-radius: 8px;
                font-family: 'Inter', sans-serif;
                font-size: 11px;
                display: none;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                line-height: 1.3;
              `;
              document.body.appendChild(tooltip);

              function rgbToHex(rgb) {
                if (!rgb || rgb === 'transparent' || rgb.includes('rgba(0, 0, 0, 0)')) return 'None';
                const rgbValues = rgb.match(/\d+/g);
                if (!rgbValues) return rgb;
                return "#" + rgbValues.slice(0, 3).map(x => {
                  const hex = parseInt(x).toString(16);
                  return hex.length === 1 ? "0" + hex : hex;
                }).join("").toUpperCase();
              }

              function handleMouseMove(e) {
                if (!isPickerActive) return;

                const target = document.elementFromPoint(e.clientX, e.clientY);
                if (!target) return;

                const style = window.getComputedStyle(target);
                const bgColor = rgbToHex(style.backgroundColor);
                const textColor = rgbToHex(style.color);
                const borderColor = rgbToHex(style.borderColor);

                tooltip.style.display = 'block';
                tooltip.style.left = (e.clientX + 15) + 'px';
                tooltip.style.top = (e.clientY + 15) + 'px';
                
                let tooltipContent = '';
                if (bgColor && bgColor !== 'None') {
                  tooltipContent += `
                    <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
                      <div style="width:12px; height:12px; background:${bgColor}; border:1px solid #ddd; border-radius:2px;"></div>
                      <span>BG: <b>${bgColor}</b></span>
                    </div>
                  `;
                }
                if (textColor && textColor !== 'None') {
                  tooltipContent += `
                    <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
                      <div style="width:12px; height:12px; background:${textColor}; border:1px solid #ddd; border-radius:2px;"></div>
                      <span>Text: <b>${textColor}</b></span>
                    </div>
                  `;
                }
                if (borderColor && borderColor !== 'None' && borderColor !== bgColor) {
                  tooltipContent += `
                    <div style="display:flex; align-items:center; gap:6px;">
                      <div style="width:12px; height:12px; background:${borderColor}; border:1px solid #ddd; border-radius:2px;"></div>
                      <span>Border: <b>${borderColor}</b></span>
                    </div>
                  `;
                }

                tooltip.innerHTML = tooltipContent || '<div style="color:#666;">No color detected</div>';
              }

              function handleClick(e) {
                if (!isPickerActive) return;
                
                const target = document.elementFromPoint(e.clientX, e.clientY);
                if (!target) return;

                const style = window.getComputedStyle(target);
                const bgColor = rgbToHex(style.backgroundColor);
                
                if (bgColor && bgColor !== 'None' && bgColor !== '#000000') {
                  chrome.runtime.sendMessage({ 
                    action: "colorPicked", 
                    color: bgColor 
                  });
                }

                // Cleanup
                cleanup();
              }

              function handleKeyPress(e) {
                if (e.key === 'Escape') {
                  cleanup();
                }
              }

              function cleanup() {
                isPickerActive = false;
                document.body.style.cursor = 'default';
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('click', handleClick);
                document.removeEventListener('keydown', handleKeyPress);
                if (tooltip && tooltip.parentNode) {
                  tooltip.parentNode.removeChild(tooltip);
                }
              }

              document.body.style.cursor = 'crosshair';
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('click', handleClick, { once: true });
              document.addEventListener('keydown', handleKeyPress);
            }

            startEyeDropper();
          }
        });
      }
    });
  }
});
