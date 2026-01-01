// Variables globales
let currentSessionId = null;

// Éléments du DOM
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const loading = document.getElementById('loading');
const newChatBtn = document.getElementById('newChatBtn');
const chatTitle = document.getElementById('chatTitle');
const sessionInfo = document.getElementById('sessionInfo');

// Configuration de Marked.js
marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: false,
    mangle: false
});

// Fonction pour formater l'heure
function formatTime(isoDate) {
    return new Date(isoDate).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Fonction pour échapper le HTML
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
            
            // Réinitialiser l'interface
            chatContainer.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-chat-dots empty-icon"></i>
                    <h4 class="mt-3">Nouvelle conversation</h4>
                    <p class="text-muted">Posez votre première question pour commencer</p>
                </div>
            `;
            
            chatTitle.textContent = 'Nouvelle conversation';
            sessionInfo.textContent = `Session: ${currentSessionId.substring(0, 8)}...`;
            
            // Activer l'input
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
            
            showAlert('Nouvelle conversation créée', 'success');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showAlert('Erreur lors de la création de la conversation', 'danger');
    }
}

// Envoyer un message
async function sendMessage() {
    const message = userInput.value.trim();

    if (!message) return;

    if (!currentSessionId) {
        showAlert('Veuillez créer une nouvelle conversation', 'warning');
        return;
    }

    // Désactiver l'input pendant l'envoi
    userInput.disabled = true;
    sendBtn.disabled = true;

    // Supprimer l'empty state si présent
    const emptyState = chatContainer.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }

    // Afficher le message de l'utilisateur
    addMessage(message, true);

    // Vider l'input
    userInput.value = '';

    // Afficher le loading
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

        // Masquer le loading
        loading.classList.add('d-none');

        if (data.success) {
            // Afficher la réponse de l'assistant
            addMessage(data.response, false);
            
            // Mettre à jour le titre si c'est le premier message
            if (data.isFirstMessage && data.title) {
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
        // Réactiver l'input
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

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
    
    // Appliquer la coloration syntaxique
    if (!isUser && typeof hljs !== 'undefined') {
        messageDiv.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }
    
    if (scroll) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// Afficher une alerte
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

// Message de bienvenue au chargement
console.log('✅ Assistant IA - Saint Louis Collège chargé');
