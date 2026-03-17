import { Request, Response } from 'express';
import { db } from '../config/database';
import { generatePDF, savePDFMetadata, getPDFPath, deletePDF } from '../services/pdfService';
import { GeneratePDFRequest } from '../types/models';

/**
 * Generate PDF from document
 */
export const generatePDFFromDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { settings }: GeneratePDFRequest = req.body;

    // Get document
    const document = await new Promise<any>((resolve, reject) => {
      db.get('SELECT * FROM documents WHERE id = ?', [documentId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }

    // Get project details
    const project = await new Promise<any>((resolve, reject) => {
      db.get('SELECT * FROM projects WHERE id = ?', [document.project_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    // Generate PDF
    const pdfResult = await generatePDF({
      documentId: document.id,
      projectId: project.id,
      projectTitle: project.title,
      authorName: project.author_name,
      content: document.content || '',
      settings,
    });

    // Save PDF metadata
    const pdfId = await savePDFMetadata(
      document.id,
      pdfResult.filename,
      settings || {},
      pdfResult.fileSize,
      pdfResult.pageCount
    );

    // Get the created PDF record
    const pdf = await new Promise<any>((resolve, reject) => {
      db.get('SELECT * FROM pdfs WHERE id = ?', [pdfId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.status(201).json({
      success: true,
      data: pdf,
      message: 'PDF generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF',
      message: error.message,
    });
  }
};

/**
 * Get PDFs for a document
 */
export const getPDFsByDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    const pdfs = await new Promise<any[]>((resolve, reject) => {
      db.all(
        'SELECT * FROM pdfs WHERE document_id = ? ORDER BY created_at DESC',
        [documentId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({
      success: true,
      data: pdfs,
    });
  } catch (error: any) {
    console.error('Error fetching PDFs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch PDFs',
      message: error.message,
    });
  }
};

/**
 * Download PDF file
 */
export const downloadPDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pdf = await new Promise<any>((resolve, reject) => {
      db.get('SELECT * FROM pdfs WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!pdf) {
      return res.status(404).json({
        success: false,
        error: 'PDF not found',
      });
    }

    const filePath = getPDFPath(pdf.filename);

    res.download(filePath, pdf.filename, (err) => {
      if (err) {
        console.error('Error downloading PDF:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Failed to download PDF',
          });
        }
      }
    });
  } catch (error: any) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download PDF',
      message: error.message,
    });
  }
};

/**
 * Delete PDF
 */
export const deletePDFById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pdf = await new Promise<any>((resolve, reject) => {
      db.get('SELECT * FROM pdfs WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!pdf) {
      return res.status(404).json({
        success: false,
        error: 'PDF not found',
      });
    }

    // Delete file
    deletePDF(pdf.filename);

    // Delete from database
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM pdfs WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      success: true,
      message: 'PDF deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete PDF',
      message: error.message,
    });
  }
};
