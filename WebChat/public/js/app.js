// ========================================
// ENCAPSULATION POUR ÉVITER LES CONFLITS
// ========================================
(function() {
    'use strict';

    // ========================================
    // VARIABLES GLOBALES
    // ========================================
    let currentSessionId = null;
    let isFirstInteraction = true;
    let isSending = false;

    // ========================================
    // ÉLÉMENTS DOM
    // ========================================
    const chatContainer = document.getElementById('chatContainer');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    const loading = document.getElementById('loading');
    const chatTitle = document.getElementById('chatTitle');
    const sessionInfo = document.getElementById('sessionInfo');

    // ========================================
    // FONCTIONS D'AFFICHAGE
    // ========================================

    // Afficher l'écran de bienvenue
    function displayWelcomeScreen() {
        const welcomeHTML = `
            <div class="welcome-screen">
                <div class="welcome-logo">
                    <img src="images/logo.png" alt="Saint Louis Collège" class="welcome-logo-img">
                </div>
                <h2 class="welcome-title">Bienvenue sur l'Assistant IA</h2>
                <p class="welcome-subtitle">Découvrez le BTS SIO au Lycée Saint Louis</p>
                
                <div class="suggestions-grid">
                    <div class="suggestion-card" data-question="Qu'est-ce que le BTS SIO ?">
                        <div class="suggestion-icon">📚</div>
                        <div class="suggestion-text">Qu'est-ce que le BTS SIO ?</div>
                    </div>
                    
                    <div class="suggestion-card" data-question="Quelles sont les différences entre SISR et SLAM ?">
                        <div class="suggestion-icon">💻</div>
                        <div class="suggestion-text">Différences SISR et SLAM ?</div>
                    </div>
                    
                    <div class="suggestion-card" data-question="Quels sont les débouchés professionnels ?">
                        <div class="suggestion-icon">🎯</div>
                        <div class="suggestion-text">Débouchés professionnels ?</div>
                    </div>
                    
                    <div class="suggestion-card" data-question="Comment s'inscrire au BTS SIO ?">
                        <div class="suggestion-icon">📝</div>
                        <div class="suggestion-text">Procédure d'inscription ?</div>
                    </div>
                </div>
            </div>
        `;
        
        chatContainer.innerHTML = welcomeHTML;
        attachSuggestionListeners();
    }

    // Attacher les listeners aux suggestions
    function attachSuggestionListeners() {
        const suggestionCards = document.querySelectorAll('.suggestion-card');
        
        suggestionCards.forEach(card => {
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            newCard.addEventListener('click', function() {
                const question = this.dataset.question;
                if (question) {
                    userInput.value = question;
                    sendMessage();
                }
            });
        });
    }

    // Ajouter un message dans le chat
    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
        
        if (isUser) {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${escapeHtml(content)}</div>
                </div>
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <div class="message-text">${formatMessage(content)}</div>
                </div>
            `;
        }
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Formater le message
    function formatMessage(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    // Échapper le HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Afficher une alerte
    function showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.querySelector('.container').insertBefore(alertDiv, document.querySelector('.chat-card'));
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    // ========================================
    // FONCTIONS DE CONVERSATION
    // ========================================

    // Créer une nouvelle conversation
    async function createNewConversation() {
        try {
            const response = await fetch('/api/conversations/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                currentSessionId = data.sessionId;
                isFirstInteraction = true;
                
                chatContainer.innerHTML = '';
                displayWelcomeScreen();
                
                chatTitle.textContent = 'Découvrir le BTS SIO';
                sessionInfo.textContent = 'Nouvelle conversation';
                
                userInput.value = '';
                userInput.focus();
            } else {
                showAlert(data.error || 'Erreur lors de la création', 'danger');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showAlert('Erreur de connexion au serveur', 'danger');
        }
    }

    // Envoyer un message
    async function sendMessage() {
        const message = userInput.value.trim();

        if (!message || isSending) {
            return;
        }

        isSending = true;

        if (isFirstInteraction) {
            chatContainer.innerHTML = '';
            isFirstInteraction = false;
        }

        addMessage(message, true);

        userInput.value = '';
        userInput.style.height = 'auto';
        userInput.disabled = true;
        sendBtn.disabled = true;

        loading.classList.remove('d-none');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    sessionId: currentSessionId
                })
            });

            const data = await response.json();
            loading.classList.add('d-none');

            if (data.success) {
                addMessage(data.response, false);
                
                if (data.title) {
                    chatTitle.textContent = data.title;
                }
            } else {
                showAlert(data.error || 'Erreur lors de l\'envoi', 'danger');
            }
        } catch (error) {
            loading.classList.add('d-none');
            console.error('Erreur:', error);
            showAlert('Erreur de connexion au serveur', 'danger');
        } finally {
            userInput.disabled = false;
            sendBtn.disabled = false;
            isSending = false;
            userInput.focus();
        }
    }

    // ========================================
    // AUTO-RESIZE DU TEXTAREA
    // ========================================
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // ========================================
    // EVENT LISTENERS
    // ========================================
    newChatBtn.addEventListener('click', createNewConversation);
    sendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sendMessage();
    });
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // ========================================
    // INITIALISATION
    // ========================================
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('✅ Assistant IA - Saint Louis Collège chargé');
        await createNewConversation();
    });

})(); // Fin de l'IIFE
