import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import EmptyState from "../EmptyState";
import { TIMELINE_KIND } from "../../utils/medicalRecord";

const KIND_COLOR = {
  [TIMELINE_KIND.EXAMINATION]: "secondary",
  [TIMELINE_KIND.VACCINE]: "warning",
  [TIMELINE_KIND.APPOINTMENT]: "info",
  [TIMELINE_KIND.INVOICE]: "success",
  [TIMELINE_KIND.CONTROL]: "error",
  [TIMELINE_KIND.PRESCRIPTION]: "primary",
};

function MedicalTimeline({ items = [] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Zaman Tüneli
          </Typography>
          <EmptyState compact message="Henüz kayıtlı olay yok." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Zaman Tüneli
        </Typography>

        <Stack spacing={0}>
          {items.map((item) => (
            <Box
              key={item.id}
              className="medical-timeline-item"
              sx={{
                display: "flex",
                gap: 2,
                py: 1.5,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box sx={{ minWidth: 110 }}>
                <Typography fontWeight={700} fontSize={13}>
                  {item.date}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.time || "—"}
                </Typography>
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                  <Chip
                    size="small"
                    label={item.kindLabel}
                    color={KIND_COLOR[item.kind] || "default"}
                  />
                  {item.attachmentCount > 0 && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`${item.attachmentCount} ek`}
                    />
                  )}
                </Stack>

                <Typography fontWeight={700} noWrap title={item.title}>
                  {item.title}
                </Typography>

                {item.description ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={item.description}
                  >
                    {item.description}
                  </Typography>
                ) : null}

                <Typography variant="caption" color="text.secondary">
                  Veteriner: {item.veterinarian || "-"}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default MedicalTimeline;
