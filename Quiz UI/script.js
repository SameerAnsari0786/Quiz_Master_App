// Configuration Spring Boot API
const API_BASE_URL = 'http://localhost:8080'; 

// Category mapping from database
const categoryMapping = {
    'java': 'Java',
    'javascript': 'JavaScript', 
    'cpp': 'C++',
    'dbms': 'DBMS'
};

// Application State
let currentQuiz = {
    topic: '',
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: {},
    timeRemaining: 1200, // 20 minutes in seconds
    timer: null
};

// Navigation Functions
function showSection(sectionName) {
    // Hide all sections
    const sections = ['home', 'quizzes', 'quiz-interface', 'results', 'about', 'contact', 'loading'];
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            element.style.display = 'none';
            element.classList.remove('active');
        }
    });

    // Show the requested section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active', 'fade-in');
    }

    // Update navigation active state
    updateActiveNavLink(sectionName);
}

function updateActiveNavLink(activePage) {
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        link.style.color = 'white';
    });
    
    // Map sections to navigation links
    const pageMap = {
        'home': 0,
        'quizzes': 1,
        'about': 2,
        'contact': 3
    };
    
    if (pageMap[activePage] !== undefined) {
        navLinks[pageMap[activePage]].classList.add('active');
        navLinks[pageMap[activePage]].style.color = '#ffd700';
    }
}

// Quiz Functions
function startQuiz(topic) {
    currentQuiz.topic = topic;
    currentQuiz.currentQuestionIndex = 0;
    currentQuiz.userAnswers = {};
    currentQuiz.timeRemaining = 1200; // Reset timer

    // Show loading
    showSection('loading');

    // Simulate API call delay
    setTimeout(() => {
        loadQuizQuestions(topic);
    }, 1500);
}

function loadQuizQuestions(topic) {
    // Call Spring Boot API
    fetchQuizQuestions(topic)
        .then(questions => {
            if (questions && questions.length > 0) {
                // Transform the questions to match  frontend format
                currentQuiz.questions = transformQuestionsFromAPI(questions);
                
                // Initialize quiz interface
                initializeQuizInterface();
                showSection('quiz-interface');
                startTimer();
            } else {
                alert('No questions available for this topic. Please try another quiz.');
                showSection('quizzes');
            }
        })
        .catch(error => {
            console.error('Error loading quiz:', error);
            alert('Failed to load quiz questions. Please check your connection and try again.');
            showSection('quizzes');
        });
}

// Transform questions  API format to frontend format
function transformQuestionsFromAPI(apiQuestions) {
    return apiQuestions.map(q => {
        const options = [q.optionA, q.optionB, q.optionC, q.optionD];
        
        // Find the correct answer index (A=0, B=1, C=2, D=3)
        let correctAnswerIndex = 0;
        switch(q.rightAnswer.toUpperCase()) {
            case 'A': correctAnswerIndex = 0; break;
            case 'B': correctAnswerIndex = 1; break;
            case 'C': correctAnswerIndex = 2; break;
            case 'D': correctAnswerIndex = 3; break;
            default:
                // If rightAnswer is the actual text, find its index
                correctAnswerIndex = options.findIndex(option => 
                    option.toLowerCase() === q.rightAnswer.toLowerCase()
                );
                if (correctAnswerIndex === -1) correctAnswerIndex = 0;
        }

        return {
            id: q.id,
            question: q.questionTitle,
            options: options,
            correctAnswer: correctAnswerIndex,
            difficulty: q.difficultyLevel,
            category: q.category
        };
    });
}

function initializeQuizInterface() {
    const topicNames = {
        'java': 'Java Programming',
        'javascript': 'JavaScript Fundamentals',
        'cpp': 'C++ Programming',
        'dbms': 'Database Management System'
    };

    document.getElementById('quiz-topic').textContent = topicNames[currentQuiz.topic] || currentQuiz.topic;
    displayQuestion();
    updateProgressBar();
}

function displayQuestion() {
    const question = currentQuiz.questions[currentQuiz.currentQuestionIndex];
    if (!question) return;

    const questionNumber = currentQuiz.currentQuestionIndex + 1;
    const totalQuestions = currentQuiz.questions.length;

    document.getElementById('question-number').textContent = `Question ${questionNumber} of ${totalQuestions}`;
    document.getElementById('question-text').textContent = question.question;
    document.getElementById('progress-text').textContent = `Question ${questionNumber} of ${totalQuestions}`;

    // Display options
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.onclick = () => selectOption(index);

        const optionLabel = document.createElement('div');
        optionLabel.className = 'option-label';
        optionLabel.textContent = String.fromCharCode(65 + index); // A, B, C, D

        const optionText = document.createElement('span');
        optionText.textContent = option;

        optionElement.appendChild(optionLabel);
        optionElement.appendChild(optionText);
        optionsContainer.appendChild(optionElement);

        // Add slide-in animation
        setTimeout(() => {
            optionElement.classList.add('slide-in');
        }, index * 100);
    });

    // Restore selected answer if exists
    const savedAnswer = currentQuiz.userAnswers[question.id];
    if (savedAnswer !== undefined) {
        selectOption(savedAnswer, false);
    }

    updateNavigationButtons();
}

function selectOption(optionIndex, animate = true) {
    const options = document.querySelectorAll('.option');
    options.forEach(option => option.classList.remove('selected'));
    
    if (options[optionIndex]) {
        options[optionIndex].classList.add('selected');
        if (animate) {
            options[optionIndex].style.transform = 'scale(1.02)';
            setTimeout(() => {
                options[optionIndex].style.transform = 'scale(1)';
            }, 150);
        }
    }

    // Save answer
    const currentQuestion = currentQuiz.questions[currentQuiz.currentQuestionIndex];
    currentQuiz.userAnswers[currentQuestion.id] = optionIndex;

    // Enable next button
    document.getElementById('next-btn').disabled = false;
}

function nextQuestion() {
    if (currentQuiz.currentQuestionIndex < currentQuiz.questions.length - 1) {
        currentQuiz.currentQuestionIndex++;
        displayQuestion();
        updateProgressBar();
    } else {
        finishQuiz();
    }
}

function previousQuestion() {
    if (currentQuiz.currentQuestionIndex > 0) {
        currentQuiz.currentQuestionIndex--;
        displayQuestion();
        updateProgressBar();
    }
}

function updateProgressBar() {
    const progress = ((currentQuiz.currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    prevBtn.disabled = currentQuiz.currentQuestionIndex === 0;
    
    const currentQuestion = currentQuiz.questions[currentQuiz.currentQuestionIndex];
    const hasAnswer = currentQuiz.userAnswers[currentQuestion.id] !== undefined;
    nextBtn.disabled = !hasAnswer;

    // Update button text for last question
    if (currentQuiz.currentQuestionIndex === currentQuiz.questions.length - 1) {
        nextBtn.textContent = 'Finish Quiz';
    } else {
        nextBtn.textContent = 'Next Question';
    }
}

function startTimer() {
    if (currentQuiz.timer) {
        clearInterval(currentQuiz.timer);
    }

    currentQuiz.timer = setInterval(() => {
        currentQuiz.timeRemaining--;
        updateTimerDisplay();

        if (currentQuiz.timeRemaining <= 0) {
            clearInterval(currentQuiz.timer);
            finishQuiz();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(currentQuiz.timeRemaining / 60);
    const seconds = currentQuiz.timeRemaining % 60;
    const timerElement = document.getElementById('timer');
    
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Add warning color when time is running low
    if (currentQuiz.timeRemaining <= 300) { // 5 minutes
        timerElement.style.background = '#ff6b6b';
    } else if (currentQuiz.timeRemaining <= 600) { // 10 minutes
        timerElement.style.background = '#ffa726';
    }
}

function finishQuiz() {
    if (currentQuiz.timer) {
        clearInterval(currentQuiz.timer);
    }

    calculateResults();
    showSection('results');
}

function calculateResults() {
    let correctAnswers = 0;
    let totalQuestions = currentQuiz.questions.length;

    currentQuiz.questions.forEach(question => {
        const userAnswer = currentQuiz.userAnswers[question.id];
        if (userAnswer === question.correctAnswer) {
            correctAnswers++;
        }
    });

    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const incorrectAnswers = totalQuestions - correctAnswers;
    const timeSpent = 1200 - currentQuiz.timeRemaining; // Time spent in seconds

    // Update results display
    document.getElementById('score-display').textContent = `${correctAnswers}/${totalQuestions}`;
    document.getElementById('correct-answers').textContent = correctAnswers;
    document.getElementById('incorrect-answers').textContent = incorrectAnswers;
    document.getElementById('percentage').textContent = `${percentage}%`;

    // Update results icon and title based on performance
    const resultsIcon = document.getElementById('results-icon');
    const resultsTitle = document.getElementById('results-title');

    if (percentage >= 80) {
        resultsIcon.innerHTML = '<i class="fas fa-trophy" style="color: #ffd700;"></i>';
        resultsTitle.textContent = 'Excellent Work!';
        resultsTitle.style.color = '#4caf50';
    } else if (percentage >= 60) {
        resultsIcon.innerHTML = '<i class="fas fa-medal" style="color: #ff9800;"></i>';
        resultsTitle.textContent = 'Good Job!';
        resultsTitle.style.color = '#ff9800';
    } else {
        resultsIcon.innerHTML = '<i class="fas fa-redo" style="color: #f44336;"></i>';
        resultsTitle.textContent = 'Keep Practicing!';
        resultsTitle.style.color = '#f44336';
    }

    // Submit results to backend (optional)
    const results = {
        topic: currentQuiz.topic,
        totalQuestions: totalQuestions,
        correctAnswers: correctAnswers,
        incorrectAnswers: incorrectAnswers,
        percentage: percentage,
        timeSpent: timeSpent,
        userAnswers: currentQuiz.userAnswers
    };

    submitQuizResults(results).catch(error => {
        console.log('Could not submit results to server:', error);
        // Continue anyway as this is not critical
    });
}

function retakeQuiz() {
    startQuiz(currentQuiz.topic);
}

// API Integration Functions
async function fetchQuizQuestions(topic) {
    try {
        const category = categoryMapping[topic] || topic;
        console.log(`Fetching questions for category: ${category}`);
        
        const response = await fetch(`${API_BASE_URL}/question/category/${category}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const questions = await response.json();
        console.log('Fetched questions:', questions);
        return questions;
    } catch (error) {
        console.error('Error fetching questions:', error);
        throw error;
    }
}

async function fetchAllQuestions() {
    try {
        const response = await fetch(`${API_BASE_URL}/question/all`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching all questions:', error);
        throw error;
    }
}

async function fetchQuestionCount() {
    try {
        const response = await fetch(`${API_BASE_URL}/question/totalCount`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching question count:', error);
        return 500; // fallback value
    }
}

async function submitQuizResults(results) {
    try {
        // You can create a results endpoint in your backend if needed
        const payload = {
            topic: results.topic,
            totalQuestions: results.totalQuestions,
            correctAnswers: results.correctAnswers,
            incorrectAnswers: results.incorrectAnswers,
            percentage: results.percentage,
            timeSpent: results.timeSpent,
            userAnswers: results.userAnswers,
            timestamp: new Date().toISOString()
        };

        console.log('Quiz results to submit:', payload);
        
        // If you create a results submission endpoint, uncomment below:
        /*
        const response = await fetch(`${API_BASE_URL}/quiz/submit-results`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit results');
        }
        
        return await response.json();
        */
        
        // For now, just log the results
        return { success: true, message: 'Results logged successfully' };
    } catch (error) {
        console.error('Error submitting results:', error);
        throw error;
    }
}

// Utility Functions
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    showSection('home');
    
    // Load real question count from  API
    fetchQuestionCount().then(count => {
        const questionCountElements = document.querySelectorAll('.stat-number');
        if (questionCountElements.length > 0) {
            questionCountElements[0].textContent = `${count}+`;
        }
    }).catch(error => {
        console.log('Could not fetch question count:', error);
    });

    // Add keyboard navigation
    document.addEventListener('keydown', function(event) {
        if (document.getElementById('quiz-interface').style.display === 'block') {
            switch(event.key) {
                case 'ArrowLeft':
                    if (!document.getElementById('prev-btn').disabled) {
                        previousQuestion();
                    }
                    break;
                case 'ArrowRight':
                    if (!document.getElementById('next-btn').disabled) {
                        nextQuestion();
                    }
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                    const optionIndex = parseInt(event.key) - 1;
                    const options = document.querySelectorAll('.option');
                    if (options[optionIndex]) {
                        selectOption(optionIndex);
                    }
                    break;
            }
        }
    });

    // Add smooth scrolling for better UX
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add warning before leaving during quiz
    window.addEventListener('beforeunload', function(event) {
        if (document.getElementById('quiz-interface').style.display === 'block') {
            event.preventDefault();
            event.returnValue = '';
            return 'Are you sure you want to leave? Your quiz progress will be lost.';
        }
    });
});

// Mobile menu toggle (for future mobile optimization)
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('mobile-active');
}

// Search functionality (for future implementation)
function searchQuizzes(query) {
    // Implementation for searching through available quizzes
    console.log('Searching for:', query);
}

// Theme toggle (for future dark mode implementation)
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}

// Analytics tracking (for future implementation)
function trackQuizStart(topic) {
    // Implementation for tracking quiz starts
    console.log('Quiz started:', topic);
}

function trackQuizComplete(topic, score) {
    // Implementation for tracking quiz completions
    console.log('Quiz completed:', topic, 'Score:', score);
}
