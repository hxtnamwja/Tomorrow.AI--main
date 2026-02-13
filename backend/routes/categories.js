import { Router } from 'express';
import { runQuery, getRow, getAllRows } from '../database.js';

const router = Router();

const mapCategoryRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    communityId: row.community_id || undefined,
    createdAt: row.created_at
  };
};

// GET /categories
router.get('/', async (req, res) => {
  const { layer, communityId } = req.query;
  
  try {
    let query = 'SELECT * FROM categories WHERE 1=1';
    const params = [];
    
    if (layer === 'general') {
      query += ' AND community_id IS NULL';
    } else if (layer === 'community' && communityId) {
      query += ' AND community_id = ?';
      params.push(communityId);
    }
    
    query += ' ORDER BY created_at ASC';
    
    const categories = await getAllRows(query, params);
    res.json({ code: 200, message: 'Success', data: categories.map(mapCategoryRow) });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /categories
router.post('/', async (req, res) => {
  const { name, parentId, communityId } = req.body;
  
  const id = 'cat-' + Date.now();
  const now = Date.now();
  
  try {
    await runQuery(`
      INSERT INTO categories (id, name, parent_id, community_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [id, name, parentId || null, communityId || null, now]);
    
    const category = await getRow('SELECT * FROM categories WHERE id = ?', [id]);
    res.json({ code: 200, message: 'Success', data: mapCategoryRow(category) });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// DELETE /categories/:id
router.delete('/:id', async (req, res) => {
  try {
    // SQLite with foreign key constraints will handle cascade delete
    const result = await runQuery('DELETE FROM categories WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: 'Category not found', data: null });
    }
    
    res.json({ code: 200, message: 'Deleted successfully', data: null });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

export default router;
