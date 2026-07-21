import { useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";

import EmptyState from "../EmptyState";
import {
  MAX_ATTACHMENT_BYTES,
  createAttachmentFromFile,
} from "../../utils/medicalRecord";

function ExamAttachmentsPanel({
  examinations = [],
  onAddAttachment,
  onRemoveAttachment,
  onError,
}) {
  const fileInputRef = useRef(null);
  const [examId, setExamId] = useState("");
  const [busy, setBusy] = useState(false);

  const effectiveExamId = examId || examinations[0]?.id || "";
  const selected =
    examinations.find((e) => String(e.id) === String(effectiveExamId)) || null;
  const attachments = selected?.attachments || [];

  function handlePickFile() {
    if (!effectiveExamId) return;
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file || !selected) return;

    if (file.size > MAX_ATTACHMENT_BYTES) {
      onError?.("Dosya 900 KB sınırını aşıyor.");
      return;
    }

    setBusy(true);

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });

      const attachment = createAttachmentFromFile(file, dataUrl);
      await onAddAttachment?.(selected, attachment);
    } catch {
      onError?.("Dosya okunamadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Dosya Ekleri
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Röntgen, ultrason, kan sonucu gibi dosyalar muayeneye Base64 olarak
          eklenir.
        </Typography>

        {examinations.length === 0 ? (
          <EmptyState compact message="Önce bir muayene kaydı oluşturun." />
        ) : (
          <>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mb={2}>
              <TextField
                select
                size="small"
                fullWidth
                label="Muayene"
                value={effectiveExamId}
                onChange={(e) => setExamId(e.target.value)}
              >
                {examinations.map((exam) => (
                  <MenuItem key={exam.id} value={exam.id}>
                    {exam.examinationDate} · {exam.diagnosis || "Muayene"}
                  </MenuItem>
                ))}
              </TextField>

              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                disabled={!effectiveExamId || busy}
                onClick={handlePickFile}
                sx={{ whiteSpace: "nowrap" }}
              >
                Dosya Ekle
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="image/*,.pdf,application/pdf"
                onChange={handleFileChange}
              />
            </Stack>

            {attachments.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Bu muayenede ek yok.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {attachments.map((file) => (
                  <Box
                    key={file.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: "grey.50",
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap fontWeight={600} title={file.name}>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {file.mimeType} ·{" "}
                        {Math.round((file.size || 0) / 1024)} KB
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="small"
                        href={file.dataUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Aç
                      </Button>
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Eki sil"
                        onClick={() => onRemoveAttachment?.(selected, file.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ExamAttachmentsPanel;
