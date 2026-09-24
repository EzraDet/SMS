import { getById, update } from '../utils/fileHandler.js';
import { success, error } from '../utils/response.js';
import { now } from '../utils/helpers.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

/**
 * Save uploaded photo file path on the entity.
 * URL: POST /api/students/:id/photo   (multipart/form-data, field: "photo")
 * Or:  POST /api/teachers/:id/photo
 */
export function uploadPhoto(collection) {
  return async (req, res, next) => {
    try {
      if (!req.file) return error(res, 'No file uploaded', 400);

      const entity = await getById(collection, req.params.id);
      if (!entity) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return error(res, 'Entity not found', 404);
      }

      const type = collection === 'teachers' ? 'teachers' : 'students';
      const relativePath = `/uploads/${type}/${req.file.filename}`;

      // Delete previous photo if exists
      if (entity.photo) {
        const oldPath = path.join(
          UPLOAD_ROOT,
          entity.photo.replace('/uploads/', '')
        );
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch {}
        }
      }

      const updated = await update(collection, req.params.id, {
        photo: relativePath,
        updatedAt: now(),
      });

      return success(res, updated, 'Photo uploaded');
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Delete a photo.
 */
export function deletePhoto(collection) {
  return async (req, res, next) => {
    try {
      const entity = await getById(collection, req.params.id);
      if (!entity) return error(res, 'Entity not found', 404);

      if (entity.photo) {
        const oldPath = path.join(
          UPLOAD_ROOT,
          entity.photo.replace('/uploads/', '')
        );
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch {}
        }
      }

      const updated = await update(collection, req.params.id, {
        photo: '',
        updatedAt: now(),
      });

      return success(res, updated, 'Photo removed');
    } catch (err) {
      next(err);
    }
  };
}