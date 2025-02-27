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
    initializeGameElements();
});

function initializeGameElements() {
    const playerNameInput = document.getElementById('player-name');
    const joinGameBtn = document.getElementById('join-game');
    const startGameBtn = document.getElementById('start-game');
    const playersList = document.getElementById('joined-players');
    const nextRoundBtn = document.getElementById('next-round');
    const readyToGuessBtn = document.getElementById('ready-to-guess');
    const nextCardBtn = document.getElementById('next-card');

    // Join Game Handler
    joinGameBtn.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();
        if (playerName && !gameState.players.includes(playerName)) {
            gameState.players.push(playerName);
            gameState.scores[playerName] = 0;
            updatePlayersList();
            playerNameInput.value = '';
            
            // Enable start game button if enough players
            startGameBtn.disabled = gameState.players.length < 3;
        }
    });

    // Start Game Handler
    startGameBtn.addEventListener('click', () => {
        if (gameState.players.length >= 3) {
            gameState.maxRounds = gameState.players.length <= 5 ? gameState.players.length * 2 : gameState.players.length;
            startNewRound();
        }
    });

    // Category Selection
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            gameState.selectedCategory = button.dataset.category;
            startGamePhase();
        });
    });

    // Ready to Guess Handler
    readyToGuessBtn.addEventListener('click', () => {
        shuffleAndStartGuessingPhase();
    });

    // Next Round Handler
    nextRoundBtn.addEventListener('click', () => {
        if (gameState.currentRound < gameState.maxRounds) {
            startNewRound();
        } else {
            endGame();
        }
    });

    // Next Card Handler
    nextCardBtn.addEventListener('click', showNextCard);

    // Initialize drag and drop for game cards
    initializeDragAndDrop();
}

function initializeDragAndDrop() {
    const currentCard = document.getElementById('current-card');
    
    // Set up drag start event
    currentCard.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', 'current-card');
        currentCard.classList.add('dragging');
    });

    currentCard.addEventListener('dragend', (e) => {
        currentCard.classList.remove('dragging');
    });

    // Set up drop zones
    document.querySelectorAll('.score-slot').forEach(slot => {
        slot.addEventListener('dragover', e => {
            // Only allow drop if slot is not filled
            if (!slot.classList.contains('filled')) {
                e.preventDefault();
                slot.classList.add('drag-over');
            }
        });

        slot.addEventListener('dragleave', e => {
            slot.classList.remove('drag-over');
        });

        slot.addEventListener('drop', handleCardDrop);
    });
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
    // Generate placeholder cards for the selected category
    gameState.cards = Array.from({length: 5}, (_, i) => ({
        id: i + 1,
        question: `Sample Question ${i + 1} from ${gameState.selectedCategory} category`,
        placed: false,
        slot: null
    }));
    
    // Set the current question and correct answer
    gameState.currentQuestion = gameState.cards[0];
    // For demo purposes, make the first card the correct answer
    gameState.correctAnswerCard = gameState.cards[0];
    
    // Display the question for non-guessers
    document.getElementById('current-question').textContent = gameState.currentQuestion.question;
}

function showAnswerPhase() {
    showScreen('answer');
}

function shuffleAndStartGuessingPhase() {
    // Shuffle the cards
    gameState.shuffledCards = [...gameState.cards];
    for (let i = gameState.shuffledCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.shuffledCards[i], gameState.shuffledCards[j]] = 
        [gameState.shuffledCards[j], gameState.shuffledCards[i]];
    }
    
    // Reset card index
    gameState.currentCardIndex = 0;
    gameState.cards = gameState.shuffledCards;
    
    // Move to guessing phase and show first card
    showScreen('game');
    showCurrentCard();
}

function showCurrentCard() {
    const currentCard = gameState.cards[gameState.currentCardIndex];
    const cardsRemaining = gameState.cards.length - gameState.currentCardIndex;
    
    // Display current card
    const cardElement = document.getElementById('current-card');
    cardElement.textContent = currentCard.question;
    cardElement.classList.remove('placed');
    
    // Update progress
    document.getElementById('cards-remaining').textContent = 
        `Question ${gameState.currentCardIndex + 1} of ${gameState.cards.length}`;
    
    // Show/hide next card button based on whether the current card has been placed
    document.getElementById('next-card').style.display = currentCard.placed ? 'block' : 'none';
}

function showNextCard() {
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

function handleCardDrop(e) {
    e.preventDefault();
    const slot = e.target.closest('.score-slot');
    
    if (!slot || slot.classList.contains('filled')) return;
    
    const slotNumber = parseInt(slot.dataset.slot);
    const currentCard = gameState.cards[gameState.currentCardIndex];
    
    if (!currentCard.placed) {
        currentCard.placed = true;
        currentCard.slot = slotNumber;
        
        // Update the slot's content and mark it as filled
        slot.innerHTML = currentCard.question;
        slot.classList.add('filled');
        
        // Show the next card button
        document.getElementById('next-card').style.display = 'block';
        
        // If this was the last card, show results
        if (gameState.currentCardIndex === gameState.cards.length - 1 && !gameState.resultsShown) {
            gameState.resultsShown = true;
            setTimeout(showResults, 1000);
        }
    }
    
    slot.classList.remove('drag-over');
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
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenId].classList.add('active');
    gameState.currentPhase = screenId;
}

function updatePlayersList() {
    const playersList = document.getElementById('joined-players');
    playersList.innerHTML = gameState.players
        .map(player => `<li>${player}</li>`)
        .join('');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
