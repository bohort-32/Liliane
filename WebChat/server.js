const express = require('express');
const { Ollama } = require('ollama');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Configuration Ollama
const ollama = new Ollama({ host: 'http://localhost:11434' });

// Variable pour stocker le prompt système
let SYSTEM_PROMPT = '';

// Chemin du fichier de configuration du prompt
const PROMPT_FILE_PATH = path.join(__dirname, 'config', 'system-prompt.txt');

// Fonction pour charger le prompt système depuis le fichier
async function loadSystemPrompt() {
  try {
    SYSTEM_PROMPT = await fs.readFile(PROMPT_FILE_PATH, 'utf-8');
    console.log('✅ Prompt système chargé avec succès');
    console.log(`📄 Longueur du prompt: ${SYSTEM_PROMPT.length} caractères`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du chargement du prompt système:', error.message);
    // Fallback vers un prompt par défaut
    SYSTEM_PROMPT = `Tu es un assistant pédagogique du Saint Louis Collège.
Tu es bienveillant, patient et expert en éducation.
Tu réponds de manière claire et pédagogique en français.`;
    console.log('⚠️ Utilisation du prompt par défaut');
    return false;
  }
}

// Fonction pour recharger le prompt système (utile pour les modifications à chaud)
async function reloadSystemPrompt() {
  console.log('🔄 Rechargement du prompt système...');
  return await loadSystemPrompt();
}

// Fonction pour sauvegarder le prompt système
async function saveSystemPrompt(newPrompt) {
  try {
    await fs.writeFile(PROMPT_FILE_PATH, newPrompt, 'utf-8');
    SYSTEM_PROMPT = newPrompt;
    console.log('✅ Prompt système sauvegardé');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde du prompt:', error.message);
    return false;
  }
}

// Stockage des conversations (en mémoire)
const conversations = new Map();

// Générer un ID de session
function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Route pour créer une nouvelle conversation
app.post('/api/conversations/new', (req, res) => {
  const sessionId = generateSessionId();
  conversations.set(sessionId, {
    id: sessionId,
    createdAt: new Date().toISOString(),
    messages: [],
    title: 'Nouvelle conversation'
  });
  
  res.json({ 
    success: true, 
    sessionId,
    message: 'Nouvelle conversation créée'
  });
});

// Route pour récupérer toutes les conversations
app.get('/api/conversations', (req, res) => {
  const allConversations = Array.from(conversations.values()).map(conv => ({
    id: conv.id,
    title: conv.title || 'Nouvelle conversation',
    lastMessage: conv.messages.length > 0 
      ? conv.messages[conv.messages.length - 1].content.substring(0, 50)
      : '',
    timestamp: conv.createdAt,
    messageCount: conv.messages.length
  }));

  res.json({
    success: true,
    conversations: allConversations
  });
});


// Route pour récupérer une conversation spécifique
app.get('/api/conversations/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const conversation = conversations.get(sessionId);

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: 'Conversation non trouvée'
    });
  }

  res.json({
    success: true,
    sessionId: conversation.id,
    title: conversation.title || 'Nouvelle conversation',
    createdAt: conversation.createdAt,
    messages: conversation.messages || [] // S'assurer que messages existe toujours
  });
});


// Route pour récupérer une conversation spécifique
app.get('/api/conversations/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const conversation = conversations.get(sessionId);

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: 'Conversation non trouvée'
    });
  }

  res.json({
    success: true,
    conversation: {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      messages: conversation.messages
    },
    messages: conversation.messages
  });
});


// Route pour supprimer une conversation
app.delete('/api/conversations/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  if (conversations.delete(sessionId)) {
    res.json({ 
      success: true, 
      message: 'Conversation supprimée' 
    });
  } else {
    res.status(404).json({ 
      success: false, 
      error: 'Conversation non trouvée' 
    });
  }
});

// Route pour interroger Ollama avec historique
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID requis' });
    }

    // Vérifier que le prompt système est chargé
    if (!SYSTEM_PROMPT) {
      await loadSystemPrompt();
    }

    // Récupérer ou créer la conversation
    let conversation = conversations.get(sessionId);
    if (!conversation) {
      conversation = {
        id: sessionId,
        createdAt: new Date().toISOString(),
        messages: [],
        title: message.substring(0, 50)
      };
      conversations.set(sessionId, conversation);
    }

    // Mettre à jour le titre si c'est le premier message
    if (conversation.messages.length === 0) {
      conversation.title = message.substring(0, 50);
    }

    console.log('Question reçue:', message);

    // Construire l'historique des messages pour Ollama
    const ollamaMessages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      ...conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    // Appel à Ollama avec l'historique complet
    const response = await ollama.chat({
      model: 'llama3.2',
      messages: ollamaMessages,
      stream: false
    });

    console.log('Réponse Ollama:', response.message.content);

    // Sauvegarder les messages dans l'historique
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    conversation.messages.push({
      role: 'assistant',
      content: response.message.content,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      response: response.message.content,
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Erreur Ollama:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la communication avec Ollama',
      details: error.message
    });
  }
});

// Route pour lister les modèles disponibles
app.get('/api/models', async (req, res) => {
  try {
    const models = await ollama.list();
    res.json({ models: models.models });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NOUVELLES ROUTES POUR GÉRER LE PROMPT SYSTÈME

// Route pour obtenir le prompt système actuel (ADMIN)
app.get('/api/admin/prompt', (req, res) => {
  res.json({
    success: true,
    prompt: SYSTEM_PROMPT,
    length: SYSTEM_PROMPT.length,
    file: PROMPT_FILE_PATH
  });
});

// Route pour mettre à jour le prompt système (ADMIN)
app.put('/api/admin/prompt', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt requis' 
      });
    }

    const saved = await saveSystemPrompt(prompt);

    if (saved) {
      res.json({
        success: true,
        message: 'Prompt système mis à jour',
        length: SYSTEM_PROMPT.length
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la sauvegarde'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour recharger le prompt depuis le fichier (ADMIN)
app.post('/api/admin/prompt/reload', async (req, res) => {
  const success = await reloadSystemPrompt();
  
  res.json({
    success,
    message: success ? 'Prompt rechargé avec succès' : 'Erreur lors du rechargement',
    prompt: SYSTEM_PROMPT,
    length: SYSTEM_PROMPT.length
  });
});

// Nettoyer les vieilles conversations (24 heures)
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000;
  
  for (const [sessionId, conv] of conversations.entries()) {
    const age = now - new Date(conv.createdAt).getTime();
    if (age > maxAge) {
      conversations.delete(sessionId);
      console.log(`Conversation ${sessionId} supprimée (trop ancienne)`);
    }
  }
}, 60 * 60 * 1000);

// Fonction pour initialiser le serveur
async function startServer() {
  // Charger le prompt système au démarrage
  await loadSystemPrompt();
  
  // Démarrer le serveur
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║        🎓 Saint Louis Collège - Assistant IA           ║
╠════════════════════════════════════════════════════════╣
║  🚀 Serveur démarré sur http://localhost:${PORT}         ║
║  📝 Prompt chargé depuis: ${path.basename(PROMPT_FILE_PATH)}           ║
║  🤖 Modèle Ollama: llama3.2                            ║
║  💾 Historique des conversations: activé               ║
║  🔄 Nettoyage auto: 24 heures                          ║
╚════════════════════════════════════════════════════════╝
    `);
  });
}

// Lancer le serveur
startServer();
