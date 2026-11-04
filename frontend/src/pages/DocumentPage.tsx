import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { projectsApi, documentsApi, pdfsApi, recordingsApi } from '../services/api';
import type { Project, Document, PDFSettings } from '../types';
import { getErrorMessage } from '../utils/getErrorMessage';
import TextEditor from '../components/TextEditor';
import PDFSettingsDialog from '../components/PDFSettingsDialog';
import { COLORS } from '../theme/theme';

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
  const [newTranscriptionsDialog, setNewTranscriptionsDialog] = useState(false);

  const autoDismiss = useCallback((setter: (v: null) => void, ms = 10000) => {
    const t = setTimeout(() => setter(null), ms);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => { if (combineSuccess) return autoDismiss(setCombineSuccess); }, [combineSuccess, autoDismiss]);
  useEffect(() => { if (appendSuccess) return autoDismiss(setAppendSuccess); }, [appendSuccess, autoDismiss]);
  useEffect(() => { if (pdfSuccess) return autoDismiss(setPdfSuccess); }, [pdfSuccess, autoDismiss]);

  useEffect(() => {
    if (!projectId) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const [projectRes, docRes, recordingsRes] = await Promise.all([
          projectsApi.getById(Number(projectId)),
          documentsApi.getByProject(Number(projectId)),
          recordingsApi.getByProject(Number(projectId)),
        ]);
        if (projectRes.data.success && projectRes.data.data) setProject(projectRes.data.data);
        const doc = docRes.data.success ? docRes.data.data : null;
        if (doc) setDocument(doc);

        // Check if any completed recordings exist that were created after the document was last updated
        if (doc && recordingsRes.data.success && recordingsRes.data.data) {
          const docTimestamp = doc.updated_at ?? doc.created_at ?? '';
          const hasNew = recordingsRes.data.data.some(
            (r) => r.status === 'completed' && (r.created_at ?? '') > docTimestamp
          );
          if (hasNew) setNewTranscriptionsDialog(true);
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'Failed to load document'));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [projectId]);

  const handleSave = async (content: string) => {
    if (!projectId) return;
    const response = await documentsApi.update(Number(projectId), content);
    if (response.data.success && response.data.data) setDocument(response.data.data);
  };

  const handleCombine = async () => {
    if (!projectId) return;
    try {
      setCombining(true);
      setCombineConfirmOpen(false);
      const response = await documentsApi.combineTranscriptions(Number(projectId));
      if (response.data.success && response.data.data) {
        setDocument(response.data.data);
        setCombineSuccess(response.data.message || 'All transcriptions combined');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to combine transcriptions'));
    } finally {
      setCombining(false);
    }
  };

  const handleAppend = async () => {
    if (!projectId) return;
    try {
      setAppending(true);
      const response = await documentsApi.appendNewTranscriptions(Number(projectId));
      if (response.data.success && response.data.data) {
        setDocument(response.data.data);
        setAppendSuccess(response.data.message || 'New transcriptions appended');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No new transcriptions to append'));
    } finally {
      setAppending(false);
    }
  };

  const handleGeneratePDF = async (settings: Partial<PDFSettings>) => {
    if (!document?.id) return;
    try {
      setGeneratingPDF(true);
      const response = await pdfsApi.generate(document.id, settings);
      if (response.data.success && response.data.data) {
        setPdfSuccess('PDF ready — downloading…');
        setPdfDialogOpen(false);
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
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to generate PDF'));
      setPdfDialogOpen(false);
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={40} />
        </Box>
      </Container>
    );
  }

  if (error && !document) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(`/project/${projectId}`)}>
          Back to project
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      {/* Breadcrumb */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', mb: 4 }}>
        <Box
          onClick={() => navigate('/')}
          sx={{ cursor: 'pointer', color: COLORS.inkFaint, fontSize: '0.875rem', '&:hover': { color: COLORS.gold } }}
        >
          Library
        </Box>
        <Box sx={{ color: COLORS.border, fontSize: '0.875rem' }}>/</Box>
        <Box
          onClick={() => navigate(`/project/${projectId}`)}
          sx={{ cursor: 'pointer', color: COLORS.inkFaint, fontSize: '0.875rem', '&:hover': { color: COLORS.gold } }}
        >
          {project?.title || 'Project'}
        </Box>
        <Box sx={{ color: COLORS.border, fontSize: '0.875rem' }}>/</Box>
        <Box sx={{ color: COLORS.ink, fontSize: '0.875rem' }}>Document</Box>
      </Box>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h3" sx={{ fontStyle: 'italic', mb: 0.5 }}>
            {project?.title || 'Document'}
          </Typography>
          {project?.author_name && (
            <Typography variant="body2" sx={{ color: COLORS.inkFaint }}>by {project.author_name}</Typography>
          )}
        </Box>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate(`/project/${projectId}`)}
            startIcon={<ArrowBackIcon sx={{ fontSize: '0.9rem !important' }} />}
          >
            Back
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleAppend}
            disabled={appending}
            startIcon={appending ? <CircularProgress size={14} /> : undefined}
          >
            {appending ? 'Adding…' : 'Add new transcriptions'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setCombineConfirmOpen(true)}
            disabled={combining}
            sx={{ borderColor: '#D97706', color: '#D97706', '&:hover': { borderColor: '#92400E', color: '#92400E', backgroundColor: COLORS.goldPale } }}
          >
            Replace all
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => setPdfDialogOpen(true)}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {/* Notifications */}
      {combineSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setCombineSuccess(null)}>{combineSuccess}</Alert>}
      {appendSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setAppendSuccess(null)}>{appendSuccess}</Alert>}
      {pdfSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPdfSuccess(null)}>{pdfSuccess}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Info tip */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          border: `1px solid ${COLORS.divider}`,
          borderRadius: '6px',
          backgroundColor: COLORS.goldPale,
          display: 'flex',
          gap: 2,
          alignItems: 'flex-start',
        }}
      >
        <Typography sx={{ fontSize: '0.875rem', color: COLORS.inkLight, lineHeight: 1.6 }}>
          <strong>Auto-save</strong> is on — changes save every few seconds. &nbsp;
          <strong>Add new transcriptions</strong> appends only new recordings (preserves your edits). &nbsp;
          <strong>Replace all</strong> overwrites everything with all transcriptions.
        </Typography>
      </Box>

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

      {/* New transcriptions available popup */}
      <Dialog open={newTranscriptionsDialog} onClose={() => setNewTranscriptionsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New transcriptions available</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '1.1rem', lineHeight: 1.7, color: COLORS.inkLight }}>
            There are new transcriptions that haven't been added to this document yet. Would you like to add them now?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setNewTranscriptionsDialog(false)}>
            Not now
          </Button>
          <Button
            variant="contained"
            onClick={() => { setNewTranscriptionsDialog(false); handleAppend(); }}
          >
            Add new transcriptions
          </Button>
        </DialogActions>
      </Dialog>

      {/* Combine confirm */}
      <Dialog open={combineConfirmOpen} onClose={() => setCombineConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Replace all document content?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '1rem', lineHeight: 1.7, color: COLORS.inkLight }}>
            This will <strong>replace everything in your document</strong> with all transcriptions from your recordings.
            Any manual edits will be permanently lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setCombineConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCombine}
            sx={{ backgroundColor: '#D97706', color: '#fff', '&:hover': { backgroundColor: '#92400E' } }}
          >
            Yes, replace content
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF dialog */}
      <PDFSettingsDialog
        open={pdfDialogOpen}
        onClose={() => setPdfDialogOpen(false)}
        onGenerate={handleGeneratePDF}
        generating={generatingPDF}
      />
    </Container>
  );
}
