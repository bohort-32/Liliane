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
            <div class="welcome-section">
                <div class="text-center mb-4">
                    <i class="bi bi-mortarboard-fill" style="font-size: 4rem; color: var(--saint-louis-orange);"></i>
                    <h3 class="mt-3">Bienvenue sur l'assistant BTS SIO</h3>
                    <p class="text-muted">Découvrez notre formation en Services Informatiques aux Organisations</p>
                </div>

                <div class="suggestions-container">
                    <h6 class="text-muted mb-3">Questions fréquentes :</h6>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="suggestion-card" data-question="Qu'est-ce que le BTS SIO ?">
                                <i class="bi bi-info-circle-fill"></i>
                                <div>
                                    <strong>Présentation générale</strong>
                                    <p class="mb-0 small text-muted">Qu'est-ce que le BTS SIO ?</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="suggestion-card" data-question="Quelles sont les deux options du BTS SIO ?">
                                <i class="bi bi-diagram-3-fill"></i>
                                <div>
                                    <strong>Les options SISR et SLAM</strong>
                                    <p class="mb-0 small text-muted">Quelles sont les différences ?</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="suggestion-card" data-question="Quels sont les débouchés professionnels ?">
                                <i class="bi bi-briefcase-fill"></i>
                                <div>
                                    <strong>Débouchés professionnels</strong>
                                    <p class="mb-0 small text-muted">Quelles carrières après le BTS ?</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="suggestion-card" data-question="Comment s'inscrire au BTS SIO ?">
                                <i class="bi bi-pencil-square"></i>
                                <div>
                                    <strong>Procédure d'inscription</strong>
                                    <p class="mb-0 small text-muted">Comment postuler ?</p>
                                </div>
                            </div>
                        </div>
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
            card.addEventListener('click', function() {
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
        // Supprimer l'écran de bienvenue au premier message
        if (isFirstInteraction) {
            chatContainer.innerHTML = '';
            isFirstInteraction = false;
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
        
        const timestamp = new Date().toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        if (isUser) {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <i class="bi bi-person-fill"></i>
                </div>
                <div class="message-bubble">
                    <div class="message-content">${escapeHtml(content)}</div>
                    <div class="message-time">${timestamp}</div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <i class="bi bi-robot"></i>
                </div>
                <div class="message-bubble">
                    <div class="message-content">${formatMessage(content)}</div>
                    <div class="message-time">${timestamp}</div>
                </div>
            `;
        }
        
        chatContainer.appendChild(messageDiv);
        
        // Scroll automatique
        setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 100);
    }

    // Formater le message avec Marked.js
    function formatMessage(text) {
        if (typeof marked !== 'undefined') {
            // Configuration de Marked
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: false,
                mangle: false
            });
            
            return marked.parse(text);
        }
        
        // Fallback si Marked n'est pas chargé
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    // Échapper le HTML pour éviter XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Afficher une alerte
    function showAlert(message, type = 'danger') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
        alertDiv.style.zIndex = '9999';
        alertDiv.innerHTML = `
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
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

            if (!response.ok) {
                throw new Error('Erreur réseau');
            }

            const data = await response.json();

            if (data.success) {
                currentSessionId = data.sessionId;
                isFirstInteraction = true;
                displayWelcomeScreen();
                chatTitle.textContent = 'Nouvelle conversation';
                sessionInfo.textContent = `Session: ${currentSessionId.substring(0, 8)}...`;
                userInput.value = '';
                userInput.focus();
            } else {
                showAlert(data.error || 'Impossible de créer une conversation');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showAlert('Erreur de connexion au serveur');
        }
    }

    // Envoyer un message
    async function sendMessage() {
        const message = userInput.value.trim();
        
        if (!message || isSending) return;
        
        if (!currentSessionId) {
            showAlert('Veuillez créer une nouvelle conversation');
            return;
        }

        isSending = true;
        userInput.disabled = true;
        sendBtn.disabled = true;

        // Afficher le message utilisateur
        addMessage(message, true);
        userInput.value = '';
        userInput.style.height = 'auto';

        // Afficher le loader
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

            if (!response.ok) {
                throw new Error('Erreur réseau');
            }

            const data = await response.json();
            loading.classList.add('d-none');

            if (data.success) {
                addMessage(data.response, false);
                
                if (data.title && isFirstInteraction) {
                    chatTitle.textContent = data.title;
                }

                // Appliquer la coloration syntaxique si disponible
                if (typeof hljs !== 'undefined') {
                    document.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightElement(block);
                    });
                }
            } else {
                showAlert(data.error || 'Erreur lors de l\'envoi du message');
            }
        } catch (error) {
            loading.classList.add('d-none');
            console.error('Erreur:', error);
            showAlert('Erreur de connexion au serveur');
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
        this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });

    // ========================================
    // EVENT LISTENERS
    // ========================================
    newChatBtn.addEventListener('click', createNewConversation);
    
    sendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sendMessage();
    });
    
    userInput.addEventListener('keydown', (e) => {
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
        
        // Vérifier que Marked.js est chargé
        if (typeof marked === 'undefined') {
            console.warn('⚠️ Marked.js non chargé');
        }
        
        // Vérifier que Highlight.js est chargé
        if (typeof hljs === 'undefined') {
            console.warn('⚠️ Highlight.js non chargé');
        }
        
        await createNewConversation();
    });

})();
