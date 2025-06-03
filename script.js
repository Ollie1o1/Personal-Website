// ----------------------------------------------
// 1) THEME TOGGLE: toggle between dark ↔ light
// ----------------------------------------------
const themeCheckbox = document.querySelector('#theme-checkbox');
const savedTheme = localStorage.getItem('theme');

// On page load: if “light” was saved, add data-theme="light" and check the box
if (savedTheme === 'light') {
  document.body.setAttribute('data-theme', 'light');
  themeCheckbox.checked = true;
}

// Listen for toggle changes
themeCheckbox.addEventListener('change', () => {
  if (themeCheckbox.checked) {
    // User wants LIGHT mode
    document.body.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  } else {
    // User wants DARK mode
    document.body.removeAttribute('data-theme');
    localStorage.setItem('theme', 'dark');
  }
});



// ----------------------------------------------
// 2) SMOOTH SCROLL (unchanged)
// ----------------------------------------------
document.querySelectorAll('.nav-button').forEach(button => {
  button.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    document.querySelector(targetId).scrollIntoView({
      behavior: 'smooth'
    });
  });
});



// ----------------------------------------------
// 3) CONTACT FORM HANDLER (unchanged)
// ----------------------------------------------
const contactForm = document.querySelector('#contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Thank you for your message! I will get back to you soon.');
    this.reset();
  });
}



// ----------------------------------------------
// (Any future JS—projects, skills, etc. go here)
// ----------------------------------------------
