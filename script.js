// Theme toggle functionality
const themeToggle = document.querySelector('.theme-switch input');
const root = document.documentElement;

// Check for saved theme preference
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
    themeToggle.checked = true;
    applyDarkTheme();
}

// Theme toggle event listener
themeToggle.addEventListener('change', function() {
    if (this.checked) {
        applyDarkTheme();
        localStorage.setItem('theme', 'dark');
    } else {
        applyLightTheme();
        localStorage.setItem('theme', 'light');
    }
});

function applyDarkTheme() {
    root.style.setProperty('--light-color', '#2c3e50');
    root.style.setProperty('--dark-color', '#ecf0f1');
    root.style.setProperty('--primary-color', '#3498db');
    root.style.setProperty('--secondary-color', '#1a1a1a');
    document.body.setAttribute('data-theme', 'dark');
}

function applyLightTheme() {
    root.style.setProperty('--light-color', '#ecf0f1');
    root.style.setProperty('--dark-color', '#2c3e50');
    root.style.setProperty('--primary-color', '#3498db');
    root.style.setProperty('--secondary-color', '#2c3e50');
    document.body.removeAttribute('data-theme');
}

// Smooth scrolling for navigation buttons
document.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        document.querySelector(targetId).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Form submission handling
const contactForm = document.querySelector('#contact form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Thank you for your message! I will get back to you soon.');
        this.reset();
    });
}

// Future functionality for projects and skills
// This will be expanded as projects are added
function loadProjects(projects) {
    const projectGrid = document.querySelector('.project-grid');
    if (projectGrid) {
        projects.forEach(project => {
            const projectElement = document.createElement('div');
            projectElement.className = 'project-card';
            projectElement.innerHTML = `
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <a href="${project.link}" target="_blank">View Project</a>
            `;
            projectGrid.appendChild(projectElement);
        });
    }
}

// Future functionality for skills display
function loadSkills(skills) {
    const skillsContainer = document.querySelector('.skills-container');
    if (skillsContainer) {
        skills.forEach(skill => {
            const skillElement = document.createElement('div');
            skillElement.className = 'skill-item';
            skillElement.textContent = skill;
            skillsContainer.appendChild(skillElement);
        });
    }
}
