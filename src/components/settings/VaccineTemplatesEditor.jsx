import {
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  TEMPLATE_SLOTS,
  normalizeVaccineTemplates,
} from "../../utils/vaccineTemplates";

/**
 * Klinik yönetilebilir aşı takvimi şablonları editörü.
 * Dört yuva: Kedi/Köpek × Yavru/Yetişkin.
 */
function VaccineTemplatesEditor({ value, onChange }) {
  const templates = normalizeVaccineTemplates(value);

  function updateSlot(species, ageGroup, nextList) {
    onChange({
      ...templates,
      [species]: {
        ...templates[species],
        [ageGroup]: nextList,
      },
    });
  }

  function handleFieldChange(species, ageGroup, index, field, raw) {
    const list = [...(templates[species][ageGroup] || [])];
    const current = { ...list[index] };

    if (field === "vaccineName") {
      current.vaccineName = raw;
    } else if (field === "dayOffset") {
      const parsed = raw === "" ? 0 : Number(raw);
      current.dayOffset = Number.isNaN(parsed) ? 0 : parsed;
    }

    list[index] = current;
    updateSlot(species, ageGroup, list);
  }

  function handleAddRow(species, ageGroup) {
    const list = [...(templates[species][ageGroup] || [])];
    list.push({ vaccineName: "", dayOffset: 0 });
    updateSlot(species, ageGroup, list);
  }

  function handleDeleteRow(species, ageGroup, index) {
    const list = [...(templates[species][ageGroup] || [])];
    list.splice(index, 1);
    updateSlot(species, ageGroup, list);
  }

  function handleMove(species, ageGroup, index, direction) {
    const list = [...(templates[species][ageGroup] || [])];
    const target = index + direction;

    if (target < 0 || target >= list.length) return;

    const tmp = list[index];
    list[index] = list[target];
    list[target] = tmp;
    updateSlot(species, ageGroup, list);
  }

  return (
    <Stack spacing={3}>
      {TEMPLATE_SLOTS.map((slot) => {
        const list = templates[slot.species]?.[slot.ageGroup] || [];

        return (
          <Box key={slot.label}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              {slot.label}
            </Typography>

            <Typography variant="body2" color="text.secondary" mb={1.5}>
              Aşı adı ve kaç gün sonra uygulanacağı. Sıra takvim üretim sırasını
              belirler.
            </Typography>

            <Stack spacing={1.5}>
              {list.map((item, index) => (
                <Stack
                  key={`${slot.label}-${index}`}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  <TextField
                    size="small"
                    label="Aşı adı"
                    value={item.vaccineName}
                    onChange={(e) =>
                      handleFieldChange(
                        slot.species,
                        slot.ageGroup,
                        index,
                        "vaccineName",
                        e.target.value
                      )
                    }
                    sx={{ flex: 2, minWidth: 160 }}
                  />

                  <TextField
                    size="small"
                    type="number"
                    label="Gün sonra"
                    value={item.dayOffset}
                    inputProps={{ min: 0, step: 1 }}
                    onChange={(e) =>
                      handleFieldChange(
                        slot.species,
                        slot.ageGroup,
                        index,
                        "dayOffset",
                        e.target.value
                      )
                    }
                    sx={{ flex: 1, minWidth: 120 }}
                  />

                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      aria-label="Yukarı taşı"
                      disabled={index === 0}
                      onClick={() =>
                        handleMove(slot.species, slot.ageGroup, index, -1)
                      }
                    >
                      <KeyboardArrowUpIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      size="small"
                      aria-label="Aşağı taşı"
                      disabled={index === list.length - 1}
                      onClick={() =>
                        handleMove(slot.species, slot.ageGroup, index, 1)
                      }
                    >
                      <KeyboardArrowDownIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      size="small"
                      color="error"
                      aria-label="Satırı sil"
                      onClick={() =>
                        handleDeleteRow(slot.species, slot.ageGroup, index)
                      }
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              ))}
            </Stack>

            <Button
              startIcon={<AddIcon />}
              size="small"
              sx={{ mt: 1.5 }}
              onClick={() => handleAddRow(slot.species, slot.ageGroup)}
            >
              Aşı ekle
            </Button>

            <Divider sx={{ mt: 2.5 }} />
          </Box>
        );
      })}
    </Stack>
  );
}

export default VaccineTemplatesEditor;
