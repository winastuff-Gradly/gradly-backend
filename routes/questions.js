// Routes questions (74 questions par paliers)

import express from 'express';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { catchAsync } from '../middleware/catchAsync.js';
import logger from '../config/logger.js';

const router = express.Router();

// GET /palier/:palier - 10 questions d'un palier
router.get('/palier/:palier',
  authenticate,
  catchAsync(async (req, res) => {
    const palier = parseInt(req.params.palier);

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('palier', palier)
      .order('question_order');

    if (error) throw error;

    res.json({ questions: data });
  })
);

// POST /answers - Sauvegarder réponses
router.post('/answers',
  authenticate,
  catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { answers } = req.body; // Array de { question_id, answer }

    // Insérer les réponses
    const answersData = answers.map(a => ({
      user_id: userId,
      question_id: a.question_id,
      answer: a.answer,
    }));

    const { error } = await supabase
      .from('user_answers')
      .upsert(answersData, { onConflict: 'user_id,question_id' });

    if (error) throw error;

    // Mettre à jour questions_answered
    const { data: profile } = await supabase
      .from('profiles')
      .select('questions_answered')
      .eq('id', userId)
      .single();

    const newCount = (profile?.questions_answered || 0) + answers.length;

    await supabase
      .from('profiles')
      .update({ questions_answered: newCount })
      .eq('id', userId);

    logger.info(`✅ ${answers.length} réponses sauvegardées pour user ${userId}`);

    res.json({
      message: 'Réponses sauvegardées',
      questions_answered: newCount,
    });
  })
);

// GET /all - Toutes les 74 questions
router.get('/all',
  authenticate,
  catchAsync(async (req, res) => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('question_order');

    if (error) throw error;

    res.json({ questions: data });
  })
);

export default router;