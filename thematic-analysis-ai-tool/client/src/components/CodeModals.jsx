import React from 'react';
import {
  Box,
  Typography,
  Modal,
  FormControl,
  Button,
  TextField,
} from '@mui/material';

function CodeModals({
  codesModalOpen,
  setCodesModalOpen,
  selectedCode,
  setSelectedCode,
  codes,
  createCodeDialogOpen,
  setCreateCodeDialogOpen,
  newCodeFields,
  setNewCodeFields,
  setCodes,
  pendingCodeSelection,
  setPendingCodeSelection,
  codeAssignments,
  setCodeAssignments
}) {
  const handleCodeAssignment = () => {
    if (selectedCode && pendingCodeSelection) {
      const newAssignment = {
        id: Date.now(),
        documentName: pendingCodeSelection.documentName || 'Unknown Document',
        selectedText: pendingCodeSelection.text,
        code: selectedCode,
        timestamp: new Date().toLocaleString(),
        context: pendingCodeSelection.context || ''
      };
      
      setCodeAssignments(prev => [...prev, newAssignment]);
      setCodesModalOpen(false);
      setSelectedCode('');
      setPendingCodeSelection(null);
    }
  };

  return (
    <>
      {/* Codes Modal */}
      <Modal open={codesModalOpen} onClose={() => setCodesModalOpen(false)}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          p: 4,
          borderRadius: 3,
          boxShadow: 24,
          minWidth: 320,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3
        }}>
          <Typography variant="h6" sx={{ fontFamily: 'cursive', mb: 1 }}>Already available</Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <select
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: '1.5px solid #bbb',
                fontSize: '1.1rem',
                fontFamily: 'inherit',
              }}
              value={selectedCode}
              onChange={e => setSelectedCode(e.target.value)}
            >
              <option value="">Select a code</option>
              {codes.map((code, idx) => (
                <option key={idx} value={code}>{code}</option>
              ))}
            </select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
            <Button
              variant="outlined"
              sx={{ flex: 1, borderRadius: '10px', fontSize: '1.1rem', fontFamily: 'inherit' }}
              onClick={() => {
                setCreateCodeDialogOpen(true);
                setCodesModalOpen(false);
              }}
            >
              Create
            </Button>
            <Button
              variant="contained"
              sx={{ flex: 1, borderRadius: '10px', fontSize: '1.1rem', fontFamily: 'inherit' }}
              onClick={handleCodeAssignment}
              disabled={!selectedCode || !pendingCodeSelection}
            >
              Assign
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Create a code dialog */}
      <Modal open={createCodeDialogOpen} onClose={() => setCreateCodeDialogOpen(false)}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          p: 4,
          borderRadius: 3,
          boxShadow: 24,
          minWidth: 400,
          maxWidth: 500,
          width: '90%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}>
          <Typography variant="h5" sx={{ fontFamily: 'cursive', mb: 2 }}>Create a code</Typography>
          <TextField
            label="Name"
            fullWidth
            value={newCodeFields.name}
            onChange={e => setNewCodeFields(f => ({ ...f, name: e.target.value }))}
            sx={{ mb: 1 }}
          />
          <TextField
            label="Definition"
            fullWidth
            value={newCodeFields.definition}
            onChange={e => setNewCodeFields(f => ({ ...f, definition: e.target.value }))}
            sx={{ mb: 1 }}
          />
          <TextField
            label="Description"
            fullWidth
            value={newCodeFields.description}
            onChange={e => setNewCodeFields(f => ({ ...f, description: e.target.value }))}
            sx={{ mb: 1 }}
          />
          <TextField
            label="Category"
            fullWidth
            value={newCodeFields.category}
            onChange={e => setNewCodeFields(f => ({ ...f, category: e.target.value }))}
            sx={{ mb: 1 }}
          />
          <TextField
            label="Color"
            fullWidth
            type="color"
            value={newCodeFields.color}
            onChange={e => setNewCodeFields(f => ({ ...f, color: e.target.value }))}
            sx={{ mb: 2, width: '50%' }}
            InputLabelProps={{ shrink: true }}
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={() => setCreateCodeDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                if (newCodeFields.name.trim()) {
                  setCodes(prev => [...prev, newCodeFields.name]);
                  setSelectedCode(newCodeFields.name);
                  setCreateCodeDialogOpen(false);
                  setNewCodeFields({ name: '', definition: '', description: '', category: '', color: '' });
                }
              }}
              disabled={!newCodeFields.name.trim()}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

export default CodeModals; 