import { TextField } from "@mui/material";

function SearchBar({
  value,
  onChange,
  label = "Ara...",
}) {
  return (
    <TextField
      fullWidth
      size="small"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ mb: 2 }}
    />
  );
}

export default SearchBar;