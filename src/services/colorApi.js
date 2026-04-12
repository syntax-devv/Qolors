// Color naming service with enhanced color names
const colorNames = {
  // Reds
  '#FF0000': 'Red',
  '#DC143C': 'Crimson',
  '#B22222': 'Fire Brick',
  '#8B0000': 'Dark Red',
  '#FF6B6B': 'Coral Red',
  '#FF4757': 'Pomegranate',
  '#EE5A6F': 'Rose Red',
  '#E74C3C': 'Alizarin',
  
  // Oranges
  '#FFA500': 'Orange',
  '#FF8C00': 'Dark Orange',
  '#FF6347': 'Tomato',
  '#FF7F50': 'Coral',
  '#FFA07A': 'Light Salmon',
  '#FF7043': 'Burnt Orange',
  '#FF9800': 'Tangerine',
  '#FF5722': 'Deep Orange',
  
  // Yellows
  '#FFFF00': 'Yellow',
  '#FFD700': 'Gold',
  '#FFFFE0': 'Light Yellow',
  '#F0E68C': 'Khaki',
  '#FFEB3B': 'Bright Yellow',
  '#FFC107': 'Amber',
  '#FFD54F': 'Goldenrod',
  '#FFF59D': 'Pastel Yellow',
  
  // Greens
  '#008000': 'Green',
  '#228B22': 'Forest Green',
  '#00FF00': 'Lime',
  '#32CD32': 'Lime Green',
  '#90EE90': 'Light Green',
  '#00FF7F': 'Spring Green',
  '#4CAF50': 'Material Green',
  '#2ECC71': 'Emerald',
  '#27AE60': 'Nephritis',
  '#16A085': 'Green Sea',
  
  // Blues
  '#0000FF': 'Blue',
  '#000080': 'Navy',
  '#4169E1': 'Royal Blue',
  '#1E90FF': 'Dodger Blue',
  '#00BFFF': 'Deep Sky Blue',
  '#87CEEB': 'Sky Blue',
  '#3498DB': 'Peter River',
  '#2980B9': 'Belize Hole',
  '#5DADE2': 'Sky Blue',
  
  // Purples
  '#800080': 'Purple',
  '#9370DB': 'Medium Purple',
  '#8A2BE2': 'Blue Violet',
  '#9B59B6': 'Amethyst',
  '#8E44AD': 'Wisteria',
  '#BF55EC': 'Medium Purple',
  '#DDA0DD': 'Plum',
  '#EE82EE': 'Violet',
  '#4A148C': 'Deep Purple',
  '#6A1B9A': 'Purple Heart',
  '#7B1FA2': 'Medium Purple',
  '#8E24AA': 'Purple Mountain Majesty',
  '#9C27B0': 'Purple',
  '#AB47BC': 'Light Purple',
  '#BA68C8': 'Lavender',
  '#CE93D8': 'Thistle',
  '#E1BEE7': 'Lavender Blush',
  '#F3E5F5': 'Lavender Mist',
  '#663399': 'Rebecca Purple',
  '#483D8B': 'Dark Slate Blue',
  '#6B46C1': 'Royal Purple',
  
  // Pinks
  '#FFC0CB': 'Baby Pink',
  '#FF69B4': 'Hot Pink',
  '#FF1493': 'Deep Pink',
  '#C71585': 'Medium Violet Red',
  '#DB7093': 'Pale Violet Red',
  '#FFB6C1': 'Light Pink',
  '#F8BBD0': 'Pink Rose',
  
  // Browns
  '#A52A2A': 'Brown',
  '#8B4513': 'Saddle Brown',
  '#D2691E': 'Chocolate',
  '#CD853F': 'Peru',
  '#DEB887': 'Burlywood',
  '#F4A460': 'Sandy Brown',
  '#D2B48C': 'Tan',
  '#BCAAA4': 'Light Brown',
  
  // Grays
  '#808080': 'Gray',
  '#A9A9A9': 'Dark Gray',
  '#D3D3D3': 'Light Gray',
  '#696969': 'Dim Gray',
  '#7F8C8D': 'Asbestos',
  '#95A5A6': 'Concrete',
  '#BDC3C7': 'Silver',
  '#ECF0F1': 'Clouds',
  
  // Blacks and Whites
  '#000000': 'Black',
  '#FFFFFF': 'White',
  '#FFFAFA': 'Snow',
  '#F5F5F5': 'White Smoke',
  '#2C3E50': 'Charcoal Blue',
  '#34495E': 'Wet Asphalt',
};

// Function to find the closest color name
const findClosestColor = (hex) => {
  const color = hex.toUpperCase();
  
  // Direct match
  if (colorNames[color]) {
    return colorNames[color];
  }
  
  // Find closest match using color distance
  let closestColor = null;
  let minDistance = Infinity;
  
  Object.keys(colorNames).forEach(knownHex => {
    const distance = getColorDistance(color, knownHex);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = colorNames[knownHex];
    }
  });
  
  return closestColor || 'Unknown Color';
};

// Calculate color distance between two hex colors
const getColorDistance = (hex1, hex2) => {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  
  const rDiff = rgb1.r - rgb2.r;
  const gDiff = rgb1.g - rgb2.g;
  const bDiff = rgb1.b - rgb2.b;
  
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
};

// Convert hex to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Enhanced color naming function using The Color API
export const getColorName = async (hex) => {
  try {
    const response = await fetch(`https://www.thecolorapi.com/id?hex=${hex.replace('#', '')}`);
    const data = await response.json();
    
    if (data.name && data.name.value) {
      return data.name.value;
    }
    
    // Fallback to our local color matching if API fails
    return findClosestColor(hex);
  } catch (error) {
    // Fallback to our local color matching if API fails
    return findClosestColor(hex);
  }
};

// Fallback to local color naming for better coverage
export const getFallbackColorName = (hex) => {
  return findClosestColor(hex);
};
