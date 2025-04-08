// Apply the selected font style on page load
function changeFont() {
    const selector = document.getElementById('font-select');
    const selectedOption = selector.options[selector.selectedIndex];
    const weight = selectedOption.getAttribute('data-weight');
    const style = selectedOption.getAttribute('data-style');
    
    document.body.style.fontFamily = "'Playfair Display', serif";
    document.body.style.fontWeight = weight;
    document.body.style.fontStyle = style;
    
    document.querySelectorAll('h1, h2, p, header, footer, .content').forEach(el => {
      el.style.fontFamily = "'Playfair Display', serif";
      el.style.fontWeight = weight;
      el.style.fontStyle = style;
    });
  
    // Save font choice to localStorage
    localStorage.setItem('selectedFont', JSON.stringify({ weight, style }));
  }
  
  // Apply the selected theme on page load
  function changeTheme() {
    const theme = document.getElementById('theme-select').value;
    const body = document.body;
  
    if (theme === 'dark') {
      body.classList.add('dark-mode');
      body.style.backgroundColor = '#111';
      body.style.color = '#eee';
    } else {
      body.classList.remove('dark-mode');
      body.style.backgroundColor = '#fff';
      body.style.color = '#333';
    }
  
    document.querySelectorAll('h1, h2, p, header, footer, .content').forEach(el => {
      el.style.color = theme === 'dark' ? '#eee' : '#333';
    });
  
    // Save theme choice to localStorage
    localStorage.setItem('selectedTheme', theme);
  }
  
  // On page load, apply saved settings (if any)
  window.onload = function() {
    const savedTheme = localStorage.getItem('selectedTheme');
    const savedFont = localStorage.getItem('selectedFont');
    
    // Apply saved theme
    if (savedTheme) {
      document.getElementById('theme-select').value = savedTheme;
      changeTheme(); // Apply the saved theme
    } else {
      document.getElementById('theme-select').value = 'dark'; // Set dark as default
      changeTheme(); // Apply dark theme by default
    }
  
    // Apply saved font
    if (savedFont) {
      const { weight, style } = JSON.parse(savedFont);
      const fontSelect = document.getElementById('font-select');
      fontSelect.value = weight === '700' && style === 'normal' ? 'bold' :
                        weight === '400' && style === 'italic' ? 'italic' : 
                        weight === '700' && style === 'italic' ? 'bolditalic' :
                        weight === '500' && style === 'normal' ? '500' :
                        weight === '500' && style === 'italic' ? '500italic' :
                        weight === '600' && style === 'normal' ? '600' :
                        weight === '600' && style === 'italic' ? '600italic' :
                        weight === '800' && style === 'normal' ? '800' :
                        weight === '800' && style === 'italic' ? '800italic' :
                        weight === '900' && style === 'normal' ? '900' :
                        weight === '900' && style === 'italic' ? '900italic' :
                        'normal'; // Default to regular
  
      changeFont(); // Apply the saved font
    }
  }
  