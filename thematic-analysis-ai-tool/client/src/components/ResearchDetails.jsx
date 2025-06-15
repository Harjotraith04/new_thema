import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Stack,
} from '@mui/material';

function ResearchDetails() {
  const [researchQuestions, setResearchQuestions] = useState(['']);

  const handleResearchQuestionChange = (index, event) => {
    const newQuestions = [...researchQuestions];
    newQuestions[index] = event.target.value;
    setResearchQuestions(newQuestions);
  };

  const handleAddResearchQuestion = () => {
    setResearchQuestions([...researchQuestions, '']);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Research Questions</Typography>
      <Stack spacing={2}>
        {researchQuestions.map((question, index) => (
          <TextField
            key={index}
            fullWidth
            size="small"
            label={`Research Question ${index + 1}`}
            value={question}
            onChange={(e) => handleResearchQuestionChange(index, e)}
          />
        ))}
        <Button variant="outlined" onClick={handleAddResearchQuestion} sx={{ width: 'fit-content' }}>
          Add Research Question
        </Button>
      </Stack>
    </Box>
  );
}

export default ResearchDetails; 