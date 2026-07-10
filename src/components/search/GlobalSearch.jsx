import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Paper,
  TextField,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import PetsIcon from "@mui/icons-material/Pets";
import VaccinesIcon from "@mui/icons-material/Vaccines";
import EventIcon from "@mui/icons-material/Event";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";

import { globalSearch } from "../../services/searchService";

function GlobalSearch() {
  const [text, setText] = useState("");

  const navigate = useNavigate();

  const results = useMemo(() => {
    if (!text.trim()) return [];
    return globalSearch(text);
  }, [text]);

  function getIcon(type) {
    switch (type) {
      case "customer":
        return <PersonIcon color="primary" />;

      case "animal":
        return <PetsIcon color="success" />;

      case "vaccine":
        return <VaccinesIcon color="warning" />;

      case "appointment":
        return <EventIcon color="secondary" />;

      case "examination":
        return <MedicalServicesIcon color="error" />;

      default:
        return null;
    }
  }

  function handleClick(item) {
    switch (item.type) {
      case "customer":
        navigate(`/musteriler/${item.id}`);
        break;

      case "animal":
        navigate(`/hayvanlar/${item.id}`);
        break;

      case "vaccine":
        navigate("/asilar");
        break;

      case "appointment":
        navigate("/randevular");
        break;

      case "examination":
        navigate("/muayeneler");
        break;

      default:
        break;
    }

    setText("");
  }

  return (
    <Box sx={{ position: "relative", width: 380 }}>

      <TextField
        fullWidth
        size="small"
        placeholder="Müşteri, hayvan, telefon, mikroçip..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {results.length > 0 && (
        <Paper
          sx={{
            position: "absolute",
            top: 45,
            width: "100%",
            zIndex: 9999,
            maxHeight: 420,
            overflow: "auto",
          }}
        >
          <List>

            {results.map((item) => (
              <ListItemButton
                key={`${item.type}-${item.id}`}
                onClick={() => handleClick(item)}
              >
                <ListItemIcon>
                  {getIcon(item.type)}
                </ListItemIcon>

                <ListItemText
                  primary={item.title}
                  secondary={
                    <>
                      {item.subtitle}
                      <Typography
                        component="span"
                        sx={{
                          ml: 1,
                          fontSize: 11,
                          color: "#888",
                        }}
                      >
                        ({item.type})
                      </Typography>
                    </>
                  }
                />
              </ListItemButton>
            ))}

          </List>
        </Paper>
      )}

    </Box>
  );
}

export default GlobalSearch;