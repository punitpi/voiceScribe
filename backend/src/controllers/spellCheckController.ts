import { Request, Response } from 'express';
import {
  checkText,
  correctText,
  addToCustomDictionary,
  removeFromCustomDictionary,
  getCustomDictionary,
  getWordStats
} from '../services/spellCheckService';

/**
 * Check text for spelling errors
 */
export const checkSpelling = async (req: Request, res: Response) => {
  try {
    const { text, language = 'en', projectId = null, userId = null } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const errors = await checkText(text, userId, projectId, language);

    res.json({
      success: true,
      data: {
        errors,
        errorCount: errors.length
      }
    });
  } catch (error: any) {
    console.error('Spell check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check spelling',
      message: error.message
    });
  }
};

/**
 * Auto-correct text
 */
export const autoCorrect = async (req: Request, res: Response) => {
  try {
    const { text, language = 'en' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const correctedText = await correctText(text, language);

    res.json({
      success: true,
      data: {
        originalText: text,
        correctedText
      }
    });
  } catch (error: any) {
    console.error('Auto-correct error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to auto-correct text',
      message: error.message
    });
  }
};

/**
 * Get word statistics
 */
export const getStats = async (req: Request, res: Response) => {
  try {
    const { text, projectId = null, userId = null } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const stats = await getWordStats(text, userId, projectId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Word stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get word statistics',
      message: error.message
    });
  }
};

/**
 * Add word to custom dictionary
 */
export const addWord = async (req: Request, res: Response) => {
  try {
    const { word, language = 'en', projectId = null, userId = null } = req.body;

    if (!word) {
      return res.status(400).json({
        success: false,
        error: 'Word is required'
      });
    }

    await addToCustomDictionary(userId, projectId, word, language);

    res.json({
      success: true,
      message: `Word "${word}" added to custom dictionary`
    });
  } catch (error: any) {
    console.error('Add word error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add word to dictionary',
      message: error.message
    });
  }
};

/**
 * Remove word from custom dictionary
 */
export const removeWord = async (req: Request, res: Response) => {
  try {
    const { word, projectId = null, userId = null } = req.body;

    if (!word) {
      return res.status(400).json({
        success: false,
        error: 'Word is required'
      });
    }

    await removeFromCustomDictionary(userId, projectId, word);

    res.json({
      success: true,
      message: `Word "${word}" removed from custom dictionary`
    });
  } catch (error: any) {
    console.error('Remove word error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove word from dictionary',
      message: error.message
    });
  }
};

/**
 * Get custom dictionary words
 */
export const getDictionary = async (req: Request, res: Response) => {
  try {
    const { projectId = null, userId = null } = req.query;

    const words = await getCustomDictionary(
      userId ? Number(userId) : null,
      projectId ? Number(projectId) : null
    );

    res.json({
      success: true,
      data: words
    });
  } catch (error: any) {
    console.error('Get dictionary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get custom dictionary',
      message: error.message
    });
  }
};
