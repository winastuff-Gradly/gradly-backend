// Routes profil

import express from 'express';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimitUpload } from '../middleware/rateLimit.js';
import { catchAsync } from '../middleware/catchAsync.js';
import { uploadPhoto, getSignedUrl } from '../services/storageService.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /me - Profil complet
router.get('/me',
  authenticate,
  catchAsync(async (req, res) => {
    const { data, error } = await supabase
      .from('profiles_with_subscription')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json(data);
  })
);

// PUT /photo - Upload photo avec cleanup
router.put('/photo',
  authenticate,
  rateLimitUpload,
  upload.single('photo'),
  catchAsync(async (req, res) => {
    const photoPath = await uploadPhoto(req.user.id, req.file);

    await supabase
      .from('profiles')
      .update({ photo_path: photoPath })
      .eq('id', req.user.id);

    res.json({ photo_path: photoPath });
  })
);

// GET /photo-url/:user_id - URL signée
router.get('/photo-url/:user_id',
  authenticate,
  catchAsync(async (req, res) => {
    const { data } = await supabase
      .from('profiles')
      .select('photo_path')
      .eq('id', req.params.user_id)
      .single();

    const url = await getSignedUrl(data?.photo_path);
    res.json({ url });
  })
);

export default router;