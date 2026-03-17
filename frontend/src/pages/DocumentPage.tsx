import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MergeIcon from '@mui/icons-material/Merge';
import AddIcon from '@mui/icons-material/Add';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { projectsApi, documentsApi, pdfsApi } from '../services/api';
import type { Project, Document, PDFSettings } from '../types';
import TextEditor from '../components/TextEditor';
import PDFSettingsDialog from '../components/PDFSettingsDialog';

export default function DocumentPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [combining, setCombining] = useState(false);
  const [combineSuccess, setCombineSuccess] = useState<string | null>(null);
  const [combineConfirmOpen, setCombineConfirmOpen] = useState(false);
  const [appending, setAppending] = useState(false);
  const [appendSuccess, setAppendSuccess] = useState<string | null>(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState<string | null>(null);

  // Auto-dismiss success messages after 10 seconds
  useEffect(() => {
    if (combineSuccess) {
      const timer = setTimeout(() => {
        setCombineSuccess(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [combineSuccess]);

  useEffect(() => {
    if (appendSuccess) {
      const timer = setTimeout(() => {
        setAppendSuccess(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [appendSuccess]);

  useEffect(() => {
    if (pdfSuccess) {
      const timer = setTimeout(() => {
        setPdfSuccess(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [pdfSuccess]);

  // Fetch project and document
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch project
        const projectRes = await projectsApi.getById(Number(projectId));
        if (projectRes.data.success && projectRes.data.data) {
          setProject(projectRes.data.data);
        }

        // Fetch document
        const docRes = await documentsApi.getByProject(Number(projectId));
        if (docRes.data.success && docRes.data.data) {
          setDocument(docRes.data.data);
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.error || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const handleSave = async (content: string) => {
    if (!projectId) return;

    try {
      const response = await documentsApi.update(Number(projectId), content);
      if (response.data.success && response.data.data) {
        setDocument(response.data.data);
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to save document');
    }
  };

  const handleCombineTranscriptions = async () => {
    if (!projectId) return;

    try {
      setCombining(true);
      setCombineSuccess(null);
      setError(null);
      setCombineConfirmOpen(false);

      const response = await documentsApi.combineTranscriptions(Number(projectId));
      if (response.data.success && response.data.data) {
        setDocument(response.data.data);
        setCombineSuccess(response.data.message || 'Transcriptions combined successfully');
      }
    } catch (err: any) {
      console.error('Error combining transcriptions:', err);
      setError(err.response?.data?.error || 'Failed to combine transcriptions');
    } finally {
      setCombining(false);
    }
  };

  const handleAppendNewTranscriptions = async () => {
    if (!projectId) return;

    try {
      setAppending(true);
      setAppendSuccess(null);
      setError(null);

      const response = await documentsApi.appendNewTranscriptions(Number(projectId));
      if (response.data.success && response.data.data) {
        setDocument(response.data.data);
        setAppendSuccess(response.data.message || 'New transcriptions appended successfully');
      }
    } catch (err: any) {
      console.error('Error appending transcriptions:', err);
      setError(err.response?.data?.error || 'No new transcriptions to append');
    } finally {
      setAppending(false);
    }
  };

  const handleGeneratePDF = async (settings: Partial<PDFSettings>) => {
    if (!document?.id) return;

    try {
      setGeneratingPDF(true);
      setPdfSuccess(null);
      setError(null);

      const response = await pdfsApi.generate(document.id, settings);
      if (response.data.success && response.data.data) {
        setPdfSuccess('PDF generated successfully! Downloading...');
        setPdfDialogOpen(false);

        // Trigger download
        const downloadResponse = await pdfsApi.download(response.data.data.id!);
        const url = window.URL.createObjectURL(new Blob([downloadResponse.data]));
        const link = window.document.createElement('a');
        link.href = url;
        link.setAttribute('download', response.data.data.filename);
        window.document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setError(err.response?.data?.error || 'Failed to generate PDF');
      setPdfDialogOpen(false);
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={48} />
        </Box>
      </Container>
    );
  }

  if (error && !document) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/project/${projectId}`)}
          sx={{ mt: 2, minHeight: 48 }}
        >
          Back to Project
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/')}
          sx={{ cursor: 'pointer', fontSize: '1.125rem' }}
        >
          Dashboard
        </Link>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate(`/project/${projectId}`)}
          sx={{ cursor: 'pointer', fontSize: '1.125rem' }}
        >
          {project?.title || 'Project'}
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '1.125rem' }}>
          Document
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Edit Document
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => setPdfDialogOpen(true)}
            size="large"
          >
            Generate PDF
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={appending ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
            onClick={handleAppendNewTranscriptions}
            disabled={appending}
            size="large"
          >
            {appending ? 'Adding...' : 'Add New Transcriptions'}
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={combining ? <CircularProgress size={20} color="inherit" /> : <MergeIcon />}
            onClick={() => setCombineConfirmOpen(true)}
            disabled={combining}
            size="large"
          >
            {combining ? 'Combining...' : 'Replace All (Combine)'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/project/${projectId}`)}
            size="large"
          >
            Back to Project
          </Button>
        </Box>
      </Box>

      {/* Success messages */}
      {combineSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setCombineSuccess(null)}>
          {combineSuccess}
        </Alert>
      )}
      {appendSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setAppendSuccess(null)}>
          {appendSuccess}
        </Alert>
      )}
      {pdfSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPdfSuccess(null)}>
          {pdfSuccess}
        </Alert>
      )}

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Info */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Auto-save:</strong> Your changes are automatically saved every few seconds.
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Add New Transcriptions:</strong> Appends only new transcriptions to your existing content (preserves your edits).
        </Typography>
        <Typography variant="body1">
          <strong>Replace All (Combine):</strong> Replaces everything with all transcriptions (⚠️ overwrites your edits).
        </Typography>
      </Paper>

      {/* Editor */}
      {document && (
        <TextEditor
          key={document.id}
          initialContent={document.content || ''}
          onSave={handleSave}
          projectTitle={project?.title}
          autoSaveDelay={3000}
        />
      )}

      {/* Combine Transcriptions Confirmation Dialog */}
      <Dialog
        open={combineConfirmOpen}
        onClose={() => setCombineConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5">⚠️ Warning: This Will Overwrite Your Document</Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '1.125rem', lineHeight: 1.6 }}>
            Combining transcriptions will <strong>replace all current content</strong> in your document
            with the transcriptions from your recordings.
            <br />
            <br />
            Any manual changes you've made will be <strong>permanently lost</strong>.
            <br />
            <br />
            Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setCombineConfirmOpen(false)}
            variant="outlined"
            size="large"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCombineTranscriptions}
            variant="contained"
            color="warning"
            size="large"
          >
            Yes, Replace Content
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Settings Dialog */}
      <PDFSettingsDialog
        open={pdfDialogOpen}
        onClose={() => setPdfDialogOpen(false)}
        onGenerate={handleGeneratePDF}
        generating={generatingPDF}
      />
    </Container>
  );
}
