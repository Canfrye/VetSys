import { useEffect, useState } from "react";
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
import MedicationIcon from "@mui/icons-material/Medication";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentsIcon from "@mui/icons-material/Payments";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import MiscellaneousServicesIcon from "@mui/icons-material/MiscellaneousServices";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import HistoryIcon from "@mui/icons-material/History";

import { globalSearch } from "../../services/searchService";
import { useAuth } from "../../hooks/useAuth";

function GlobalSearch() {
  const [text, setText] = useState("");
  const [results, setResults] = useState([]);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!text.trim()) return;

    let cancelled = false;

    globalSearch(text, user?.role).then((data) => {
      if (!cancelled) setResults(data);
    });

    return () => {
      cancelled = true;
    };
  }, [text, user?.role]);

  const visibleResults = text.trim() ? results : [];

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

      case "prescription":
        return <MedicationIcon color="secondary" />;

      case "invoice":
        return <ReceiptLongIcon color="success" />;

      case "payment":
        return <PaymentsIcon color="success" />;

      case "stock":
        return <Inventory2Icon color="warning" />;

      case "service":
        return <MiscellaneousServicesIcon color="primary" />;

      case "reminder":
        return <NotificationsActiveIcon color="warning" />;

      case "audit":
        return <HistoryIcon color="action" />;

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

      case "prescription":
        navigate("/receteler");
        break;

      case "invoice":
      case "payment":
        navigate("/faturalar");
        break;

      case "stock":
        navigate("/stok");
        break;

      case "service":
        navigate("/ayarlar");
        break;

      case "reminder":
        navigate("/hatirlatmalar");
        break;

      case "audit":
        navigate("/aktivite");
        break;

      default:
        break;
    }

    setText("");
  }

  return (
    <Box sx={{ position: "relative", width: "100%" }}>

      <TextField
        fullWidth
        size="small"
        placeholder="Müşteri, hayvan, telefon, mikroçip..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {visibleResults.length > 0 && (
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

            {visibleResults.map((item) => (
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