// Apply the selected font style on page load
function changeFont() {
  const weight = '400'; // Regular weight
  const style = 'normal'; // Regular style

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
  const theme = 'dark'; // Always dark theme
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
  
  // Apply saved theme (but default to dark)
  if (!savedTheme) {
    changeTheme(); // Apply dark theme by default
  }

  // Apply saved font (but default to regular)
  if (!savedFont) {
    changeFont(); // Apply default font style
  }
}
