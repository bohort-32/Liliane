// ========================================
// ENCAPSULATION POUR ÉVITER LES CONFLITS
// ========================================
(function () {
    'use strict';

    // ========================================
    // VARIABLES GLOBALES
    // ========================================
    let currentSessionId = null;
    let isFirstInteraction = true;
    let isSending = false;
    let conversations = [];

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
    const conversationsList = document.getElementById('conversationsList');

    // ========================================
    // GESTION DE L'HISTORIQUE
    // ========================================

    // Charger les conversations depuis le localStorage
    function loadConversations() {
        try {
            const saved = localStorage.getItem('saintlouis_conversations');
            conversations = saved ? JSON.parse(saved) : [];
            renderConversationsList();
        } catch (error) {
            console.error('Erreur lors du chargement des conversations:', error);
            conversations = [];
        }
    }

    // Sauvegarder les conversations dans le localStorage
    function saveConversations() {
        try {
            localStorage.setItem('saintlouis_conversations', JSON.stringify(conversations));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des conversations:', error);
        }
    }

    // Ajouter ou mettre à jour une conversation
    function updateConversation(sessionId, title, messages) {
        // Vérification de sécurité
        if (!messages || !Array.isArray(messages)) {
            console.warn('Messages invalides pour la conversation', sessionId);
            return;
        }

        const index = conversations.findIndex(c => c.id === sessionId);

        const lastMessageContent = messages.length > 0 && messages[messages.length - 1].content
            ? messages[messages.length - 1].content.substring(0, 50)
            : '';

        const conversation = {
            id: sessionId,
            title: title || 'Nouvelle conversation',
            lastMessage: lastMessageContent,
            timestamp: new Date().toISOString(),
            messages: messages
        };

        if (index !== -1) {
            conversations[index] = conversation;
        } else {
            conversations.unshift(conversation);
        }

        // Limiter à 50 conversations max
        if (conversations.length > 50) {
            conversations = conversations.slice(0, 50);
        }

        saveConversations();
        renderConversationsList();
    }


    // Supprimer une conversation
    function deleteConversation(sessionId) {
        conversations = conversations.filter(c => c.id !== sessionId);
        saveConversations();
        renderConversationsList();

        if (currentSessionId === sessionId) {
            createNewConversation();
        }
    }

    // Afficher la liste des conversations
    function renderConversationsList() {
        if (conversations.length === 0) {
            conversationsList.innerHTML = `
                <div class="no-conversations">
                    <i class="bi bi-chat-dots"></i>
                    <p>Aucune conversation</p>
                </div>
            `;
            return;
        }

        conversationsList.innerHTML = conversations.map(conv => {
            const date = new Date(conv.timestamp);
            const formattedDate = formatDate(date);
            const isActive = conv.id === currentSessionId;

            return `
                <div class="conversation-item ${isActive ? 'active' : ''}" data-session-id="${conv.id}">
                    <div class="conversation-item-header">
                        <h6 class="conversation-item-title">${escapeHtml(conv.title)}</h6>
                        <div class="conversation-item-actions">
                            <button class="delete-conversation" data-session-id="${conv.id}" title="Supprimer">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                    <small class="conversation-item-date">${formattedDate}</small>
                </div>
            `;
        }).join('');

        // Attacher les événements
        attachConversationListeners();
    }

    // Formater la date
    function formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'À l\'instant';
        if (minutes < 60) return `Il y a ${minutes} min`;
        if (hours < 24) return `Il y a ${hours}h`;
        if (days < 7) return `Il y a ${days}j`;

        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short'
        });
    }

    // Attacher les listeners aux conversations
    function attachConversationListeners() {
        // Clic sur une conversation
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', function (e) {
                if (!e.target.closest('.delete-conversation')) {
                    const sessionId = this.dataset.sessionId;
                    loadConversation(sessionId);
                }
            });
        });

        // Clic sur le bouton supprimer
        document.querySelectorAll('.delete-conversation').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const sessionId = this.dataset.sessionId;
                if (confirm('Supprimer cette conversation ?')) {
                    deleteConversation(sessionId);
                }
            });
        });
    }

    // Charger une conversation existante
    function loadConversation(sessionId) {
        const conversation = conversations.find(c => c.id === sessionId);
        if (!conversation) return;

        currentSessionId = sessionId;
        isFirstInteraction = false;

        // Mettre à jour le titre
        chatTitle.textContent = conversation.title;
        sessionInfo.textContent = `Conversation du ${new Date(conversation.timestamp).toLocaleDateString('fr-FR')}`;

        // Vider et afficher les messages
        chatContainer.innerHTML = '';
        conversation.messages.forEach(msg => {
            addMessage(msg.content, msg.role === 'user');
        });

        renderConversationsList();
        userInput.focus();
    }

    // ========================================
    // FONCTIONS D'AFFICHAGE
    // ========================================

    function displayWelcomeScreen() {
        const welcomeHTML = `
            <div class="welcome-section">
                <div class="text-center mb-4">
                    <i class="bi bi-mortarboard-fill" style="font-size: 4rem; color: var(--saint-louis-orange);"></i>
                    <h3 class="mt-3">Bienvenue sur l'assistant BTS SIO</h3>
                    <p class="text-muted">Découvrez notre formation en Services Informatiques aux Organisations</p>
                </div>

                <div class="suggestions-grid">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="suggestion-card" data-question="Qu'est-ce que le BTS SIO ?">
                                <i class="bi bi-info-circle-fill"></i>
                                <div>
                                    <strong>Présentation du BTS SIO</strong>
                                    <p class="mb-0 small text-muted">Découvrir la formation</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="suggestion-card" data-question="Quelles sont les différences entre SISR et SLAM ?">
                                <i class="bi bi-diagram-3-fill"></i>
                                <div>
                                    <strong>Options SISR / SLAM</strong>
                                    <p class="mb-0 small text-muted">Comprendre les spécialités</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="suggestion-card" data-question="Quels sont les prérequis pour intégrer le BTS SIO ?">
                                <i class="bi bi-file-earmark-check-fill"></i>
                                <div>
                                    <strong>Conditions d'admission</strong>
                                    <p class="mb-0 small text-muted">Bacs acceptés et prérequis</p>
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
                        <div class="col-md-6">
                            <div class="suggestion-card" data-question="Comment se déroulent les stages ?">
                                <i class="bi bi-building"></i>
                                <div>
                                    <strong>Stages en entreprise</strong>
                                    <p class="mb-0 small text-muted">Durée et organisation</p>
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

    function attachSuggestionListeners() {
        document.querySelectorAll('.suggestion-card').forEach(card => {
            card.addEventListener('click', function () {
                const question = this.dataset.question;
                userInput.value = question;
                sendMessage();
            });
        });
    }

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

                chatTitle.textContent = 'Découvrir le BTS SIO';
                sessionInfo.textContent = 'Nouvelle conversation';

                displayWelcomeScreen();
                renderConversationsList();
                userInput.value = '';
                userInput.focus();
            }
        } catch (error) {
            console.error('Erreur:', error);
            showAlert('Erreur lors de la création de la conversation');
        }
    }

    function addMessage(content, isUser = false) {
        if (isFirstInteraction && !isUser) {
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

        setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 100);
    }

    function formatMessage(text) {
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: false,
                mangle: false
            });

            // Parser le markdown
            let html = marked.parse(text);

            // Transformer les chemins d'images relatifs en chemins absolus
            html = html.replace(
                /<img\s+([^>]*?)src=["'](?!http)([^"']+)["']/gi,
                (match, attrs, src) => {
                    // Si le chemin ne commence pas par /images/, l'ajouter
                    const imagePath = src.startsWith('/images/')
                        ? src
                        : `/images/${src.replace(/^\/+/, '')}`;

                    return `<img ${attrs}src="${imagePath}" class="chat-image" loading="lazy" onerror="this.onerror=null; this.src='/images/placeholder.png'; this.alt='Image non disponible';"`;
                }
            );

            return html;
        }

        // Fallback si marked.js n'est pas chargé
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');

        // Détecter les images markdown : ![alt](url)
        formatted = formatted.replace(
            /!\[([^\]]*)\]\(([^)]+)\)/g,
            (match, alt, src) => {
                const imagePath = src.startsWith('/images/')
                    ? src
                    : `/images/${src.replace(/^\/+/, '')}`;

                return `<img src="${imagePath}" alt="${alt || 'Image'}" class="chat-image" loading="lazy" onerror="this.onerror=null; this.src='/images/placeholder.png'; this.alt='Image non disponible';">`;
            }
        );

        return formatted;
    }

    // ========================================
    // GESTION DES IMAGES
    // ========================================

    function setupImageModal() {
        // Créer le modal s'il n'existe pas
        if (!document.getElementById('imageModal')) {
            const modal = document.createElement('div');
            modal.id = 'imageModal';
            modal.className = 'image-modal';
            modal.innerHTML = `
            <span class="close-modal">&times;</span>
            <img id="modalImage" src="" alt="Image agrandie">
        `;
            document.body.appendChild(modal);

            // Fermer le modal au clic
            modal.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
    }

    function attachImageListeners() {
        document.querySelectorAll('.chat-image').forEach(img => {
            img.addEventListener('click', function (e) {
                e.stopPropagation();
                const modal = document.getElementById('imageModal');
                const modalImg = document.getElementById('modalImage');

                if (modal && modalImg) {
                    modal.style.display = 'block';
                    modalImg.src = this.src;
                    modalImg.alt = this.alt;
                }
            });
        });
    }


    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

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
    // ENVOI DE MESSAGE
    // ========================================
    async function sendMessage() {
        const message = userInput.value.trim();

        if (!message || isSending) return;
        if (!currentSessionId) {
            await createNewConversation();
        }

        isSending = true;
        userInput.disabled = true;
        sendBtn.disabled = true;

        addMessage(message, true);
        userInput.value = '';
        userInput.style.height = 'auto';

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

                attachImageListeners();

                // Récupérer l'historique complet
                try {
                    const historyResponse = await fetch(`/api/conversations/${currentSessionId}`);
                    const historyData = await historyResponse.json();

                    if (historyData.success && historyData.messages) {
                        // Générer un titre si c'est le premier message
                        let title = chatTitle.textContent;
                        if (title === 'Découvrir le BTS SIO' || title === 'Nouvelle conversation') {
                            title = message.substring(0, 40) + (message.length > 40 ? '...' : '');
                            chatTitle.textContent = title;
                        }

                        updateConversation(currentSessionId, title, historyData.messages);
                    }
                } catch (historyError) {
                    console.error('Erreur lors de la récupération de l\'historique:', historyError);
                    // Continuer même si l'historique ne peut pas être récupéré
                }

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
    userInput.addEventListener('input', function () {
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

        if (typeof marked === 'undefined') {
            console.warn('⚠️ Marked.js non chargé');
        }

        if (typeof hljs === 'undefined') {
            console.warn('⚠️ Highlight.js non chargé');
        }

        setupImageModal();

        loadConversations();
        await createNewConversation();
    });

})();
