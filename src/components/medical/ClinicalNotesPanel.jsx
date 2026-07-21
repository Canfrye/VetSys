import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

import {
  parseClinicalNotes,
  serializeClinicalNotes,
} from "../../utils/medicalRecord";

function ClinicalNotesPanel({ note = "", onSave, saving = false }) {
  const [draft, setDraft] = useState(() => parseClinicalNotes(note));
  const [newNote, setNewNote] = useState("");

  function handleAdd() {
    const value = newNote.trim();
    if (!value) return;
    setDraft((prev) => [...prev, value]);
    setNewNote("");
  }

  function handleRemove(index) {
    setDraft((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    await onSave?.(serializeClinicalNotes(draft));
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Klinik Notları
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Alerji, diyet, davranış gibi uyarılar. Dashboard&apos;da da görünür.
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
          {draft.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              Henüz klinik not yok.
            </Typography>
          ) : (
            draft.map((item, index) => (
              <Chip
                key={`${item}-${index}`}
                label={item}
                color="warning"
                onDelete={() => handleRemove(index)}
                deleteIcon={<DeleteIcon />}
              />
            ))
          )}
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mb={2}>
          <TextField
            size="small"
            fullWidth
            label="Yeni not"
            placeholder="Örn. İlaç alerjisi var"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ whiteSpace: "nowrap" }}
          >
            Ekle
          </Button>
        </Stack>

        <Box display="flex" justifyContent="flex-end">
          <Button variant="contained" disabled={saving} onClick={handleSave}>
            Notları Kaydet
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default ClinicalNotesPanel;
