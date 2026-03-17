import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { db } from '../config/database';
import { PDFSettings } from '../types/models';

const PDFS_DIR = path.join(process.cwd(), 'data', 'pdfs');

// Ensure PDFs directory exists
if (!fs.existsSync(PDFS_DIR)) {
  fs.mkdirSync(PDFS_DIR, { recursive: true });
}

interface GeneratePDFOptions {
  documentId: number;
  projectId: number;
  projectTitle: string;
  authorName?: string;
  content: string;
  settings?: Partial<PDFSettings>;
}

const DEFAULT_SETTINGS: PDFSettings = {
  pageSize: 'A4',
  fontSize: 12,
  lineSpacing: 1.5,
  includeHeader: true,
  includePageNumbers: true,
  margins: {
    top: 72,    // 1 inch
    bottom: 72,
    left: 72,
    right: 72,
  },
};

export const generatePDF = async (options: GeneratePDFOptions): Promise<{
  filename: string;
  filePath: string;
  fileSize: number;
  pageCount: number;
}> => {
  const settings: PDFSettings = {
    ...DEFAULT_SETTINGS,
    ...options.settings,
    margins: {
      ...DEFAULT_SETTINGS.margins,
      ...(options.settings?.margins || {}),
    },
  };

  const filename = `${options.projectTitle.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
  const filePath = path.join(PDFS_DIR, filename);

  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: settings.pageSize,
        margins: settings.margins,
        bufferPages: true, // Enable page buffering for page count
      });

      // Pipe to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      let currentPage = 1;

      // Add header function
      const addHeader = () => {
        if (settings.includeHeader) {
          doc
            .fontSize(10)
            .font('Helvetica')
            .text(options.projectTitle, settings.margins.left, settings.margins.top - 40, {
              align: 'left',
            });

          if (options.authorName) {
            doc.text(options.authorName, settings.margins.left, settings.margins.top - 40, {
              align: 'right',
            });
          }

          // Draw line under header
          doc
            .moveTo(settings.margins.left, settings.margins.top - 20)
            .lineTo(doc.page.width - settings.margins.right, settings.margins.top - 20)
            .stroke();
        }
      };

      // Add footer function with page numbers
      const addFooter = () => {
        if (settings.includePageNumbers) {
          const pageWidth = doc.page.width;
          const pageHeight = doc.page.height;

          doc
            .fontSize(10)
            .font('Helvetica')
            .text(
              `${currentPage}`,
              settings.margins.left,
              pageHeight - settings.margins.bottom + 20,
              {
                width: pageWidth - settings.margins.left - settings.margins.right,
                align: 'center',
              }
            );
        }
      };

      // Add title page
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(options.projectTitle, {
          align: 'center',
        });

      doc.moveDown(2);

      if (options.authorName) {
        doc
          .fontSize(16)
          .font('Helvetica')
          .text(`by ${options.authorName}`, {
            align: 'center',
          });
      }

      doc.moveDown(4);

      // Add content
      const paragraphs = options.content.split(/\n\n+/);

      doc
        .fontSize(settings.fontSize)
        .font('Times-Roman')
        .lineGap(settings.fontSize * (settings.lineSpacing - 1));

      paragraphs.forEach((paragraph, index) => {
        if (paragraph.trim()) {
          // Check if we need a new page
          const linesInParagraph = Math.ceil(
            doc.heightOfString(paragraph, {
              width: doc.page.width - settings.margins.left - settings.margins.right,
            }) / (settings.fontSize * settings.lineSpacing)
          );

          const spaceLeft = doc.page.height - doc.y - settings.margins.bottom;
          const spaceNeeded = linesInParagraph * settings.fontSize * settings.lineSpacing;

          if (spaceNeeded > spaceLeft && doc.y > settings.margins.top) {
            addFooter();
            doc.addPage();
            currentPage++;
            addHeader();
            doc.moveDown(2);
          }

          doc.text(paragraph.trim(), {
            align: 'justify',
            indent: 36, // First line indent
          });

          if (index < paragraphs.length - 1) {
            doc.moveDown();
          }
        }
      });

      // Add footer to last page
      addFooter();

      // Finalize the PDF
      doc.end();

      stream.on('finish', () => {
        const stats = fs.statSync(filePath);
        const pageCount = (doc as any).bufferedPageRange().count;

        resolve({
          filename,
          filePath,
          fileSize: stats.size,
          pageCount,
        });
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

export const savePDFMetadata = async (
  documentId: number,
  filename: string,
  settings: Partial<PDFSettings>,
  fileSize: number,
  pageCount: number
): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO pdfs (document_id, filename, settings, file_size, page_count)
       VALUES (?, ?, ?, ?, ?)`,
      [documentId, filename, JSON.stringify(settings), fileSize, pageCount],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

export const getPDFPath = (filename: string): string => {
  return path.join(PDFS_DIR, filename);
};

export const deletePDF = (filename: string): void => {
  const filePath = getPDFPath(filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};
