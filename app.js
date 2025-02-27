// Game State Management
const gameState = {
    players: [],
    currentGuesser: null,
    currentRound: 0,
    maxRounds: 0,
    selectedCategory: null,
    scores: {},
    cards: [],
    currentPhase: 'lobby',
    currentQuestion: null,
    shuffledCards: [],
    currentCardIndex: 0,
    correctAnswerCard: null, // Track the correct answer card
    resultsShown: false // Flag to track if results have been shown for the current round
};

// DOM Elements
const screens = {
    lobby: document.getElementById('lobby-screen'),
    category: document.getElementById('category-screen'),
    game: document.getElementById('game-screen'),
    results: document.getElementById('results-screen'),
    answer: document.getElementById('answer-screen')
};

// Initialize Game Elements
document.addEventListener('DOMContentLoaded', () => {
    // Reset game state
    gameState.currentPhase = 'lobby';
    gameState.players = [];
    gameState.currentGuesser = null;
    gameState.currentRound = 0;
    gameState.scores = {};
    
    // Show lobby screen by default
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });
    screens.lobby.style.display = 'flex';
    screens.lobby.classList.add('active');
    
    // Initialize all game elements
    initializeGameElements();
    setMobileHeight();
});

function initializeGameElements() {
    const playerNameInput = document.getElementById('player-name');
    const joinGameBtn = document.getElementById('join-game');
    const startGameBtn = document.getElementById('start-game');
    const playersList = document.getElementById('joined-players');
    const nextRoundBtn = document.getElementById('next-round');
    const readyToGuessBtn = document.getElementById('ready-to-guess');
    const nextCardBtn = document.getElementById('next-card');

    // Join Game Handler with debugging
    function handleJoinGame() {
        console.log('Join game handler called'); // Debug log
        const playerName = playerNameInput.value.trim();
        console.log('Player name:', playerName); // Debug log
        
        if (playerName && !gameState.players.includes(playerName)) {
            console.log('Adding player:', playerName); // Debug log
            gameState.players.push(playerName);
            gameState.scores[playerName] = 0;
            playerNameInput.value = '';
            
            // Enable start game button if enough players
            startGameBtn.disabled = gameState.players.length < 3;
            startGameBtn.textContent = gameState.players.length < 3 
                ? `Start Game (Need ${3 - gameState.players.length} more)`
                : 'Start Game';
            
            // Update players list
            updatePlayersList();
            console.log('Current players:', gameState.players); // Debug log
        }
    }

    // Add click handler
    joinGameBtn.addEventListener('click', handleJoinGame);

    // Add touch handler for mobile
    joinGameBtn.addEventListener('touchend', (e) => {
        e.preventDefault(); // Prevent any default touch behavior
        handleJoinGame();
    });

    // Handle Enter key in the input field
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default enter key behavior
            handleJoinGame();
        }
    });

    // Start Game Handler
    function handleStartGame() {
        console.log('Start game handler called'); // Debug log
        if (gameState.players.length >= 3) {
            console.log('Starting game with players:', gameState.players); // Debug log
            
            // Initialize game state
            gameState.currentRound = 0;
            gameState.currentGuesser = gameState.players[0];
            gameState.scores = {};
            gameState.players.forEach(player => gameState.scores[player] = 0);
            
            // Start first round
            startNewRound();
        }
    }

    // Add click handler for start game
    startGameBtn.addEventListener('click', handleStartGame);

    // Add touch handler for mobile
    startGameBtn.addEventListener('touchend', (e) => {
        e.preventDefault(); // Prevent any default touch behavior
        handleStartGame();
    });

    // Category Selection
    const categoryButtons = document.querySelectorAll('.category-btn');
    function handleCategorySelect(category) {
        console.log('Category selected:', category); // Debug log
        gameState.selectedCategory = category;
        generateCards();
        showAnswerPhase();
    }

    categoryButtons.forEach(button => {
        // Handle click events
        button.addEventListener('click', (e) => {
            e.preventDefault();
            handleCategorySelect(button.textContent);
        });

        // Handle touch events
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleCategorySelect(button.textContent);
        });
    });

    // Ready to Guess Handler
    function handleReadyToGuess() {
        console.log('Ready to guess clicked'); // Debug log
        shuffleAndStartGuessingPhase();
    }

    readyToGuessBtn.addEventListener('click', handleReadyToGuess);
    readyToGuessBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleReadyToGuess();
    });

    // Next Round Handler
    function handleNextRound() {
        console.log('Next round clicked'); // Debug log
        if (gameState.currentRound < gameState.maxRounds) {
            startNewRound();
        } else {
            endGame();
        }
    }

    nextRoundBtn.addEventListener('click', handleNextRound);
    nextRoundBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleNextRound();
    });

    // Next Card Handler
    function handleNextCard() {
        console.log('Next card clicked'); // Debug log
        if (gameState.currentCardIndex < gameState.cards.length - 1) {
            gameState.currentCardIndex++;
            showCurrentCard();
        } else {
            // All cards have been placed
            // Only show results if they haven't been shown already
            if (!gameState.resultsShown) {
                gameState.resultsShown = true;
                setTimeout(showResults, 1000);
            }
        }
    }

    nextCardBtn.addEventListener('click', handleNextCard);
    nextCardBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleNextCard();
    });

    // Initialize mobile-friendly interaction for game cards
    initializeMobileInteraction();

    // Add touch event handlers
    document.addEventListener('touchstart', function(e) {
        if (e.target.matches('.category-btn, .score-slot, #current-card, button')) {
            e.preventDefault();
        }
    }, { passive: false });

    // Prevent double-tap zoom on buttons and interactive elements
    document.addEventListener('click', function(e) {
        if (e.target.matches('.category-btn, .score-slot, #current-card, button')) {
            e.preventDefault();
        }
    });

    // Initialize mobile height
    setMobileHeight();
    window.addEventListener('resize', setMobileHeight);
    window.addEventListener('orientationchange', () => {
        setTimeout(setMobileHeight, 100);
    });

    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            setMobileHeight();
        }
    });
}

function initializeMobileInteraction() {
    const currentCard = document.getElementById('current-card');
    const slots = document.querySelectorAll('.score-slot');
    
    // Handle card selection
    currentCard.addEventListener('click', handleCardClick);
    currentCard.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleCardClick(e);
    });

    // Handle slot selection
    slots.forEach(slot => {
        slot.addEventListener('click', handleSlotClick);
        slot.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleSlotClick(e);
        });
    });
}

function handleCardClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const currentCard = e.target.closest('#current-card');
    const slots = document.querySelectorAll('.score-slot');
    
    // Don't allow selection if card is already placed
    const currentQuestion = gameState.shuffledCards[gameState.currentCardIndex];
    if (!currentCard || !currentQuestion || currentQuestion.placed) {
        console.log('Card cannot be selected:', { placed: currentQuestion?.placed });
        return;
    }

    const wasSelected = currentCard.classList.contains('selected');
    console.log('Card clicked, was selected:', wasSelected);
    
    // Reset states
    currentCard.classList.remove('selected');
    slots.forEach(slot => slot.classList.remove('selectable'));
    
    if (!wasSelected) {
        // Select the card and highlight available slots
        currentCard.classList.add('selected');
        slots.forEach(slot => {
            if (!slot.classList.contains('filled')) {
                slot.classList.add('selectable');
            }
        });
    }
}

function handleSlotClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const slot = e.target.closest('.score-slot');
    const currentCard = document.getElementById('current-card');
    
    if (!slot || !currentCard || !currentCard.classList.contains('selected')) {
        console.log('Slot click ignored:', { 
            hasSlot: !!slot, 
            hasCard: !!currentCard, 
            isSelected: currentCard?.classList.contains('selected') 
        });
        return;
    }
    
    if (slot.classList.contains('filled')) {
        console.log('Slot is already filled');
        return;
    }
    
    if (slot.classList.contains('selectable')) {
        console.log('Placing card in slot');
        handleCardPlacement(slot);
        currentCard.classList.remove('selected');
        document.querySelectorAll('.score-slot').forEach(s => s.classList.remove('selectable'));
    }
}

// Game Flow Functions
function startNewRound() {
    gameState.currentRound++;
    
    // Reset round-specific state
    gameState.correctAnswerCard = null;
    gameState.cards = [];
    gameState.shuffledCards = [];
    gameState.currentCardIndex = 0;
    gameState.selectedCategory = null;
    gameState.resultsShown = false; // Reset the flag for the new round

    // Move to the next guesser
    const currentGuesserIndex = gameState.players.indexOf(gameState.currentGuesser);
    const nextGuesserIndex = (currentGuesserIndex + 1) % gameState.players.length;
    gameState.currentGuesser = gameState.players[nextGuesserIndex];

    // Update UI
    document.getElementById('current-guesser').textContent = gameState.currentGuesser;
    
    // Clear previous round's cards and scores
    document.querySelectorAll('.score-slot').forEach(slot => {
        const label = document.createElement('div');
        label.className = 'slot-label';
        label.textContent = slot.dataset.slot === '1' ? 'Most Likely' :
                        slot.dataset.slot === '2' ? 'Very Likely' :
                        slot.dataset.slot === '3' ? 'Possibly' :
                        slot.dataset.slot === '4' ? 'Less Likely' : 'Least Likely';
        
        const points = document.createElement('div');
        points.className = 'slot-points';
        points.textContent = `(${4 - (slot.dataset.slot - 1)} points)`;
        
        slot.innerHTML = '';
        slot.appendChild(label);
        slot.appendChild(points);
        slot.classList.remove('filled');
    });

    // Show category selection screen
    showScreen('category');
    console.log('Started new round:', gameState.currentRound); // Debug log
}

function startGamePhase() {
    // Update all guesser displays
    document.getElementById('answer-phase-guesser').textContent = gameState.currentGuesser;
    document.getElementById('answer-phase-category').textContent = gameState.selectedCategory;
    document.getElementById('guessing-phase-guesser').textContent = gameState.currentGuesser;
    document.getElementById('selected-category').textContent = gameState.selectedCategory;

    generateCards();
    showAnswerPhase();
}

function generateCards() {
    console.log('Generating cards for category:', gameState.selectedCategory);
    
    // Generate questions based on category
    const questions = {
        'Movies': [
            'Would watch this movie alone',
            'Would recommend this to a friend',
            'Would fall asleep during this movie',
            'Would watch this on a first date',
            'Would watch this movie\'s sequel'
        ],
        'Food': [
            'Would eat this for breakfast',
            'Would cook this for guests',
            'Would order this at a restaurant',
            'Would eat this on a hot day',
            'Would learn to make this at home'
        ],
        'Activities': [
            'Would do this on a weekend',
            'Would try this for the first time',
            'Would teach someone else this',
            'Would do this alone',
            'Would pay to do this'
        ],
        'Places': [
            'Would visit during summer',
            'Would recommend to tourists',
            'Would live here for a year',
            'Would visit again',
            'Would avoid during peak season'
        ]
    };

    // Get questions for selected category or use generic ones if category not found
    const categoryQuestions = questions[gameState.selectedCategory] || 
        Array(5).fill(0).map((_, i) => `Question ${i + 1} for ${gameState.selectedCategory}`);
    
    // Create card objects
    gameState.cards = categoryQuestions.map(question => ({
        question: question,
        placed: false,
        slot: null
    }));
    
    // Set one random card as the correct answer
    const correctIndex = Math.floor(Math.random() * gameState.cards.length);
    gameState.correctAnswerCard = gameState.cards[correctIndex];
    
    console.log('Generated cards:', gameState.cards);
    console.log('Correct answer card:', gameState.correctAnswerCard);
}

function showAnswerPhase() {
    // Update UI elements
    document.getElementById('answer-phase-guesser').textContent = gameState.currentGuesser;
    document.getElementById('answer-phase-category').textContent = gameState.selectedCategory;
    
    // Show the current question for non-guessers
    const currentQuestionElement = document.getElementById('current-question');
    if (currentQuestionElement) {
        currentQuestionElement.textContent = gameState.correctAnswerCard.question;
    }

    // Show the answer phase screen
    showScreen('answer');
    console.log('Showing answer phase screen with question:', gameState.correctAnswerCard.question);
}

function shuffleAndStartGuessingPhase() {
    console.log('Starting guessing phase');
    
    // Update UI elements
    document.getElementById('guessing-phase-guesser').textContent = gameState.currentGuesser;
    document.getElementById('selected-category').textContent = gameState.selectedCategory;
    
    // Shuffle the cards
    gameState.shuffledCards = [...gameState.cards];
    shuffleArray(gameState.shuffledCards);
    gameState.currentCardIndex = 0;
    
    // Show the game screen and first card
    showScreen('game');
    showCurrentCard();
}

function showCurrentCard() {
    console.log('Showing current card');
    const currentCard = document.getElementById('current-card');
    const currentQuestion = gameState.shuffledCards[gameState.currentCardIndex];
    
    if (currentCard && currentQuestion) {
        console.log('Current question:', currentQuestion.question);
        currentCard.textContent = currentQuestion.question;
        currentCard.classList.remove('placed', 'selected');
        currentCard.removeAttribute('draggable'); // Remove draggable attribute for mobile
        
        // Update instruction text
        const instructionText = document.querySelector('.instruction-text');
        if (instructionText) {
            instructionText.textContent = 'Tap the question to select it, then tap a slot to place it!';
        }
        
        // Show/hide next card button
        const nextCardBtn = document.getElementById('next-card');
        if (nextCardBtn) {
            nextCardBtn.style.display = currentQuestion.placed ? 'block' : 'none';
        }
    }
    
    // Update cards remaining counter
    const remainingCards = gameState.shuffledCards.length - gameState.currentCardIndex - 1;
    const cardsRemainingElement = document.getElementById('cards-remaining');
    if (cardsRemainingElement) {
        cardsRemainingElement.textContent = remainingCards > 0 ? 
            `Questions remaining: ${remainingCards}` : 'Last question!';
    }
}

function handleCardPlacement(slot) {
    if (!slot || slot.classList.contains('filled')) return;
    
    const currentCard = document.getElementById('current-card');
    const slotNumber = parseInt(slot.dataset.slot);
    const currentQuestion = gameState.shuffledCards[gameState.currentCardIndex];
    
    if (!currentQuestion.placed) {
        currentQuestion.placed = true;
        currentQuestion.slot = slotNumber;
        
        // Update the slot's content
        slot.innerHTML = `
            <div class="placed-card">
                ${currentQuestion.question}
            </div>
        `;
        slot.classList.add('filled');
        currentCard.classList.add('placed');
        
        // Show the next card button
        const nextCardBtn = document.getElementById('next-card');
        nextCardBtn.style.display = 'block';
        nextCardBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Check if this was the last card
        if (gameState.currentCardIndex === gameState.shuffledCards.length - 1 && !gameState.resultsShown) {
            gameState.resultsShown = true;
            setTimeout(showResults, 1000);
        }
    }
}

function showResults() {
    // Calculate the round score
    const roundScore = calculateRoundScore();
    
    // Store the original score for debugging
    const originalScore = gameState.scores[gameState.currentGuesser];
    
    // Update the score only once
    gameState.scores[gameState.currentGuesser] = originalScore + roundScore;
    
    // Show the results
    const resultsDiv = document.getElementById('round-score');
    resultsDiv.innerHTML = `
        <h3>Round ${gameState.currentRound} Results</h3>
        <p>The correct answer was: "${gameState.correctAnswerCard.question}"</p>
        <p>You placed it in position: ${getSlotName(gameState.correctAnswerCard.slot)}</p>
        <p>Points earned: ${roundScore}</p>
        <p>${gameState.currentGuesser}'s total score: ${gameState.scores[gameState.currentGuesser]}</p>
        <p class="debug-info" style="color: gray; font-size: 0.8em;">
            (Debug: Original score: ${originalScore}, Added: ${roundScore})
        </p>
    `;
    
    updateTotalScores();
    showScreen('results');
}

function calculateRoundScore() {
    // Find the slot where the correct answer was placed
    const correctCard = gameState.correctAnswerCard;
    if (!correctCard || !correctCard.slot) return 0;

    // Points based on slot placement (0-4 points)
    const pointsMap = {
        1: 4, // Most Likely
        2: 3, // Very Likely
        3: 2, // Possibly
        4: 1, // Less Likely
        5: 0  // Least Likely
    };

    return pointsMap[correctCard.slot] || 0;
}

function getSlotName(slotNumber) {
    const slotNames = {
        1: 'Most Likely (4 points)',
        2: 'Very Likely (3 points)',
        3: 'Possibly (2 points)',
        4: 'Less Likely (1 point)',
        5: 'Least Likely (0 points)'
    };
    return slotNames[slotNumber] || 'Unknown';
}

function updateTotalScores() {
    const scoresDiv = document.getElementById('total-scores');
    scoresDiv.innerHTML = `
        <h3>Total Scores:</h3>
        ${Object.entries(gameState.scores)
            .sort(([,a], [,b]) => b - a) // Sort by score in descending order
            .map(([player, score]) => `<p>${player}: ${score} points</p>`)
            .join('')}
    `;
}

function endGame() {
    const resultsDiv = document.getElementById('round-score');
    resultsDiv.innerHTML = `
        <h2>Game Over!</h2>
        <h3>Final Scores:</h3>
        ${Object.entries(gameState.scores)
            .sort(([,a], [,b]) => b - a)
            .map(([player, score], index) => 
                `<p>${index + 1}. ${player}: ${score} points</p>`
            ).join('')}
    `;
    
    // Hide the next round button
    document.getElementById('next-round').style.display = 'none';
}

// Utility Functions
function showScreen(screenId) {
    // Validate screen exists
    if (!screens[screenId]) {
        console.error(`Screen ${screenId} not found`);
        return;
    }
    
    // Hide all screens first
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });
    
    // Show the requested screen
    const screenToShow = screens[screenId];
    screenToShow.style.display = 'flex';
    screenToShow.classList.add('active');
    
    // Reset scroll position
    screenToShow.scrollTop = 0;
    
    // Update game state
    gameState.currentPhase = screenId;
    
    // Refresh mobile height
    setMobileHeight();
}

function updatePlayersList() {
    const playersList = document.getElementById('joined-players');
    if (!playersList) return;
    
    playersList.innerHTML = gameState.players
        .map(player => `<li>${player}</li>`)
        .join('');
    
    // Update the start game button state
    const startGameBtn = document.getElementById('start-game');
    if (startGameBtn) {
        startGameBtn.disabled = gameState.players.length < 3;
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function setMobileHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Call this function on load and resize
window.addEventListener('load', setMobileHeight);
window.addEventListener('resize', setMobileHeight);
