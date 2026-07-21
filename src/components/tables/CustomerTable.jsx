import { DataGrid } from "@mui/x-data-grid";
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import { useNavigate } from "react-router-dom";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";

import {
  DATA_GRID_HEIGHT,
  DATA_GRID_PAGE_SIZE_OPTIONS,
  DATA_GRID_INITIAL_PAGINATION,
  dataGridSx,
} from "../../utils/dataGridDefaults";

function CustomerTable({
  customers = [],
  onDelete,
  onEdit,
}) {
  const navigate = useNavigate();

  const rows = customers.map((customer) => ({
    id: customer.id,

    ad: customer.ad,
    soyad: customer.soyad,

    adSoyad: `${customer.ad} ${customer.soyad}`,

    telefon: customer.telefon || "-",
    email: customer.email || "-",

    createdAt: customer.createdAt
      ? new Date(customer.createdAt).toLocaleDateString("tr-TR")
      : "-",

    raw: customer,
  }));

  const columns = [
    {
      field: "adSoyad",
      headerName: "Müşteri",
      flex: 1.2,
      minWidth: 180,

      renderCell: (params) => (
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ height: "100%", minWidth: 0, width: "100%" }}
        >
          <Avatar>
            {params.row.ad?.charAt(0).toUpperCase()}
          </Avatar>

          <Typography fontWeight={600} noWrap title={params.row.adSoyad}>
            {params.row.adSoyad}
          </Typography>
        </Stack>
      ),
    },

    {
      field: "telefon",
      headerName: "Telefon",
      width: 190,

      renderCell: (params) => (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ height: "100%" }}
        >
          <PhoneIcon
            fontSize="small"
            color="success"
          />

          <Typography>
            {params.value}
          </Typography>
        </Stack>
      ),
    },

    {
      field: "email",
      headerName: "E-Posta",
      flex: 1,
      minWidth: 180,

      renderCell: (params) => (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ height: "100%", minWidth: 0, width: "100%" }}
        >
          <EmailIcon
            fontSize="small"
            color="primary"
          />

          <Typography
            noWrap
            title={params.value}
            sx={{ width: "100%" }}
          >
            {params.value}
          </Typography>
        </Stack>
      ),
    },

    {
      field: "createdAt",
      headerName: "Kayıt",

      width: 150,

      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },

    {
      field: "actions",
      headerName: "İşlemler",

      width: 160,

      sortable: false,
      filterable: false,

      renderCell: (params) => (
        <>
          <Tooltip title="Detayı Gör">
            <IconButton
              size="small"
              color="info"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/musteriler/${params.row.id}`);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Düzenle">
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(params.row.raw);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Sil">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(params.row.id);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <Box
      sx={{
        width: "100%",
        height: DATA_GRID_HEIGHT,
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        disableRowSelectionOnClick
        pageSizeOptions={DATA_GRID_PAGE_SIZE_OPTIONS}
        initialState={{
          sorting: {
            sortModel: [
              {
                field: "createdAt",
                sort: "desc",
              },
            ],
          },
          ...DATA_GRID_INITIAL_PAGINATION,
        }}
        onRowClick={(params) =>
          navigate(`/musteriler/${params.id}`)
        }
        sx={dataGridSx}
      />
    </Box>
  );
}

export default CustomerTable;
