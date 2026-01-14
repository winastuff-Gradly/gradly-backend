// ⭐⭐⭐ CRITIQUE : Routes chat avec défloutage serveur +1%

import express from 'express';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimitChat } from '../middleware/rateLimit.js';
import { catchAsync } from '../middleware/catchAsync.js';
import { sanitizeString } from '../middleware/sanitize.js';
import logger from '../config/logger.js';

const router = express.Router();

// ⭐⭐⭐ POST /start - Démarrer une conversation
router.post('/start',
  authenticate,
  catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { match_id } = req.body;

    // Appeler la RPC start_conversation qui gère tout
    const { data, error } = await supabase.rpc('start_conversation', {
      p_user1_id: userId,
      p_user2_id: req.body.user2_id,
      p_match_id: match_id,
    });

    if (error) {
      logger.error('Erreur start_conversation:', error);
      return res.status(400).json({
        error: 'Impossible de démarrer la conversation',
        message: error.message,
      });
    }

    // Insérer message système de bienvenue
    const conversationId = data.conversation_id;
    
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: null, // Message système
        content: '🎉 Bienvenue dans votre conversation Gradly ! Soyez authentique, respectueux et amusez-vous bien ! 💬',
        is_system: true,
      });

    logger.info(`✅ Conversation démarrée: ${conversationId}`);

    res.json({
      message: 'Conversation démarrée !',
      conversation_id: conversationId,
      credits_remaining: data.credits_remaining,
    });
  })
);

// ⭐⭐⭐ POST /send - Envoyer un message (+1% défloutage)
router.post('/send',
  authenticate,
  rateLimitChat,
  catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { conversation_id, content } = req.body;

    // Sanitize le contenu
    const sanitizedContent = sanitizeString(content);

    // Insérer le message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_id: userId,
        content: sanitizedContent,
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Erreur insertion message:', insertError);
      return res.status(400).json({
        error: 'Impossible d\'envoyer le message',
      });
    }

    // ⭐⭐⭐ CRITIQUE : +1% défloutage serveur
    const { data: conversation } = await supabase
      .from('conversations')
      .select('deflouting_progress, messages_count')
      .eq('id', conversation_id)
      .single();

    const newProgress = Math.min((conversation?.deflouting_progress || 0) + 1, 100);
    const newCount = (conversation?.messages_count || 0) + 1;

    await supabase
      .from('conversations')
      .update({
        deflouting_progress: newProgress,
        messages_count: newCount,
        last_activity: new Date().toISOString(),
      })
      .eq('id', conversation_id);

    logger.info(`💬 Message envoyé: conversation=${conversation_id} progress=${newProgress}%`);

    res.json({
      message: 'Message envoyé',
      data: message,
      deflouting_progress: newProgress,
    });
  })
);

// GET /:id/messages - Récupérer messages (pagination)
router.get('/:id/messages',
  authenticate,
  catchAsync(async (req, res) => {
    const conversationId = req.params.id;
    const { cursor, limit = 50 } = req.query;

    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      messages: data.reverse(), // Inverser pour avoir ordre chronologique
      has_more: data.length === parseInt(limit),
      cursor: data.length > 0 ? data[0].created_at : null,
    });
  })
);

// POST /:id/end - Terminer conversation
router.post('/:id/end',
  authenticate,
  catchAsync(async (req, res) => {
    const conversationId = req.params.id;
    const userId = req.user.id;

    // Appeler RPC end_conversation
    const { error } = await supabase.rpc('end_conversation', {
      p_conversation_id: conversationId,
      p_ended_by_user_id: userId,
    });

    if (error) {
      logger.error('Erreur end_conversation:', error);
      return res.status(400).json({
        error: 'Impossible de terminer la conversation',
      });
    }

    logger.info(`✅ Conversation terminée: ${conversationId} par user ${userId}`);

    res.json({
      message: 'Conversation terminée',
    });
  })
);

export default router;