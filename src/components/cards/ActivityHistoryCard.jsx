import {
  Box,
  Card,
  CardContent,
  Divider,
  Typography,
} from "@mui/material";

import EmptyState from "../EmptyState";

function ActivityHistoryCard({ activities = [], title = "Aktivite Geçmişi" }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {activities.length === 0 ? (
          <EmptyState compact message="Aktivite bulunmuyor." />
        ) : (
          activities.map((entry) => (
            <Box
              key={entry.id}
              sx={{
                p: 2,
                mb: 2,
                border: "1px solid #eee",
                borderRadius: 2,
              }}
            >
              <Typography fontWeight="bold" noWrap title={entry.description}>
                {entry.description || `${entry.module} ${entry.action}`}
              </Typography>

              <Typography color="text.secondary" variant="body2">
                {entry.date || "-"}
                {entry.time ? ` · ${entry.time}` : ""}
                {entry.userName ? ` · ${entry.userName}` : ""}
              </Typography>

              <Typography color="text.secondary" variant="body2">
                {entry.module || "-"}
                {entry.action ? ` · ${entry.action}` : ""}
              </Typography>
            </Box>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default ActivityHistoryCard;
