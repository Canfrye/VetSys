import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  DEFAULT_SERVICE_FEES,
  normalizeServiceFees,
} from "../../utils/serviceCatalog";

function createCustomServiceId() {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ServiceFeesEditor({ value, onChange }) {
  const rows = normalizeServiceFees(value || DEFAULT_SERVICE_FEES);

  function emit(next) {
    onChange?.(next);
  }

  function handleChange(index, field, fieldValue) {
    const next = rows.map((row, i) =>
      i === index ? { ...row, [field]: fieldValue } : row
    );
    emit(next);
  }

  function handleAdd() {
    emit([
      ...rows,
      {
        id: createCustomServiceId(),
        name: "",
        defaultPrice: 0,
        active: true,
        category: "Tedavi",
      },
    ]);
  }

  function handleRemove(index) {
    emit(rows.filter((_, i) => i !== index));
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Muayene ve hizmet ücretleri. Muayene türü seçildiğinde varsayılan
        tutar otomatik dolar; kullanıcı her zaman değiştirebilir.
      </Typography>

      {rows.map((row, index) => (
        <Grid container spacing={1.5} key={row.id || index} sx={{ mb: 1.5 }}>
          <Grid size={5}>
            <TextField
              fullWidth
              size="small"
              label="Hizmet Adı"
              value={row.name}
              onChange={(e) => handleChange(index, "name", e.target.value)}
            />
          </Grid>
          <Grid size={3}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Varsayılan Ücret (₺)"
              value={row.defaultPrice}
              onChange={(e) =>
                handleChange(index, "defaultPrice", e.target.value)
              }
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>
          <Grid size={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={row.active !== false}
                  onChange={(e) =>
                    handleChange(index, "active", e.target.checked)
                  }
                />
              }
              label="Aktif"
            />
          </Grid>
          <Grid size={1}>
            <IconButton
              color="error"
              size="small"
              onClick={() => handleRemove(index)}
              aria-label="Hizmeti sil"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
      ))}

      <Button startIcon={<AddIcon />} onClick={handleAdd} size="small">
        Hizmet Ekle
      </Button>
    </Box>
  );
}

export default ServiceFeesEditor;
