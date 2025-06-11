// Global variables
let currentUser = null;
let currentQuiz = null;
let currentQuestion = 0;
let quizTimer = null;
let userScore = 0;

// DOM elements
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const navAuth = document.querySelector('.nav-auth');

// Define sections that require authentication
const protectedSections = ['dictionary', 'quiz', 'coding', 'profile'];

const sampleTerms = [
];


const sampleQuizzes = {
    programming: [
        { question: "What does API stand for?", options: ["Application Programming Interface", "Advanced Programming Interface", "Application Process Interface", "Automated Programming Interface"], correct: 0 },
        { question: "Which of the following is NOT a programming paradigm?", options: ["Object-Oriented", "Functional", "Procedural", "Sequential"], correct: 3 },
        { question: "Which keyword is used to define a function in Python?", options: ["func", "def", "function", "define"], correct: 1 },
        { question: "Which of these is a compiled language?", options: ["Python", "Java", "JavaScript", "Ruby"], correct: 1 },
        { question: "What does HTML stand for?", options: ["HyperText Markup Language", "HyperTool Markup Language", "HyperText Machine Language", "None of the above"], correct: 0 },
        { question: "What symbol is used for comments in Python?", options: ["//", "<!-- -->", "#", "/* */"], correct: 2 },
        { question: "Which operator is used to compare values in JavaScript?", options: ["=", "==", "===", ":="], correct: 2 },
        { question: "Which of the following is not a loop structure?", options: ["for", "if", "while", "do-while"], correct: 1 },
        { question: "Which method converts JSON to a JavaScript object?", options: ["JSON.convert", "JSON.parse", "JSON.stringify", "parse.JSON"], correct: 1 },
        { question: "Which tag is used to define a hyperlink in HTML?", options: ["<a>", "<link>", "<href>", "<url>"], correct: 0 },
        { question: "Which company developed TypeScript?", options: ["Google", "Facebook", "Microsoft", "Apple"], correct: 2 },
        { question: "What is the file extension for JavaScript files?", options: [".js", ".java", ".py", ".script"], correct: 0 },
        { question: "Which framework is maintained by Facebook?", options: ["Angular", "Vue", "React", "Svelte"], correct: 2 },
        { question: "Which of these is a back-end framework?", options: ["Django", "React", "Bootstrap", "Tailwind"], correct: 0 },
        { question: "Which HTTP method is used to update a resource?", options: ["GET", "POST", "PUT", "DELETE"], correct: 2 }
    ],
    networking: [
        { question: "What does TCP stand for?", options: ["Transfer Control Protocol", "Transmission Control Protocol", "Transport Control Protocol", "Technical Control Protocol"], correct: 1 },
        { question: "Which protocol is used to assign IP addresses automatically?", options: ["DNS", "DHCP", "HTTP", "FTP"], correct: 1 },
        { question: "What is the default port for HTTP?", options: ["21", "22", "80", "443"], correct: 2 },
        { question: "Which layer of the OSI model handles routing?", options: ["Transport", "Network", "Data Link", "Session"], correct: 1 },
        { question: "Which device connects multiple networks together?", options: ["Hub", "Switch", "Router", "Modem"], correct: 2 },
        { question: "What does DNS do?", options: ["Transfers files", "Resolves domain names", "Encrypts data", "Manages emails"], correct: 1 },
        { question: "Which protocol is used for secure web communication?", options: ["HTTP", "HTTPS", "FTP", "SMTP"], correct: 1 },
        { question: "What does IP stand for?", options: ["Internet Protocol", "Internal Protocol", "Interface Protocol", "Intelligent Protocol"], correct: 0 },
        { question: "What is the loopback IP address?", options: ["192.168.1.1", "127.0.0.1", "10.0.0.1", "255.255.255.0"], correct: 1 },
        { question: "What does FTP stand for?", options: ["File Transfer Protocol", "Fast Transfer Protocol", "File Text Protocol", "File Transport Protocol"], correct: 0 },
        { question: "What layer is SSL in the OSI model?", options: ["Transport", "Session", "Presentation", "Application"], correct: 2 },
        { question: "What is a MAC address used for?", options: ["IP routing", "Network access control", "Unique hardware ID", "Data compression"], correct: 2 },
        { question: "Which command checks connectivity between two hosts?", options: ["ping", "trace", "whois", "ipconfig"], correct: 0 },
        { question: "Which port does HTTPS use?", options: ["443", "80", "21", "25"], correct: 0 },
        { question: "What protocol is used for sending email?", options: ["SMTP", "POP3", "IMAP", "FTP"], correct: 0 }
    ],
    cybersecurity: [
        { question: "What is the primary purpose of encryption?", options: ["Speed up data transfer", "Protect data confidentiality", "Reduce file size", "Improve network performance"], correct: 1 },
        { question: "What does SSL stand for?", options: ["Secure Sockets Layer", "Simple Security Layer", "System Security Layer", "Secure Signal Layer"], correct: 0 },
        { question: "What is a firewall used for?", options: ["Encrypt data", "Filter network traffic", "Increase bandwidth", "Host websites"], correct: 1 },
        { question: "What is phishing?", options: ["A type of encryption", "A way to hack a server", "A social engineering attack", "An antivirus technique"], correct: 2 },
        { question: "Which of these is a type of malware?", options: ["Virus", "Firewall", "Patch", "Antivirus"], correct: 0 },
        { question: "What is two-factor authentication?", options: ["Logging in twice", "Using two passwords", "An extra verification step", "Using fingerprint only"], correct: 2 },
        { question: "What does a VPN do?", options: ["Blocks websites", "Increases speed", "Creates secure connection", "Changes password"], correct: 2 },
        { question: "What is brute-force attack?", options: ["Trying all password combinations", "Phishing technique", "Installing malware", "Listening to network packets"], correct: 0 },
        { question: "What does antivirus software do?", options: ["Infect files", "Protect from malware", "Block USB ports", "Speed up downloads"], correct: 1 },
        { question: "What is ransomware?", options: ["Software patch", "Antivirus tool", "Malware that demands payment", "Firewall protocol"], correct: 2 },
        { question: "What is the goal of DoS attack?", options: ["Encrypt data", "Crash or overwhelm a system", "Steal credentials", "Change passwords"], correct: 1 },
        { question: "What is social engineering in cybersecurity?", options: ["Building firewalls", "Exploiting human psychology", "Using social media", "Encrypting databases"], correct: 1 },
        { question: "What is a keylogger?", options: ["Software for coding", "Tool to capture keystrokes", "App for updates", "Firewall type"], correct: 1 },
        { question: "What is a zero-day exploit?", options: ["An exploit known for 0 days", "Outdated virus", "Firewall method", "Backup tool"], correct: 0 },
        { question: "Which is an example of biometric authentication?", options: ["Password", "PIN", "Fingerprint", "Captcha"], correct: 2 }
    ]
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadUserProgress();
});

function initializeApp() {
    // Check if user is logged in (check localStorage for demo purposes)
    const storedUser = localStorage.getItem('techsphere_user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        updateUIForLoggedInUser();
    }
    
    // Initialize first section
    showSection('home');
}

function setupEventListeners() {
    // Navigation with authentication check
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('href').substring(1);
            
            // Check if section requires authentication
            if (protectedSections.includes(section)) {
                if (!currentUser) {
                    showNotification('Please login to access this section', 'warning');
                    showModal('loginModal');
                    return;
                }
            }
            
            showSection(section);
        });
    });

    // Modal controls
    if (loginBtn) {
        loginBtn.addEventListener('click', () => showModal('loginModal'));
    }
    if (registerBtn) {
        registerBtn.addEventListener('click', () => showModal('registerModal'));
    }
    
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });

    // Form submissions
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Dictionary search
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            if (!currentUser) {
                showNotification('Please login to use the dictionary', 'warning');
                showModal('loginModal');
                return;
            }
            searchDictionary();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (!currentUser) {
                    showNotification('Please login to use the dictionary', 'warning');
                    showModal('loginModal');
                    return;
                }
                searchDictionary();
            }
        });
    }

    // Category filters
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!currentUser) {
                showNotification('Please login to use the dictionary', 'warning');
                showModal('loginModal');
                return;
            }
            
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filterByCategory(e.target.dataset.category);
        });
    });
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('techsphere_user', JSON.stringify(currentUser));
            updateUIForLoggedInUser();
            hideModal('loginModal');
            showNotification('Login successful!', 'success');
        } else {
            showNotification(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        
        // Demo login for testing - remove in production
        if (email && password) {
            currentUser = { id: 1, name: email.split('@')[0], email: email };
            localStorage.setItem('techsphere_user', JSON.stringify(currentUser));
            updateUIForLoggedInUser();
            hideModal('loginModal');
            showNotification('Demo login successful!', 'success');
        } else {
            showNotification('Login failed. Please try again.', 'error');
        }
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification('Registration successful! Please login.', 'success');
            hideModal('registerModal');
            showModal('loginModal');
        } else {
            showNotification(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        
        // Demo registration for testing - remove in production
        if (name && email && password) {
            showNotification('Demo registration successful! Please login.', 'success');
            hideModal('registerModal');
            showModal('loginModal');
        } else {
            showNotification('Registration failed. Please try again.', 'error');
        }
    }
}

function updateUIForLoggedInUser() {
    if (navAuth) {
        navAuth.innerHTML = `
            <span class="user-name">Welcome, ${currentUser.name}!</span>
            <button class="btn-secondary" onclick="logout()">Logout</button>
        `;
    }
    
    // Update navigation to show user has access
    updateNavigationState();
}

function updateNavigationState() {
    // Update visual indicators if needed
    document.querySelectorAll('.nav-link').forEach(link => {
        const section = link.getAttribute('href').substring(1);
        if (protectedSections.includes(section)) {
            if (!currentUser) {
                link.classList.add('protected');
            } else {
                link.classList.remove('protected');
            }
        }
    });
}

function logout() {
    currentUser = null;
    localStorage.removeItem('techsphere_user');
    
    if (navAuth) {
        navAuth.innerHTML = `
            <button class="btn-secondary" id="loginBtn">Login</button>
            <button class="btn-primary" id="registerBtn">Register</button>
        `;
        
        // Re-attach event listeners
        const newLoginBtn = document.getElementById('loginBtn');
        const newRegisterBtn = document.getElementById('registerBtn');
        
        if (newLoginBtn) {
            newLoginBtn.addEventListener('click', () => showModal('loginModal'));
        }
        if (newRegisterBtn) {
            newRegisterBtn.addEventListener('click', () => showModal('registerModal'));
        }
    }
    
    // Redirect to home if user is on a protected section
    const currentSection = document.querySelector('.section.active');
    if (currentSection && protectedSections.includes(currentSection.id)) {
        showSection('home');
    }
    
    updateNavigationState();
    showNotification('Logged out successfully', 'info');
}

// UI Helper functions
function showSection(sectionId) {
    // Check authentication for protected sections
    if (protectedSections.includes(sectionId) && !currentUser) {
        showNotification('Please login to access this section', 'warning');
        showModal('loginModal');
        return;
    }
    
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + sectionId) {
            link.classList.add('active');
        }
    });
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}


// Fixed Dictionary Search Function
async function searchDictionary() {
    if (!currentUser) {
        showNotification('Please login to use the dictionary', 'warning');
        showModal('loginModal');
        return;
    }

    const searchInput = document.getElementById('searchInput');
    if (!searchInput) {
        console.error('Search input element not found');
        return;
    }

    const searchTerm = searchInput.value.trim();
    console.log('Searching for term:', searchTerm); // Debug log

    if (!searchTerm) {
        showNotification('Please enter a search term', 'warning');
        return;
    }

    // Show loading state
    const resultsContainer = document.getElementById('dictionaryResults');
    if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="loading">Searching... Please wait.</div>';
    }

    try {
        // Make API call to your backend
        const response = await fetch(`/api/dictionary/search?term=${encodeURIComponent(searchTerm)}`);
        console.log('API Response status:', response.status); // Debug log
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response data:', data); // Debug log

        if (data.results && data.results.length > 0) {
            displaySearchResults(data.results);
            showNotification(`Found ${data.results.length} result(s)`, 'success');
        } else {
            // No results from API
            displaySearchResults([]);
            showNotification('No results found for this term', 'info');
        }
    } catch (error) {
        console.error('Search error:', error);
        
        // Fallback: Show error message and suggest trying again
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="error-message">
                    <h3>Search Error</h3>
                    <p>Unable to search at this time. This could be because:</p>
                    <ul>
                        <li>The server is not running</li>
                        <li>The API endpoint is not configured</li>
                        <li>Network connection issue</li>
                    </ul>
                    <p>Please check the console for more details or contact support.</p>
                </div>
            `;
        }
        showNotification('Search failed. Please try again later.', 'error');
    }
}

// Enhanced display function with better error handling
function displaySearchResults(results) {
    const resultsContainer = document.getElementById('dictionaryResults');
    if (!resultsContainer) {
        console.error('Results container not found');
        return;
    }
    
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <h3>No Terms Found</h3>
                <p>We couldn't find any definitions for your search term.</p>
                <p>Try:</p>
                <ul>
                    <li>Checking your spelling</li>
                    <li>Using simpler terms</li>
                    <li>Searching for related concepts</li>
                </ul>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = results.map(term => `
        <div class="term-card">
            <div class="term-header">
                <h3 class="term-title">${escapeHtml(term.term)}</h3>
                <span class="term-category">${escapeHtml(term.category)}</span>
            </div>
            <p class="term-definition">${escapeHtml(term.definition)}</p>
            ${term.examples && term.examples.length > 0 ? `
                <div class="term-examples">
                    <strong>Examples:</strong>
                    <ul>
                        ${term.examples.map(example => `<li>${escapeHtml(example)}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            ${term.related_terms && term.related_terms.length > 0 ? `
                <div class="related-terms">
                    <strong>Related Terms:</strong>
                    <div class="related-tags">
                        ${term.related_terms.map(relTerm => `<span class="related-tag">${escapeHtml(relTerm)}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            ${term.source ? `<div class="term-source">Source: ${escapeHtml(term.source)}</div>` : ''}
        </div>
    `).join('');
}

// // Helper function to escape HTML and prevent XSS
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Test function to check if API is working
async function testDictionaryAPI() {
    try {
        const response = await fetch('/api/dictionary/search?term=test');
        const data = await response.json();
        console.log('API Test Result:', data);
        return true;
    } catch (error) {
        console.error('API Test Failed:', error);
        return false;
    }
}

// Enhanced search with retry mechanism
async function searchDictionaryWithRetry(maxRetries = 2) {
    if (!currentUser) {
        showNotification('Please login to use the dictionary', 'warning');
        showModal('loginModal');
        return;
    }

    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
        showNotification('Please enter a search term', 'warning');
        return;
    }

    let retries = 0;
    while (retries <= maxRetries) {
        try {
            const response = await fetch(`/api/dictionary/search?term=${encodeURIComponent(searchTerm)}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    displaySearchResults(data.results);
                    return;
                }
            }
            
            if (retries === maxRetries) {
                displaySearchResults([]);
                showNotification('No results found', 'info');
            }
            break;
            
        } catch (error) {
            retries++;
            if (retries > maxRetries) {
                console.error('Search failed after retries:', error);
                showNotification('Search failed. Please try again.', 'error');
                displaySearchResults([]);
            } else {
                console.log(`Retry ${retries}/${maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            }
        }
    }
}

// Debug function to check all components
function debugDictionarySearch() {
    console.log('=== Dictionary Search Debug ===');
    console.log('Current user:', currentUser);
    console.log('Search input element:', document.getElementById('searchInput'));
    console.log('Results container:', document.getElementById('dictionaryResults'));
    console.log('Search button:', document.getElementById('searchBtn'));
    
    // Test API connectivity
    testDictionaryAPI().then(result => {
        console.log('API connectivity test:', result ? 'PASSED' : 'FAILED');
    });
}

// Leaderboard functionality
let currentLeaderboardPage = 1;
const leaderboardPageSize = 10;
let currentLeaderboardFilter = 'overall';

// Initialize leaderboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadLeaderboard();
    
    // Add event listener for filter change
    document.getElementById('leaderboardFilter').addEventListener('change', function() {
        currentLeaderboardFilter = this.value;
        currentLeaderboardPage = 1;
        loadLeaderboard();
    });
});

// Load leaderboard data from server
async function loadLeaderboard() {
    const loadingElement = document.getElementById('leaderboardLoading');
    const listElement = document.getElementById('leaderboardList');
    
    // Show loading spinner
    loadingElement.style.display = 'flex';
    
    try {
        const response = await fetch('/api/leaderboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filter: currentLeaderboardFilter,
                page: currentLeaderboardPage,
                pageSize: leaderboardPageSize
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to load leaderboard');
        }
        
        const data = await response.json();
        displayLeaderboard(data);
        
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        displayLeaderboardError();
    } finally {
        loadingElement.style.display = 'none';
    }
}

// Display leaderboard data
function displayLeaderboard(data) {
    const listElement = document.getElementById('leaderboardList');
    const { users, totalPages, currentPage } = data;
    
    // Clear existing content
    listElement.innerHTML = '';
    
    if (users.length === 0) {
        listElement.innerHTML = '<div class="no-data">No users found</div>';
        return;
    }
    
    // Create leaderboard items
    users.forEach((user, index) => {
        const globalRank = (currentPage - 1) * leaderboardPageSize + index + 1;
        const leaderboardItem = createLeaderboardItem(user, globalRank);
        listElement.appendChild(leaderboardItem);
    });
    
    // Update pagination
    updatePagination(currentPage, totalPages);
}

// Create individual leaderboard item
function createLeaderboardItem(user, rank) {
    const item = document.createElement('div');
    item.className = 'leaderboard-item';
    
    // Add special styling for top 3
    if (rank <= 3) {
        item.classList.add(`rank-${rank}`);
    }
    
    // Determine score based on filter
    let score = user.totalScore;
    let scoreLabel = 'Total';
    
    switch (currentLeaderboardFilter) {
        case 'quiz':
            score = user.quizScore || 0;
            scoreLabel = 'Quiz';
            break;
        case 'coding':
            score = user.codingScore || 0;
            scoreLabel = 'Coding';
            break;
        case 'monthly':
            score = user.monthlyScore || 0;
            scoreLabel = 'Monthly';
            break;
    }
    
    item.innerHTML = `
        <div class="rank-container">
            <span class="rank">${rank}</span>
            ${rank <= 3 ? `<i class="fas fa-trophy rank-icon"></i>` : ''}
        </div>
        <div class="user-info">
            <div class="user-avatar">
                <img src="${user.avatar || '/static/default-avatar.png'}" alt="${user.name}" 
                     onerror="this.src='/static/default-avatar.png'">
            </div>
            <div class="user-details">
                <span class="name">${user.name}</span>
                <span class="stats">
                    ${user.quizzesCompleted || 0} quizzes • 
                    ${user.challengesSolved || 0} challenges • 
                    ${user.termsLearned || 0} terms
                </span>
            </div>
        </div>
        <div class="score-container">
            <span class="score">${score}</span>
            <span class="score-label">${scoreLabel}</span>
        </div>
    `;
    
    return item;
}

// Update pagination controls
function updatePagination(currentPage, totalPages) {
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
}

// Handle page change
function changePage(direction) {
    const newPage = currentLeaderboardPage + direction;
    const totalPages = parseInt(document.getElementById('totalPages').textContent);
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentLeaderboardPage = newPage;
        loadLeaderboard();
    }
}

// Refresh leaderboard
function refreshLeaderboard() {
    currentLeaderboardPage = 1;
    loadLeaderboard();
}

// Display error message
function displayLeaderboardError() {
    const listElement = document.getElementById('leaderboardList');
    listElement.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Failed to load leaderboard. Please try again.</p>
            <button class="btn-primary" onclick="loadLeaderboard()">Retry</button>
        </div>
    `;
}

// Quiz functions
function startQuiz(category) {
    if (!currentUser) {
        showNotification('Please login to take quizzes', 'warning');
        showModal('loginModal');
        return;
    }

    const quizQuestions = sampleQuizzes[category] || sampleQuizzes.programming;
    currentQuiz = {
        category,
        questions: quizQuestions,
        currentQuestion: 0,
        score: 0,
        answers: []
    };
    
    const quizContainer = document.getElementById('quizContainer');
    const quizCategories = document.querySelector('.quiz-categories');
    const leaderboard = document.querySelector('.leaderboard');
    
    if (quizContainer) quizContainer.style.display = 'block';
    if (quizCategories) quizCategories.style.display = 'none';
    if (leaderboard) leaderboard.style.display = 'none';
    
    loadQuestion();
    startTimer();
}

function loadQuestion() {
    if (!currentQuiz || !currentQuiz.questions) return;
    
    const question = currentQuiz.questions[currentQuiz.currentQuestion];
    const questionText = document.getElementById('questionText');
    const currentQuestionEl = document.getElementById('currentQuestion');
    const totalQuestionsEl = document.getElementById('totalQuestions');
    
    if (questionText) questionText.textContent = question.question;
    if (currentQuestionEl) currentQuestionEl.textContent = currentQuiz.currentQuestion + 1;
    if (totalQuestionsEl) totalQuestionsEl.textContent = currentQuiz.questions.length;
    
    const options = document.querySelectorAll('.option-btn');
    options.forEach((btn, index) => {
        btn.textContent = question.options[index];
        btn.classList.remove('selected', 'correct', 'incorrect');
        btn.disabled = false;
    });
    
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) nextBtn.disabled = true;
    
    updateProgressBar();
}

function selectAnswer(answerIndex) {
    if (!currentQuiz) return;
    
    const question = currentQuiz.questions[currentQuiz.currentQuestion];
    const options = document.querySelectorAll('.option-btn');
    
    // Clear previous selections
    options.forEach(btn => btn.classList.remove('selected'));
    
    // Mark selected answer
    if (options[answerIndex]) {
        options[answerIndex].classList.add('selected');
    }
    
    // Store answer
    currentQuiz.answers[currentQuiz.currentQuestion] = answerIndex;
    
    // Enable next button
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) nextBtn.disabled = false;
    
    // Stop timer
    clearInterval(quizTimer);
}

function nextQuestion() {
    if (!currentQuiz) return;
    
    const question = currentQuiz.questions[currentQuiz.currentQuestion];
    const userAnswer = currentQuiz.answers[currentQuiz.currentQuestion];
    
    // Check if answer is correct
    if (userAnswer === question.correct) {
        currentQuiz.score++;
    }
    
    currentQuiz.currentQuestion++;
    
    if (currentQuiz.currentQuestion >= currentQuiz.questions.length) {
        endQuiz();
    } else {
        loadQuestion();
        startTimer();
    }
}

function startTimer() {
    let timeLeft = 30;
    const timerEl = document.getElementById('timer');
    if (timerEl) timerEl.textContent = timeLeft;
    
    quizTimer = setInterval(() => {
        timeLeft--;
        if (timerEl) timerEl.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(quizTimer);
            // Auto-select wrong answer if no answer selected
            if (currentQuiz && currentQuiz.answers[currentQuiz.currentQuestion] === undefined) {
                currentQuiz.answers[currentQuiz.currentQuestion] = -1; // Wrong answer
            }
            nextQuestion();
        }
    }, 1000);
}

function updateProgressBar() {
    if (!currentQuiz) return;
    
    const progress = ((currentQuiz.currentQuestion + 1) / currentQuiz.questions.length) * 100;
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = progress + '%';
    }
}

function endQuiz() {
    clearInterval(quizTimer);
    
    if (!currentQuiz) return;
    
    const percentage = Math.round((currentQuiz.score / currentQuiz.questions.length) * 100);
    const quizContainer = document.getElementById('quizContainer');
    
    if (quizContainer) {
        quizContainer.innerHTML = `
            <div class="quiz-results">
                <h2>Quiz Complete!</h2>
                <div class="score-display">
                    <div class="score-circle">
                        <span class="score-percentage">${percentage}%</span>
                    </div>
                    <p>You scored ${currentQuiz.score} out of ${currentQuiz.questions.length} questions correctly!</p>
                </div>
                <div class="result-actions">
                    <button class="btn-primary" onclick="resetQuiz()">Take Another Quiz</button>
                    <button class="btn-secondary" onclick="showSection('home')">Back to Home</button>
                </div>
            </div>
        `;
    }
    
    // Save quiz result
    saveQuizResult(currentQuiz.category, currentQuiz.score, currentQuiz.questions.length);
}

function resetQuiz() {
    const quizContainer = document.getElementById('quizContainer');
    const quizCategories = document.querySelector('.quiz-categories');
    const leaderboard = document.querySelector('.leaderboard');
    
    if (quizContainer) quizContainer.style.display = 'none';
    if (quizCategories) quizCategories.style.display = 'grid';
    if (leaderboard) leaderboard.style.display = 'block';
    
    currentQuiz = null;
}

 let currentLanguage = 'python';
        let currentChallenge = null;

        const challenges = {
            array_reverse: {
                title: "Array Reverse",
                difficulty: "easy",
                description: "Complete the function to reverse an array without using built-in reverse methods.",
                example: "Input: [1, 2, 3, 4, 5]\nOutput: [5, 4, 3, 2, 1]",
                solved_count: 234,
                rating: 4.5,
                category: "Arrays",
                test_cases: [
                    { input: [1, 2, 3, 4, 5], expected: [5, 4, 3, 2, 1] },
                    { input: [1], expected: [1] },
                    { input: [], expected: [] },
                    { input: [1, 2], expected: [2, 1] }
                ],
                starter_code: {
                    python: "def reverse_array(arr):\n    # Your code here\n    pass\n\n# Test your function\nprint(reverse_array([1, 2, 3, 4, 5]))",
                    javascript: "function reverseArray(arr) {\n    // Your code here\n    return arr;\n}\n\n// Test your function\nconsole.log(reverseArray([1, 2, 3, 4, 5]));",
                    java: "public static int[] reverseArray(int[] arr) {\n    // Your code here\n    return arr;\n}\n\n// Test your function\nSystem.out.println(Arrays.toString(reverseArray(new int[]{1, 2, 3, 4, 5})));",
                    cpp: "#include <vector>\n#include <iostream>\nusing namespace std;\n\nvector<int> reverseArray(vector<int> arr) {\n    // Your code here\n    return arr;\n}\n\nint main() {\n    vector<int> result = reverseArray({1, 2, 3, 4, 5});\n    for(int x : result) cout << x << \" \";\n    return 0;\n}",
                    csharp: "using System;\n\npublic static int[] ReverseArray(int[] arr) {\n    // Your code here\n    return arr;\n}\n\n// Test your function\nConsole.WriteLine(string.Join(\", \", ReverseArray(new int[]{1, 2, 3, 4, 5})));",
                    go: "package main\nimport \"fmt\"\n\nfunc reverseArray(arr []int) []int {\n    // Your code here\n    return arr\n}\n\nfunc main() {\n    fmt.Println(reverseArray([]int{1, 2, 3, 4, 5}))\n}"
                }
            },
            palindrome_check: {
                title: "Palindrome Checker",
                difficulty: "easy",
                description: "Implement a function to check if a string is a valid palindrome (ignoring spaces and case).",
                example: "Input: 'A man a plan a canal Panama'\nOutput: True",
                solved_count: 189,
                rating: 4.3,
                category: "Strings",
                test_cases: [
                    { input: "racecar", expected: true },
                    { input: "A man a plan a canal Panama", expected: true },
                    { input: "race a car", expected: false },
                    { input: "", expected: true }
                ],
                starter_code: {
                    python: "def is_palindrome(s):\n    # Your code here\n    pass\n\n# Test your function\nprint(is_palindrome('racecar'))",
                    javascript: "function isPalindrome(s) {\n    // Your code here\n    return false;\n}\n\n// Test your function\nconsole.log(isPalindrome('racecar'));",
                    java: "public static boolean isPalindrome(String s) {\n    // Your code here\n    return false;\n}\n\n// Test your function\nSystem.out.println(isPalindrome(\"racecar\"));",
                    cpp: "#include <string>\n#include <iostream>\nusing namespace std;\n\nbool isPalindrome(string s) {\n    // Your code here\n    return false;\n}\n\nint main() {\n    cout << isPalindrome(\"racecar\") << endl;\n    return 0;\n}",
                    csharp: "using System;\n\npublic static bool IsPalindrome(string s) {\n    // Your code here\n    return false;\n}\n\n// Test your function\nConsole.WriteLine(IsPalindrome(\"racecar\"));",
                    go: "package main\nimport \"fmt\"\n\nfunc isPalindrome(s string) bool {\n    // Your code here\n    return false\n}\n\nfunc main() {\n    fmt.Println(isPalindrome(\"racecar\"))\n}"
                }
            },
            two_sum: {
                title: "Two Sum Problem",
                difficulty: "medium",
                description: "Given an array of integers and a target sum, return the indices of two numbers that add up to the target.",
                example: "Input: nums = [2, 7, 11, 15], target = 9\nOutput: [0, 1] (because nums[0] + nums[1] = 2 + 7 = 9)",
                solved_count: 156,
                rating: 4.6,
                category: "Arrays",
                test_cases: [
                    { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
                    { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] },
                    { input: { nums: [3, 3], target: 6 }, expected: [0, 1] }
                ],
                starter_code: {
                    python: "def two_sum(nums, target):\n    # Your code here\n    pass\n\n# Test your function\nprint(two_sum([2, 7, 11, 15], 9))",
                    javascript: "function twoSum(nums, target) {\n    // Your code here\n    return [];\n}\n\n// Test your function\nconsole.log(twoSum([2, 7, 11, 15], 9));",
                    java: "public static int[] twoSum(int[] nums, int target) {\n    // Your code here\n    return new int[]{};\n}\n\n// Test your function\nSystem.out.println(Arrays.toString(twoSum(new int[]{2, 7, 11, 15}, 9)));",
                    cpp: "#include <vector>\n#include <iostream>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    // Your code here\n    return {};\n}\n\nint main() {\n    vector<int> nums = {2, 7, 11, 15};\n    vector<int> result = twoSum(nums, 9);\n    for(int x : result) cout << x << \" \";\n    return 0;\n}",
                    csharp: "using System;\n\npublic static int[] TwoSum(int[] nums, int target) {\n    // Your code here\n    return new int[]{};\n}\n\n// Test your function\nConsole.WriteLine(string.Join(\", \", TwoSum(new int[]{2, 7, 11, 15}, 9)));",
                    go: "package main\nimport \"fmt\"\n\nfunc twoSum(nums []int, target int) []int {\n    // Your code here\n    return []int{}\n}\n\nfunc main() {\n    fmt.Println(twoSum([]int{2, 7, 11, 15}, 9))\n}"
                }
            },
            binary_search: {
                title: "Binary Search",
                difficulty: "medium",
                description: "Implement binary search algorithm to find the index of a target value in a sorted array.",
                example: "Input: arr = [1, 3, 5, 7, 9, 11], target = 7\nOutput: 3",
                solved_count: 98,
                rating: 4.4,
                category: "Algorithms",
                test_cases: [
                    { input: { arr: [1, 3, 5, 7, 9, 11], target: 7 }, expected: 3 },
                    { input: { arr: [1, 3, 5, 7, 9, 11], target: 1 }, expected: 0 },
                    { input: { arr: [1, 3, 5, 7, 9, 11], target: 12 }, expected: -1 }
                ],
                starter_code: {
                    python: "def binary_search(arr, target):\n    # Your code here\n    pass\n\n# Test your function\nprint(binary_search([1, 3, 5, 7, 9, 11], 7))",
                    javascript: "function binarySearch(arr, target) {\n    // Your code here\n    return -1;\n}\n\n// Test your function\nconsole.log(binarySearch([1, 3, 5, 7, 9, 11], 7));",
                    java: "public static int binarySearch(int[] arr, int target) {\n    // Your code here\n    return -1;\n}\n\n// Test your function\nSystem.out.println(binarySearch(new int[]{1, 3, 5, 7, 9, 11}, 7));",
                    cpp: "#include <vector>\n#include <iostream>\nusing namespace std;\n\nint binarySearch(vector<int>& arr, int target) {\n    // Your code here\n    return -1;\n}\n\nint main() {\n    vector<int> arr = {1, 3, 5, 7, 9, 11};\n    cout << binarySearch(arr, 7) << endl;\n    return 0;\n}",
                    csharp: "using System;\n\npublic static int BinarySearch(int[] arr, int target) {\n    // Your code here\n    return -1;\n}\n\n// Test your function\nConsole.WriteLine(BinarySearch(new int[]{1, 3, 5, 7, 9, 11}, 7));",
                    go: "package main\nimport \"fmt\"\n\nfunc binarySearch(arr []int, target int) int {\n    // Your code here\n    return -1\n}\n\nfunc main() {\n    fmt.Println(binarySearch([]int{1, 3, 5, 7, 9, 11}, 7))\n}"
                }
            },
            fibonacci: {
                title: "Fibonacci Sequence",
                difficulty: "hard",
                description: "Generate the nth Fibonacci number using dynamic programming for optimal performance.",
                example: "Input: n = 10\nOutput: 55 (F(10) = 55)",
                solved_count: 67,
                rating: 4.7,
                category: "Dynamic Programming",
                test_cases: [
                    { input: 0, expected: 0 },
                    { input: 1, expected: 1 },
                    { input: 10, expected: 55 },
                    { input: 15, expected: 610 }
                ],
                starter_code: {
                    python: "def fibonacci(n):\n    # Your code here (use dynamic programming)\n    pass\n\n# Test your function\nprint(fibonacci(10))",
                    javascript: "function fibonacci(n) {\n    // Your code here (use dynamic programming)\n    return 0;\n}\n\n// Test your function\nconsole.log(fibonacci(10));",
                    java: "public static long fibonacci(int n) {\n    // Your code here (use dynamic programming)\n    return 0;\n}\n\n// Test your function\nSystem.out.println(fibonacci(10));",
                    cpp: "#include <iostream>\nusing namespace std;\n\nlong long fibonacci(int n) {\n    // Your code here (use dynamic programming)\n    return 0;\n}\n\nint main() {\n    cout << fibonacci(10) << endl;\n    return 0;\n}",
                    csharp: "using System;\n\npublic static long Fibonacci(int n) {\n    // Your code here (use dynamic programming)\n    return 0;\n}\n\n// Test your function\nConsole.WriteLine(Fibonacci(10));",
                    go: "package main\nimport \"fmt\"\n\nfunc fibonacci(n int) int64 {\n    // Your code here (use dynamic programming)\n    return 0\n}\n\nfunc main() {\n    fmt.Println(fibonacci(10))\n}"
                }
            },
            merge_intervals: {
                title: "Merge Intervals",
                difficulty: "expert",
                description: "Given a collection of intervals, merge all overlapping intervals and return the result.",
                example: "Input: [[1,3],[2,6],[8,10],[15,18]]\nOutput: [[1,6],[8,10],[15,18]]",
                solved_count: 34,
                rating: 4.9,
                category: "Arrays",
                test_cases: [
                    { input: [[1,3],[2,6],[8,10],[15,18]], expected: [[1,6],[8,10],[15,18]] },
                    { input: [[1,4],[4,5]], expected: [[1,5]] },
                    { input: [[1,4],[0,4]], expected: [[0,4]] }
                ],
                starter_code: {
                    python: "def merge_intervals(intervals):\n    # Your code here\n    pass\n\n# Test your function\nprint(merge_intervals([[1,3],[2,6],[8,10],[15,18]]))",
                    javascript: "function mergeIntervals(intervals) {\n    // Your code here\n    return [];\n}\n\n// Test your function\nconsole.log(mergeIntervals([[1,3],[2,6],[8,10],[15,18]]));",
                    java: "public static int[][] mergeIntervals(int[][] intervals) {\n    // Your code here\n    return new int[][]{};\n}\n\n// Test your function\nSystem.out.println(Arrays.deepToString(mergeIntervals(new int[][]{{1,3},{2,6},{8,10},{15,18}})));",
                    cpp: "#include <vector>\n#include <iostream>\nusing namespace std;\n\nvector<vector<int>> mergeIntervals(vector<vector<int>>& intervals) {\n    // Your code here\n    return {};\n}\n\nint main() {\n    vector<vector<int>> intervals = {{1,3},{2,6},{8,10},{15,18}};\n    auto result = mergeIntervals(intervals);\n    // Print result\n    return 0;\n}",
                    csharp: "using System;\n\npublic static int[][] MergeIntervals(int[][] intervals) {\n    // Your code here\n    return new int[][]{};\n}\n\n// Test your function",
                    go: "package main\nimport \"fmt\"\n\nfunc mergeIntervals(intervals [][]int) [][]int {\n    // Your code here\n    return [][]int{}\n}\n\nfunc main() {\n    fmt.Println(mergeIntervals([][]int{{1,3},{2,6},{8,10},{15,18}}))\n}"
                }
            }
        };

        function selectLanguage(language) {
            currentLanguage = language;
            
            // Update active button
            document.querySelectorAll('.language-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Update selected language display
            const selectedLangElement = document.getElementById('selectedLang');
            if (selectedLangElement) {
                const langNames = {
                    python: 'Python',
                    javascript: 'JavaScript',
                    java: 'Java',
                    cpp: 'C++',
                    csharp: 'C#',
                    go: 'Go'
                };
                selectedLangElement.textContent = langNames[language];
            }
            
            // Update code editor if a challenge is selected
            if (currentChallenge) {
                const codeEditor = document.getElementById('codeEditor');
                if (codeEditor) {
                    codeEditor.value = challenges[currentChallenge].starter_code[currentLanguage];
                }
            }
            
            renderChallenges();
        }

        function renderChallenges() {
            const challengesGrid = document.getElementById('challengesGrid');
            challengesGrid.innerHTML = '';
            
            Object.keys(challenges).forEach(challengeId => {
                const challenge = challenges[challengeId];
                const challengeCard = document.createElement('div');
                challengeCard.className = 'challenge-card';
                challengeCard.innerHTML = `
                    <div class="challenge-header">
                        <h3>${challenge.title}</h3>
                        <span class="difficulty-badge ${challenge.difficulty}">${challenge.difficulty}</span>
                    </div>
                    <p>${challenge.description}</p>
                    <div class="challenge-stats">
                        <span><i class="fas fa-users"></i> ${challenge.solved_count} solved</span>
                        <span><i class="fas fa-star"></i> ${challenge.rating}/5</span>
                        <span><i class="fas fa-tag"></i> ${challenge.category}</span>
                    </div>
                    <button class="btn-primary" onclick="startCodingChallenge('${challengeId}')">Start Challenge</button>
                `;
                challengesGrid.appendChild(challengeCard);
            });
        }

        function startCodingChallenge(challengeId) {
            if (!currentUser) {
                alert('Please login to access coding challenges');
                return;
            }

            currentChallenge = challengeId;
            const challenge = challenges[challengeId];
            
            // Update UI elements
            document.getElementById('challengeTitle').textContent = challenge.title;
            document.getElementById('problemDescription').textContent = challenge.description;
            document.getElementById('problemExample').textContent = challenge.example;
            document.getElementById('codeEditor').value = challenge.starter_code[currentLanguage];
            document.getElementById('codeOutput').textContent = 'Click "Run Code" to see the output';
            document.getElementById('testResults').innerHTML = '';
            
            // Update test cases display
            const testCasesDiv = document.getElementById('testCases');
            testCasesDiv.innerHTML = challenge.test_cases.map((testCase, index) => 
                `<div><strong>Test ${index + 1}:</strong> Input: ${JSON.stringify(testCase.input)} → Expected: ${JSON.stringify(testCase.expected)}</div>`
            ).join('');
            
            // Show editor and hide challenges
            document.getElementById('languageSelector').style.display = 'none';
            document.getElementById('challengesGrid').style.display = 'none';
            document.getElementById('codingEditor').style.display = 'block';
        }

        function goBackToChallenges() {
            document.getElementById('languageSelector').style.display = 'block';
            document.getElementById('challengesGrid').style.display = 'grid';
            document.getElementById('codingEditor').style.display = 'none';
            currentChallenge = null;
        }

        function resetCode() {
            if (!currentChallenge) return;
            
            const challenge = challenges[currentChallenge];
            document.getElementById('codeEditor').value = challenge.starter_code[currentLanguage];
            document.getElementById('codeOutput').textContent = 'Click "Run Code" to see the output';
            document.getElementById('testResults').innerHTML = '';
        }

        async function runCode() {
            if (!currentUser) {
                alert('Please login to run code');
                return;
            }
            
            const codeEditor = document.getElementById('codeEditor');
            const codeOutput = document.getElementById('codeOutput');
            
            if (!codeEditor || !codeOutput) return;
            
            const code = codeEditor.value.trim();
            if (!code) {
                codeOutput.textContent = 'Error: Please write some code first';
                return;
            }
            
            codeOutput.textContent = 'Running code...';
            
            try {
                // Simulate code execution based on language
                let output = '';
                
                if (currentLanguage === 'python') {
                    output = await simulatePythonExecution(code);
                } else if (currentLanguage === 'javascript') {
                    output = await simulateJavaScriptExecution(code);
                } else {
                    output = await simulateGenericExecution(code, currentLanguage);
                }
                
                codeOutput.textContent = output;
            } catch (error) {
                codeOutput.textContent = `Error: ${error.message}`;
            }
        }

        async function simulatePythonExecution(code) {
            // Basic Python simulation
            try {
                // Simple regex-based simulation for demo purposes
                if (code.includes('print(')) {
                    const printMatch = code.match(/print\(([^)]+)\)/);
                    if (printMatch) {
                        // Simple evaluation simulation
                        if (currentChallenge === 'array_reverse') {
                            return '[5, 4, 3, 2, 1]';
                        } else if (currentChallenge === 'palindrome_check') {
                            return 'True';
                        } else if (currentChallenge === 'two_sum') {
                            return '[0, 1]';
                        } else if (currentChallenge === 'binary_search') {
                            return '3';
                        } else if (currentChallenge === 'fibonacci') {
                            return '55';
                        } else if (currentChallenge === 'merge_intervals') {
                            return '[[1, 6], [8, 10], [15, 18]]';
                        }
                    }
                }
                return 'Code executed successfully (simulated)';
            } catch (error) {
                throw new Error('Syntax error in Python code');
            }
        }

        async function simulateJavaScriptExecution(code) {
            try {
                // Create a safe execution context
                const safeCode = code.replace(/console\.log/g, 'return');
                
                if (currentChallenge === 'array_reverse') {
                    return '[5, 4, 3, 2, 1]';
                } else if (currentChallenge === 'palindrome_check') {
                    return 'true';
                } else if (currentChallenge === 'two_sum') {
                    return '[0, 1]';
                } else if (currentChallenge === 'binary_search') {
                    return '3';
                } else if (currentChallenge === 'fibonacci') {
                    return '55';
                } else if (currentChallenge === 'merge_intervals') {
                    return '[[1, 6], [8, 10], [15, 18]]';
                }
                
                return 'Code executed successfully (simulated)';
            } catch (error) {
                throw new Error('Syntax error in JavaScript code');
            }
        }

        async function simulateGenericExecution(code, language) {
            // Generic simulation for other languages
            const outputs = {
                java: 'Java code executed successfully (simulated)',
                cpp: 'C++ code executed successfully (simulated)',
                csharp: 'C# code executed successfully (simulated)',
                go: 'Go code executed successfully (simulated)'
            };
            
            return outputs[language] || 'Code executed successfully (simulated)';
        }

        async function submitCode() {
            if (!currentUser) {
                alert('Please login to submit code');
                return;
            }
            
            if (!currentChallenge) {
                alert('Please select a challenge first');
                return;
            }
            
            const codeEditor = document.getElementById('codeEditor');
            const testResults = document.getElementById('testResults');
            
            if (!codeEditor) return;
            
            const code = codeEditor.value.trim();
            if (!code) {
                alert('Please write some code before submitting');
                return;
            }
            
            testResults.innerHTML = '<p>Running tests...</p>';
            
            try {
                const challenge = challenges[currentChallenge];
                const testCases = challenge.test_cases;
                
                // Simulate running test cases
                let passedTests = 0;
                let testResultsHTML = '<h4><i class="fas fa-flask"></i> Test Results:</h4>';
                
                for (let i = 0; i < testCases.length; i++) {
                    const testCase = testCases[i];
                    
                    // Simulate test execution
                    const passed = await simulateTestCase(code, testCase, currentChallenge);
                    
                    if (passed) {
                        passedTests++;
                        testResultsHTML += `
                            <div class="test-case passed">
                                <strong>Test ${i + 1}: PASSED</strong><br>
                                Input: ${JSON.stringify(testCase.input)}<br>
                                Expected: ${JSON.stringify(testCase.expected)}<br>
                                Your output: ${JSON.stringify(testCase.expected)}
                            </div>
                        `;
                    } else {
                        testResultsHTML += `
                            <div class="test-case failed">
                                <strong>Test ${i + 1}: FAILED</strong><br>
                                Input: ${JSON.stringify(testCase.input)}<br>
                                Expected: ${JSON.stringify(testCase.expected)}<br>
                                Your output: Wrong answer
                            </div>
                        `;
                    }
                }
                
                const success = passedTests === testCases.length;
                
                testResultsHTML += `
                    <div style="margin-top: 15px; padding: 15px; border-radius: 8px; ${success ? 'background: #d4edda; color: #155724;' : 'background: #f8d7da; color: #721c24;'}">
                        <strong>Result: ${passedTests}/${testCases.length} tests passed</strong>
                        ${success ? '<br><i class="fas fa-check-circle"></i> Congratulations! All tests passed!' : '<br><i class="fas fa-times-circle"></i> Some tests failed. Keep trying!'}
                    </div>
                `;
                
                testResults.innerHTML = testResultsHTML;
                
                // Simulate saving to backend
                const submissionData = {
                    user_id: currentUser.id,
                    challenge_id: currentChallenge,
                    code: code,
                    language: currentLanguage,
                    passed_tests: passedTests,
                    total_tests: testCases.length,
                    success: success,
                    submitted_at: new Date().toISOString()
                };
                
                // In a real app, you would send this to your backend
                console.log('Submission data:', submissionData);
                
                if (success) {
                    // Update solved count (simulation)
                    challenges[currentChallenge].solved_count++;
                    
                    // Show success notification
                    setTimeout(() => {
                        alert('🎉 Congratulations! Challenge completed successfully!');
                    }, 1000);
                }
                
            } catch (error) {
                testResults.innerHTML = `<p style="color: red;">Error running tests: ${error.message}</p>`;
            }
        }

        async function simulateTestCase(code, testCase, challengeId) {
            // Simulate test case execution
            // In a real application, you would execute the code with the test input
            // and compare the output with the expected result
            
            // For demo purposes, we'll simulate some logic
            const hasBasicImplementation = code.length > 50 && !code.includes('pass') && !code.includes('// Your code here');
            
            // Simulate that 80% of attempts with basic implementation pass
            if (hasBasicImplementation) {
                return Math.random() > 0.2; // 80% chance of passing
            }
            
            return false;
        }

        function showNotification(message, type) {
            // Simple notification system
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: bold;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            
            if (type === 'success') {
                notification.style.background = '#28a745';
            } else if (type === 'error') {
                notification.style.background = '#dc3545';
            } else {
                notification.style.background = '#ffc107';
                notification.style.color = '#000';
            }
            
            notification.textContent = message;
            document.body.appendChild(notification);
            
            // Fade in
            setTimeout(() => {
                notification.style.opacity = '1';
            }, 100);
            
            // Remove after 3 seconds
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }

        // Initialize the page
        document.addEventListener('DOMContentLoaded', function() {
            renderChallenges();
            
            // Add some keyboard shortcuts
            document.addEventListener('keydown', function(e) {
                if (e.ctrlKey || e.metaKey) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        runCode();
                    } else if (e.key === 's') {
                        e.preventDefault();
                        submitCode();
                    }
                }
            });
        });

// Progress tracking functions
function saveQuizResult(category, score, total) {
    if (!currentUser) return;
    
    const result = {
        category,
        score,
        total,
        percentage: Math.round((score / total) * 100),
        date: new Date().toISOString()
    };
    
    // Save to localStorage for demo (in production, save to backend)
    let quizHistory = JSON.parse(localStorage.getItem('quiz_history')) || [];
    quizHistory.push(result);
    localStorage.setItem('quiz_history', JSON.stringify(quizHistory));
    
    updateProgressStats();
}

function loadUserProgress() {
    if (!currentUser) return;
    
    // Load from localStorage for demo
    const quizHistory = JSON.parse(localStorage.getItem('quiz_history')) || [];
    updateProgressStats(quizHistory);
}

function updateProgressStats(quizHistory = []) {
    // Update stats cards
    const statsCards = document.querySelectorAll('.profile-stats .stat-card h3');
    if (statsCards.length >= 4) {
        statsCards[1].textContent = quizHistory.length; // Quizzes completed
        const totalScore = quizHistory.reduce((sum, quiz) => sum + quiz.score, 0);
        statsCards[3].textContent = totalScore; // Total score
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/profile', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('idToken')
      }
    });

    if (!response.ok) throw new Error('Failed to fetch profile');

    const data = await response.json();
    const stats = data.stats || {};

    document.getElementById('termsLearned').textContent = stats.terms_learned || 0;
    document.getElementById('quizzesCompleted').textContent = stats.quizzes_completed || 0;
    document.getElementById('challengesSolved').textContent = stats.challenges_solved || 0;
    document.getElementById('totalScore').textContent = stats.total_score || 0;
    document.getElementById('rank').textContent = data.rank || 'N/A';

  } catch (err) {
    console.error('Error loading profile stats:', err);
  }
});


// Add some CSS for notifications
const notificationStyles = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    font-weight: bold;
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
}

.notification.show {
    transform: translateX(0);
}

.notification.success {
    background-color: #28a745;
}

.notification.error {
    background-color: #dc3545;
}

.notification.warning {
    background-color: #ffc107;
    color: #212529;
}

.notification.info {
    background-color: #17a2b8;
}

.no-results {
    text-align: center;
    color: #666;
    font-style: italic;
    padding: 20px;
}

.quiz-results {
    text-align: center;
    padding: 40px 20px;
}

.score-display {
    margin: 30px 0;
}

.score-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
}

.score-percentage {
    font-size: 24px;
    font-weight: bold;
    color: white;
}

.result-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 30px;
}

.term-examples {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #eee;
    font-size: 14px;
    color: #666;
}

.user-name {
    color: white;
    margin-right: 15px;
}

.nav-link.protected {
    opacity: 0.6;
    position: relative;
}

.nav-link.protected::after {
    content: "🔒";
    font-size: 0.8em;
    margin-left: 5px;
}
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);