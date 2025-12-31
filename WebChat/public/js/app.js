// Variables globales
let currentSessionId = null;

// Éléments du DOM
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const loading = document.getElementById('loading');
const conversationsList = document.getElementById('conversationsList');
const newChatBtn = document.getElementById('newChatBtn');
const chatTitle = document.getElementById('chatTitle');
const sessionInfo = document.getElementById('sessionInfo');

// Fonction pour formater la date
function formatDate(isoDate) {
    const date = new Date(isoDate);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;

    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
    });
}

// Fonction pour formater l'heure
function formatTime(isoDate) {
    return new Date(isoDate).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Charger la liste des conversations
async function loadConversations() {
    try {
        const response = await fetch('/api/conversations');
        const data = await response.json();

        if (data.success) {
            displayConversations(data.conversations);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error);
        showAlert('Erreur lors du chargement des conversations', 'danger');
    }
}

// Afficher la liste des conversations
function displayConversations(conversations) {
    conversationsList.innerHTML = '';

    if (conversations.length === 0) {
        conversationsList.innerHTML = `
            <div class="text-center text-white-50 p-3">
                <i class="bi bi-inbox"></i>
                <p class="small mb-0 mt-2">Aucune conversation</p>
            </div>
        `;
        return;
    }

    conversations.forEach(conv => {
        const item = document.createElement('div');
        item.className = 'conversation-item';
        if (conv.id === currentSessionId) {
            item.classList.add('active');
        }

        item.innerHTML = `
            <div class="conversation-title">${conv.title}</div>
            <div class="conversation-meta">
                <i class="bi bi-clock"></i> ${formatDate(conv.createdAt)} • 
                <i class="bi bi-chat"></i> ${conv.messageCount}
            </div>
            <button class="delete-btn" onclick="deleteConversation('${conv.id}', event)" title="Supprimer">
                <i class="bi bi-x"></i>
            </button>
        `;

        item.onclick = (e) => {
            if (!e.target.closest('.delete-btn')) {
                loadConversation(conv.id);
            }
        };

        conversationsList.appendChild(item);
    });
}

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
            chatContainer.innerHTML = '';
            addMessage('Bonjour ! Je suis votre assistant pédagogique du Saint Louis Collège. Comment puis-je vous aider dans vos apprentissages aujourd\'hui ? 📚', false);

            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();

            chatTitle.textContent = 'Nouvelle conversation';
            sessionInfo.textContent = 'Conversation active';

            await loadConversations();
        }
    } catch (error) {
        console.error('Erreur lors de la création de la conversation:', error);
        showAlert('Erreur lors de la création de la conversation', 'danger');
    }
}

// Charger une conversation existante
async function loadConversation(sessionId) {
    try {
        const response = await fetch(`/api/conversations/${sessionId}`);
        const data = await response.json();

        if (data.success) {
            currentSessionId = sessionId;
            chatContainer.innerHTML = '';

            chatTitle.textContent = data.conversation.title;
            sessionInfo.textContent = `${data.conversation.messages.length} messages • ${formatDate(data.conversation.createdAt)}`;

            if (data.conversation.messages.length === 0) {
                addMessage('Bonjour ! Je suis votre assistant pédagogique du Saint Louis Collège. Comment puis-je vous aider dans vos apprentissages aujourd\'hui ? 📚', false);
            } else {
                data.conversation.messages.forEach(msg => {
                    addMessage(msg.content, msg.role === 'user', msg.timestamp, false);
                });
            }

            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();

            // Mettre à jour l'interface
            document.querySelectorAll('.conversation-item').forEach(item => {
                item.classList.remove('active');
            });
            event.currentTarget?.classList.add('active');

            await loadConversations();
        }
    } catch (error) {
        console.error('Erreur lors du chargement de la conversation:', error);
        showAlert('Erreur lors du chargement de la conversation', 'danger');
    }
}

// Supprimer une conversation
async function deleteConversation(sessionId, event) {
    event.stopPropagation();

    if (!confirm('Voulez-vous vraiment supprimer cette conversation ?')) {
        return;
    }

    try {
        const response = await fetch(`/api/conversations/${sessionId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            if (currentSessionId === sessionId) {
                currentSessionId = null;
                chatContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="bi bi-chat-dots empty-icon"></i>
                        <h4 class="mt-3">Conversation supprimée</h4>
                        <p class="text-muted">Sélectionnez ou créez une nouvelle conversation</p>
                    </div>
                `;
                userInput.disabled = true;
                sendBtn.disabled = true;
                chatTitle.textContent = 'Assistant Pédagogique';
                sessionInfo.textContent = 'Sélectionnez ou créez une conversation';
            }

            await loadConversations();
            showAlert('Conversation supprimée avec succès', 'success');
        }
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showAlert('Erreur lors de la suppression', 'danger');
    }
}

// Fonction pour ajouter un message
// Configuration de Marked.js
marked.setOptions({
    breaks: true, // Convertir les sauts de ligne en <br>
    gfm: true, // GitHub Flavored Markdown
    headerIds: false,
    mangle: false
});

// Fonction pour échapper le HTML (sécurité)
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Fonction pour ajouter un message avec support Markdown
// Fonction pour ajouter un message avec support Markdown
function addMessage(content, isUser, timestamp = null, scroll = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
    
    const time = timestamp ? formatTime(timestamp) : formatTime(new Date().toISOString());
    const icon = isUser ? 'person-fill' : 'robot';
    
    let processedContent;
    if (isUser) {
        processedContent = escapeHtml(content).replace(/\n/g, '<br>');
    } else {
        try {
            processedContent = marked.parse(content);
        } catch (e) {
            console.error('Erreur de parsing Markdown:', e);
            processedContent = escapeHtml(content).replace(/\n/g, '<br>');
        }
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="bi bi-${icon}"></i>
        </div>
        <div class="message-bubble">
            <div class="message-content">${processedContent}</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    
    chatContainer.appendChild(messageDiv);
    
    // Appliquer la coloration syntaxique aux blocs de code
    if (!isUser && typeof hljs !== 'undefined') {
        messageDiv.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }
    
    if (scroll) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}


// Fonction pour envoyer un message
async function sendMessage() {
    const message = userInput.value.trim();

    if (!message || !currentSessionId) return;

    // Afficher le message de l'utilisateur
    addMessage(message, true);
    userInput.value = '';

    // Désactiver l'input et le bouton
    sendBtn.disabled = true;
    userInput.disabled = true;
    loading.classList.remove('d-none');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                sessionId: currentSessionId
            })
        });

        const data = await response.json();

        if (data.success) {
            addMessage(data.response, false);
            await loadConversations();
        } else {
            addMessage('❌ Erreur: ' + (data.error || 'Erreur inconnue'), false);
            showAlert(data.error || 'Erreur lors de l\'envoi du message', 'danger');
        }

    } catch (error) {
        addMessage('❌ Erreur de connexion au serveur', false);
        console.error('Erreur:', error);
        showAlert('Erreur de connexion au serveur', 'danger');
    } finally {
        sendBtn.disabled = false;
        userInput.disabled = false;
        loading.classList.add('d-none');
        userInput.focus();
    }
}

// Afficher une alerte (toast)
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Event listeners
newChatBtn.addEventListener('click', createNewConversation);
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Charger les conversations au démarrage
loadConversations();

// Gestion du responsive (toggle sidebar sur mobile)
if (window.innerWidth < 768) {
    const sidebar = document.querySelector('.sidebar');
    newChatBtn.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });
}
