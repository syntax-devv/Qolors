class QolorsCollector {
  constructor() {
    this.selectedColors = new Set();
    this.pickedColors = new Set();
    this.extractedData = { colors: [], fonts: null };
    this.currentView = 'scan';
    this.recentScans = [];
    this.savedCollections = [];
    this.isLoadedCollection = false;
    this.loadedCollectionName = '';
    this.init();
  }

  async init() {
    await this.loadRecentScans();
    await this.loadSavedCollections();
    this.setupEventListeners();
    this.updateCurrentURL();
    this.renderRecentScans();
    this.renderSavedCollections();
    this.updateButtonStates();
    this.switchView('scan');
  }

  setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.target;
        this.switchView(view);
      });
    });

    document.getElementById('scan-trigger').addEventListener('click', () => {
      this.scanPage();
    });

    document.querySelector('header button').addEventListener('click', () => {
      this.showSettings();
    });

    document.addEventListener('click', (e) => {
      if (e.target && e.target.textContent === 'CLEAR') {
        this.clearRecentScans();
      }
    });

    document.getElementById('save-selected')?.addEventListener('click', () => {
      this.saveColors();
    });

    document.addEventListener('click', (e) => {
      if (e.target && e.target.textContent === 'Export as CSS') {
        this.exportColors();
      }
    });

    document.getElementById('copy-all')?.addEventListener('click', () => {
      this.copyAllColors();
    });

    document.getElementById('select-all')?.addEventListener('click', () => {
      this.toggleSelectAll();
    });

    this.messageListener = (request, sender, sendResponse) => {
      console.log('Message received:', request);
      if (request.action === "colorPicked" && request.color) {
        console.log('Color picked message:', request.color);
        this.handleColorPicked(request.color);
      }
    };
    chrome.runtime.onMessage.addListener(this.messageListener);
  }

  switchView(view) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-target="${view}"]`).classList.add('active');

    document.querySelectorAll('.view-content').forEach(viewEl => {
      viewEl.classList.remove('active');
    });

    document.getElementById(`${view}-view`).classList.add('active');
    this.currentView = view;
  }

  async updateCurrentURL() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const urlElement = document.getElementById('url-text');
      if (tab && tab.url) {
        const hostname = new URL(tab.url).hostname;
        urlElement.textContent = hostname;
      }
    } catch (error) {
      document.getElementById('url-text').textContent = 'Current page';
    }
  }

  async scanPage() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url.startsWith('chrome://')) {
      this.showNotification("Can't scan Chrome pages");
      return;
    }

    this.isLoadedCollection = false;
    this.loadedCollectionName = '';

    const scanTrigger = document.getElementById('scan-trigger');
    const scanStatus = document.getElementById('scan-status');
    const scanSpinner = document.getElementById('scan-spinner');
    const scanIcon = document.getElementById('scan-icon');
    
    scanTrigger.classList.add('loading');
    scanIcon.style.display = 'none';
    scanSpinner.style.display = 'block';
    scanStatus.innerText = "Extracting styles...";

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const colors = new Set();
        const fonts = new Set();
        const typographyData = [];
        
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
        let elementCount = 0;

        for (let i = 0; i < allElements.length; i++) {
          const element = allElements[i];
          const style = window.getComputedStyle(element);
          
          const bg = rgbToHex(style.backgroundColor);
          if (bg) colors.add(bg);
          const color = rgbToHex(style.color);
          if (color) colors.add(color);
          const border = rgbToHex(style.borderTopColor);
          if (border) colors.add(border);
          
          const bgImage = style.backgroundImage;
          if (bgImage && bgImage.includes('gradient')) {
            const gradientColors = bgImage.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/g);
            if (gradientColors) {
              gradientColors.forEach(c => colors.add(c.toUpperCase()));
            }
          }
          
          const text = element.textContent?.trim();
          if (text && text.length >= 3) {
            const fontFamily = style.fontFamily;
            if (fontFamily && fontFamily !== 'initial') {
              fonts.add(fontFamily);
            }
            
            typographyData.push({
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              lineHeight: style.lineHeight,
              text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
              element: element.tagName.toLowerCase()
            });
          }
          
          elementCount++;
        }

        return {
          colors: Array.from(colors),
          fonts: {
            fonts: Array.from(fonts),
            typography: typographyData.slice(0, 20)
          },
          elementCount: elementCount
        };
      }
    }, (results) => {
      if (results && results[0] && results[0].result) {
        const data = results[0].result;
        this.extractedData = {
          colors: data.colors,
          fonts: data.fonts
        };
        
        scanTrigger.classList.remove('loading');
        scanIcon.style.display = 'block';
        scanSpinner.style.display = 'none';
        scanStatus.innerText = `Scan Complete! ${data.elementCount} styles found.`;
        
        this.saveToRecentScans(data);
        
        this.renderColors();
        this.renderFonts();
        this.updateButtonStates();
        
        this.switchView('colors');
      }
    });
  }

  cleanFontName(fontFamily) {
    return fontFamily.split(',')[0].replace(/['"]/g, '').trim();
  }

  createFontCard(fontGroup) {
    const card = document.createElement('div');
    card.className = 'font-card shadow-sm';
    
    const mostCommonSize = Array.from(fontGroup.sizes).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      return bNum - aNum;
    })[0] || '16px';
    
    const mostCommonWeight = Array.from(fontGroup.weights).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      return bNum - aNum;
    })[0] || '400';
    
    const sampleText = fontGroup.samples[0] || 'The quick brown fox';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span class="text-sm font-bold">${fontGroup.family}</span>
        <span class="text-xs text-primary bg-primary" style="color:white; padding: 2px 6px; border-radius: 4px;">${fontGroup.usage}</span>
      </div>
      <div style="font-family: ${fontGroup.family}; font-size: 18px; border: 1px solid #f5f7f9; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
        ${sampleText}
      </div>
      <div class="text-xs" style="color: #595c5e; display: flex; gap: 12px;">
        <span>Size: <b>${mostCommonSize}</b></span>
        <span>Weight: <b>${mostCommonWeight}</b></span>
      </div>
    `;

    return card;
  }

  renderColors() {
    const container = document.getElementById('color-results-grid');
    container.innerHTML = '';

    this.extractedData.colors.forEach(color => {
      const colorDiv = document.createElement('div');
      colorDiv.style.display = 'flex';
      colorDiv.style.flexDirection = 'column';
      colorDiv.style.gap = '4px';
      colorDiv.style.position = 'relative';
      
      if (this.isLoadedCollection) {
        colorDiv.innerHTML = `
          <div class="color-swatch shadow-sm" style="background-color: ${color}; cursor: pointer;" data-color="${color}">
            <div class="copy-icon" style="position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.7); color: white; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 10px; opacity: 0; transition: opacity 0.2s;">
              <span class="material-symbols-outlined" style="font-size: 12px;">content_copy</span>
            </div>
          </div>
          <div class="text-xs" style="font-family: monospace; text-align: center;">${color.toUpperCase()}</div>
        `;
        
        const swatch = colorDiv.querySelector('.color-swatch');
        const copyIcon = colorDiv.querySelector('.copy-icon');
        
        swatch.addEventListener('mouseenter', () => {
          copyIcon.style.opacity = '1';
        });
        
        swatch.addEventListener('mouseleave', () => {
          copyIcon.style.opacity = '0';
        });
        
        swatch.addEventListener('click', () => {
          this.copyToClipboard(color);
          this.showNotification(`Copied ${color}`);
        });
        
      } else {
        colorDiv.innerHTML = `
          <div class="color-swatch shadow-sm" style="background-color: ${color}" data-color="${color}"></div>
          <div class="text-xs" style="font-family: monospace; text-align: center;">${color.toUpperCase()}</div>
        `;
        
        const swatch = colorDiv.querySelector('.color-swatch');
        swatch.addEventListener('click', () => {
          swatch.classList.toggle('selected');
          this.toggleColorSelection(color);
        });
      }
      container.appendChild(colorDiv);
    });
  }

  renderFonts() {
    const container = document.getElementById('fonts-results-list');
    container.innerHTML = '';

    if (!this.extractedData.fonts || !this.extractedData.fonts.fonts.length) {
      container.innerHTML = `
        <div class="text-center" style="padding: 40px; color: #595c5e;">
          <span class="material-symbols-outlined" style="font-size: 40px; margin-bottom: 8px; display: block;">format_size</span>
          <p class="text-sm">No fonts detected yet. Scan the page to analyze typography.</p>
        </div>
      `;
      return;
    }

    const fonts = this.extractedData.fonts.fonts;
    const typography = this.extractedData.fonts.typography;

    const fontGroups = {};
    fonts.forEach(font => {
      if (!fontGroups[font]) {
        fontGroups[font] = {
          family: font,
          usage: 'Detected',
          sizes: new Set(),
          weights: new Set(),
          samples: []
        };
      }
    });

    typography.forEach(item => {
      if (fontGroups[item.fontFamily]) {
        fontGroups[item.fontFamily].sizes.add(item.fontSize);
        fontGroups[item.fontFamily].weights.add(item.fontWeight);
        if (fontGroups[item.fontFamily].samples.length < 3) {
          fontGroups[item.fontFamily].samples.push(item.text);
        }
      }
    });

    Object.values(fontGroups).forEach(fontGroup => {
      const card = this.createFontCard(fontGroup);
      container.appendChild(card);
    });
  }

  toggleColorSelection(color) {
    if (this.selectedColors.has(color)) {
      this.selectedColors.delete(color);
    } else {
      this.selectedColors.add(color);
    }
    this.updateSaveButton();
    this.updateButtonStates();
  }

  updateSaveButton() {
    const saveBtn = document.getElementById('save-selected');
    if (!saveBtn) return;
    
    if (this.selectedColors.size === 0) {
      saveBtn.textContent = 'Save Selected Colors';
      saveBtn.disabled = true;
    } else {
      saveBtn.textContent = `Save ${this.selectedColors.size} Colors`;
      saveBtn.disabled = false;
    }
  }

  async saveColors() {
    if (this.selectedColors.size === 0) {
      this.showNotification('No colors selected');
      return;
    }

    const collection = {
      id: Date.now(),
      name: `Collection ${this.savedCollections.length + 1}`,
      colors: Array.from(this.selectedColors),
      timestamp: new Date().toISOString(),
      sourceUrl: await this.getCurrentUrl()
    };

    this.savedCollections.unshift(collection);
    await chrome.storage.local.set({ savedCollections: this.savedCollections });
    
    this.renderSavedCollections();
    this.showNotification(`Saved ${this.selectedColors.size} colors to collection`);
    
    this.selectedColors.clear();
    this.updateSaveButton();
    this.renderColors();
  }

  toggleSelectAll() {
    const selectAllBtn = document.getElementById('select-all');
    const isAllSelected = this.selectedColors.size === this.extractedData.colors.length;
    
    if (isAllSelected) {
      this.selectedColors.clear();
      selectAllBtn.textContent = 'Select All';
      this.showNotification('Deselected all colors');
    } else {
      this.extractedData.colors.forEach(color => {
        this.selectedColors.add(color);
      });
      selectAllBtn.textContent = 'Unselect All';
      this.showNotification(`Selected ${this.selectedColors.size} colors`);
    }
    
    this.updateColorSelections();
    this.updateButtonStates();
  }

  updateColorSelections() {
    const colorSwatches = document.querySelectorAll('.color-swatch');
    colorSwatches.forEach(swatch => {
      const color = swatch.dataset.color;
      if (this.selectedColors.has(color)) {
        swatch.classList.add('selected');
      } else {
        swatch.classList.remove('selected');
      }
    });
  }

  copyAllColors() {
    if (this.extractedData.colors.length === 0) {
      this.showNotification('No colors to copy');
      return;
    }
    
    const colorsText = this.extractedData.colors.join(', ');
    this.copyToClipboard(colorsText);
    this.showNotification(`Copied ${this.extractedData.colors.length} colors`);
  }

  copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    this.showNotification(`Copied: ${text}`);
  }).catch(err => {
    console.error('Failed to copy:', err);
    this.showNotification('Failed to copy');
  });
}

  exportColors() {
    const colorsArray = Array.from(this.selectedColors);
    const css = colorsArray.map(color => `  --color-${color.replace('#', '')}: ${color};`).join('\n');
    const exportData = `:root {\n${css}\n}`;
    
    const blob = new Blob([exportData], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'colors.css';
    a.click();
    URL.revokeObjectURL(url);
  }

  async saveToRecentScans(data) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const hostname = new URL(tab.url).hostname;
      
      const existingIndex = this.recentScans.findIndex(scan => scan.url === hostname);
      
      const scan = {
        id: Date.now(),
        url: hostname,
        fullUrl: tab.url,
        timestamp: new Date().toISOString(),
        colors: data.colors,
        fonts: data.fonts,
        colorCount: data.colors.length,
        fontCount: data.fonts.fonts.length,
        elementCount: data.elementCount,
        scanCount: existingIndex >= 0 ? this.recentScans[existingIndex].scanCount + 1 : 1
      };

      if (existingIndex >= 0) {
        this.recentScans[existingIndex] = scan;
      } else {
        this.recentScans.unshift(scan);
      }
      
      this.recentScans = this.recentScans.slice(0, 10);
      
      await chrome.storage.local.set({ recentScans: this.recentScans });
      this.renderRecentScans();
    } catch (error) {
      console.error('Error saving recent scan:', error);
    }
  }

  async loadRecentScans() {
    try {
      const result = await chrome.storage.local.get(['recentScans']);
      this.recentScans = result.recentScans || [];
    } catch (error) {
      console.error('Error loading recent scans:', error);
      this.recentScans = [];
    }
  }

  renderRecentScans() {
    const container = document.getElementById('recent-list');
    
    if (this.recentScans.length === 0) {
      container.innerHTML = `
        <div class="text-xs" style="color: #595c5e; text-align: center; padding: 20px; border: 2px dashed #e5e9eb; border-radius: 12px;">
          No recent scans. Press scan to begin.
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    this.recentScans.slice(0, 5).forEach(scan => {
      const scanDiv = document.createElement('div');
      scanDiv.className = 'font-card shadow-sm';
      scanDiv.style.cursor = 'pointer';
      
      const timeAgo = this.getTimeAgo(scan.timestamp);
      const colorDots = scan.colors.slice(0, 4).map(color => 
        `<div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${color}"></div>`
      ).join('');

      scanDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span class="text-sm font-bold">${scan.url}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="text-xs" style="color: #595c5e;">${timeAgo}</span>
            <span class="material-symbols-outlined" style="font-size: 16px; color: #0050d4;">arrow_forward</span>
          </div>
        </div>
        <div style="display: flex; gap: 4px; margin-bottom: 8px;">
          ${colorDots}
        </div>
        <div class="text-xs" style="color: #595c5e;">
          ${scan.colorCount} colors · ${scan.fontCount} fonts
        </div>
      `;

      scanDiv.addEventListener('click', () => {
        this.loadScan(scan);
      });

      container.appendChild(scanDiv);
    });
  }

  getTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  async loadScan(scan) {
    try {
      console.log('Loading scan:', scan);
      
      this.extractedData = {
        colors: scan.colors || [],
        fonts: scan.fonts || { fonts: [], typography: [] }
      };
      
      console.log('Extracted data after load:', this.extractedData);
      
      this.selectedColors.clear();
      this.pickedColors.clear();
      
      this.renderColors();
      this.renderFonts();
      this.updateButtonStates();
      
      if (scan.colors && scan.colors.length > 0) {
        this.switchView('colors');
      } else if (scan.fonts && scan.fonts.fonts && scan.fonts.fonts.length > 0) {
        this.switchView('fonts');
      } else {
        this.switchView('scan');
      }
      
      this.showNotification(`Loaded ${scan.colors?.length || 0} colors from ${scan.url}`);
    } catch (error) {
      console.error('Error loading scan:', error);
      this.showNotification('Could not load scan data');
    }
  }

  async getCurrentUrl() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab ? new URL(tab.url).hostname : 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  }

  async clearRecentScans() {
    try {
      this.recentScans = [];
      await chrome.storage.local.set({ recentScans: [] });
      this.renderRecentScans();
      this.showNotification('Recent scans cleared');
    } catch (error) {
      console.error('Error clearing recent scans:', error);
    }
  }

  async loadSavedCollections() {
    try {
      const result = await chrome.storage.local.get(['savedCollections']);
      this.savedCollections = result.savedCollections || [];
    } catch (error) {
      console.error('Error loading saved collections:', error);
      this.savedCollections = [];
    }
  }

  renderSavedCollections() {
    const container = document.getElementById('saved-view');
    if (!container) return;

    if (this.savedCollections.length === 0) {
      container.innerHTML = `
        <div class="font-bold" style="margin-bottom: 16px;">Your Workspaces</div>
        <div style="border: 2px dashed #abadaf; padding: 30px; border-radius: 16px; text-align: center; opacity: 0.6;">
          <span class="material-symbols-outlined" style="font-size: 40px; margin-bottom: 8px; display: block;">folder_open</span>
          <div class="text-sm font-bold">No saved sets yet</div>
          <div class="text-xs">Save colors from your scans to see them here.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = '<div class="font-bold" style="margin-bottom: 16px;">Your Workspaces</div>';
    
    this.savedCollections.forEach(collection => {
      const collectionDiv = document.createElement('div');
      collectionDiv.className = 'font-card shadow-sm';
      collectionDiv.style.cursor = 'pointer';
      
      const colorSwatches = collection.colors.slice(0, 8).map(color => 
        `<div style="width: 20px; height: 20px; border-radius: 4px; background-color: ${color}; border: 1px solid rgba(0,0,0,0.1);"></div>`
      ).join('');
      
      const moreCount = collection.colors.length > 8 ? `+${collection.colors.length - 8}` : '';
      
      collectionDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div class="text-sm font-bold">${collection.name}</div>
          <div class="text-xs" style="color: #595c5e;">${new Date(collection.timestamp).toLocaleDateString()}</div>
        </div>
        <div style="display: flex; gap: 4px; margin-bottom: 8px; align-items: center;">
          ${colorSwatches}
          ${moreCount ? `<span class="text-xs" style="color: #595c5e;">${moreCount}</span>` : ''}
        </div>
        <div class="text-xs" style="color: #595c5e;">
          ${collection.colors.length} colors${collection.sourceUrl ? ` · ${collection.sourceUrl}` : ''}
        </div>
      `;

      collectionDiv.addEventListener('click', () => {
        this.loadCollection(collection);
      });

      container.appendChild(collectionDiv);
    });
  }

  loadCollection(collection) {
    try {
      this.extractedData = {
        colors: collection.colors,
        fonts: { fonts: [], typography: [] }
      };
      
      this.selectedColors.clear();
      this.pickedColors.clear();
      collection.colors.forEach(color => {
        this.selectedColors.add(color);
      });
      
      this.isLoadedCollection = true;
      this.loadedCollectionName = collection.name;
      
      this.renderColors();
      this.updateButtonStates();
      this.switchView('colors');
      
      this.showNotification(`Loaded collection: ${collection.name}`);
    } catch (error) {
      console.error('Error loading collection:', error);
      this.showNotification('Could not load collection');
    }
  }

  showSettings() {
    this.showNotification('Settings coming soon!');
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #0050d4;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 12px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  enableEyedropper() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.scripting && tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            async function startEyeDropper() {
              if (!window.EyeDropper) {
                console.log('EyeDropper API not supported, falling back to DOM approach');
                startDOMPicker();
                return;
              }

              try {
                const eyeDropper = new EyeDropper();
                const result = await eyeDropper.open();
                console.log('EyeDropper color:', result.sRGBHex);
                
                chrome.runtime.sendMessage({ 
                  action: "colorPicked", 
                  color: result.sRGBHex 
                });
              } catch (e) {
                console.log('EyeDropper cancelled or failed:', e);
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
                  console.log('DOM picker color:', bgColor);
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
              
              console.log('DOM color picker started - click to pick, ESC to cancel');
            }

            startEyeDropper();
          }
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('Script injection error:', chrome.runtime.lastError);
            this.showNotification('Could not activate color picker');
          }
        });
      } else {
        this.showNotification('Could not activate color picker');
      }
    });
  }

  handleColorPicked(color) {
    this.pickedColors.add(color);
    this.selectedColors.add(color);
    this.showNotification(`Color picked: ${color}`);
    
    if (!this.extractedData.colors.includes(color)) {
      this.extractedData.colors.push(color);
    }
    
    if (this.currentView !== 'colors') {
      this.switchView('colors');
    }
    
    this.renderColors();
    this.updateButtonStates();
  }

  updateButtonStates() {
    const hasData = this.extractedData.colors.length > 0 || this.extractedData.fonts?.fonts?.length > 0;
    
    document.querySelectorAll('.nav-item').forEach(item => {
      const view = item.dataset.target;
      if (view === 'colors' || view === 'fonts') {
        item.style.opacity = hasData ? '1' : '0.5';
        item.style.pointerEvents = hasData ? 'auto' : 'none';
      }
    });
    
    const saveBtn = document.getElementById('save-selected');
    const exportBtn = document.getElementById('export-css');
    const copyAllBtn = document.getElementById('copy-all');
    const selectAllBtn = document.getElementById('select-all');
    
    if (this.isLoadedCollection) {
      if (saveBtn) saveBtn.style.display = 'none';
      if (exportBtn) exportBtn.style.display = 'none';
      if (selectAllBtn) selectAllBtn.style.display = 'none';
      if (copyAllBtn) {
        copyAllBtn.style.display = 'block';
        copyAllBtn.disabled = this.extractedData.colors.length === 0;
      }
    } else {
      if (saveBtn) {
        saveBtn.style.display = 'block';
        saveBtn.disabled = this.selectedColors.size === 0;
        saveBtn.textContent = this.selectedColors.size === 0 ? 'Save Selected Colors' : `Save ${this.selectedColors.size} Colors`;
      }
      if (exportBtn) {
        exportBtn.style.display = 'block';
        exportBtn.disabled = this.selectedColors.size === 0;
      }
      if (selectAllBtn) {
        selectAllBtn.style.display = 'block';
        selectAllBtn.disabled = this.extractedData.colors.length === 0;
        const isAllSelected = this.selectedColors.size === this.extractedData.colors.length && this.extractedData.colors.length > 0;
        selectAllBtn.textContent = isAllSelected ? 'Unselect All' : 'Select All';
      }
      if (copyAllBtn) copyAllBtn.style.display = 'none';
    }
  }
}

const app = new QolorsCollector();

document.addEventListener('DOMContentLoaded', () => {
  const scanView = document.getElementById('scan-view');
  if (scanView) {
    const eyedropperBtn = document.createElement('button');
    eyedropperBtn.innerHTML = `
      <span class="material-symbols-outlined">colorize</span>
      <span>Color Picker</span>
    `;
    eyedropperBtn.className = 'nav-item';
    eyedropperBtn.style.cssText = `
      position: fixed;
      top: 70px;
      right: 16px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 8px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 100;
    `;
    
    eyedropperBtn.addEventListener('click', () => {
      console.log('Eyedropper button clicked');
      app.enableEyedropper();
    });
    
    scanView.appendChild(eyedropperBtn);
  }
});
