import { useMemo } from "react";
import { Autocomplete, TextField } from "@mui/material";

import { createSearchFilter } from "../utils/searchText";

function defaultGetOptionLabel(option) {
  if (option == null) return "";
  if (typeof option === "string") return option;
  return option.label || option.name || String(option);
}

/**
 * Klinik formlarında ortak aranabilir seçim kutusu.
 * String veya nesne seçenekleriyle çalışır; freeSolo ile özel değer kabul eder.
 */
function SearchableAutocomplete({
  label,
  value,
  onChange,
  options = [],
  freeSolo = true,
  required = false,
  disabled = false,
  helperText,
  size = "medium",
  getOptionLabel = defaultGetOptionLabel,
  isOptionEqualToValue,
  groupBy,
  placeholder,
  fullWidth = true,
  disableClearable = false,
  textFieldProps = {},
}) {
  const filterOptions = useMemo(
    () => createSearchFilter(getOptionLabel),
    [getOptionLabel]
  );

  const normalizedValue =
    value === undefined || value === null
      ? freeSolo
        ? ""
        : null
      : value;

  return (
    <Autocomplete
      fullWidth={fullWidth}
      size={size}
      freeSolo={freeSolo}
      disabled={disabled}
      disableClearable={disableClearable}
      options={options}
      value={normalizedValue}
      filterOptions={filterOptions}
      groupBy={groupBy}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={
        isOptionEqualToValue ||
        ((a, b) => getOptionLabel(a) === getOptionLabel(b))
      }
      onChange={(_event, newValue) => {
        if (newValue == null) {
          onChange?.(freeSolo ? "" : null);
          return;
        }

        if (typeof newValue === "string") {
          onChange?.(newValue);
          return;
        }

        onChange?.(newValue);
      }}
      onInputChange={(_event, newInputValue, reason) => {
        if (!freeSolo) return;
        if (reason === "input" || reason === "clear") {
          onChange?.(newInputValue);
        }
      }}
      selectOnFocus
      clearOnBlur={false}
      handleHomeEndKeys
      autoHighlight
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          helperText={helperText}
          placeholder={placeholder}
          {...textFieldProps}
        />
      )}
    />
  );
}

export default SearchableAutocomplete;
