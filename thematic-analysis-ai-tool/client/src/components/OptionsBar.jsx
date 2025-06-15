import React from 'react';
import {
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';

function OptionsBar({
  selectedAnalysis,
  setSelectedAnalysis,
  selectedAIModel,
  setSelectedAIModel,
  openaiApiKey,
  setOpenaiApiKey,
  geminiApiKey,
  setGeminiApiKey,
  groqApiKey,
  setGroqApiKey,
  claudeApiKey,
  setClaudeApiKey,
}) {
  const handleAnalysisChange = (event) => {
    setSelectedAnalysis(event.target.value);
  };

  const handleAIModelChange = (event) => {
    setSelectedAIModel(event.target.value);
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>Options</Typography>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small" sx={{ bgcolor: 'background.paper', borderRadius: 1,
            '& .MuiOutlinedInput-root': {
              fieldset: { borderColor: 'grey.400' },
              '&:hover fieldset': { borderColor: 'primary.main' },
              '&.Mui-focused fieldset': { borderColor: 'primary.main' },
            },
          }}>
            <InputLabel id="thematic-analysis-label">Thematic Analysis</InputLabel>
            <Select
              labelId="thematic-analysis-label"
              id="thematic-analysis-select"
              value={selectedAnalysis}
              label="Thematic Analysis"
              onChange={handleAnalysisChange}
            >
              <MenuItem value="Inductive">Inductive</MenuItem>
              <MenuItem value="Deductive">Deductive</MenuItem>
              <MenuItem value="Reflexive">Reflexive</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small" sx={{ bgcolor: 'background.paper', borderRadius: 1,
            '& .MuiOutlinedInput-root': {
              fieldset: { borderColor: 'grey.400' },
              '&:hover fieldset': { borderColor: 'primary.main' },
              '&.Mui-focused fieldset': { borderColor: 'primary.main' },
            },
          }}>
            <InputLabel id="ai-model-label">AI Model</InputLabel>
            <Select
              labelId="ai-model-label"
              id="ai-model-select"
              value={selectedAIModel}
              label="AI Model"
              onChange={handleAIModelChange}
            >
              <MenuItem value="Open AI">Open AI</MenuItem>
              <MenuItem value="Gemini">Gemini</MenuItem>
              <MenuItem value="Groq">Groq</MenuItem>
              <MenuItem value="Claude">Claude</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          {selectedAIModel && (
            <TextField
              fullWidth
              size="small"
              label={`${selectedAIModel} API Key`}
              value={
                selectedAIModel === 'Open AI' ? openaiApiKey :
                selectedAIModel === 'Gemini' ? geminiApiKey :
                selectedAIModel === 'Groq' ? groqApiKey :
                selectedAIModel === 'Claude' ? claudeApiKey : ''
              }
              onChange={(e) => {
                const key = e.target.value;
                if (selectedAIModel === 'Open AI') setOpenaiApiKey(key);
                else if (selectedAIModel === 'Gemini') setGeminiApiKey(key);
                else if (selectedAIModel === 'Groq') setGroqApiKey(key);
                else if (selectedAIModel === 'Claude') setClaudeApiKey(key);
              }}
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  fieldset: { borderColor: 'grey.400' },
                  '&:hover fieldset': { borderColor: 'primary.main' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                },
              }}
            />
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}

export default OptionsBar; 