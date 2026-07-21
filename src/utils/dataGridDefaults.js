/**
 * DataGrid ortak görünüm ayarları — tüm tablolarda aynı yükseklik,
 * sayfalama ve satır stilleri kullanılır.
 */

export const DATA_GRID_HEIGHT = 600;

export const DATA_GRID_PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

export const DATA_GRID_INITIAL_PAGINATION = {
  pagination: {
    paginationModel: {
      pageSize: 10,
    },
  },
};

export const dataGridSx = {
  border: 0,

  "& .MuiDataGrid-columnHeaders": {
    backgroundColor: "#f8fafc",
    fontWeight: "bold",
  },

  "& .MuiDataGrid-row:nth-of-type(even)": {
    backgroundColor: "#fafafa",
  },

  "& .MuiDataGrid-row:hover": {
    backgroundColor: "#eef6ff",
  },

  "& .MuiDataGrid-cell": {
    display: "flex",
    alignItems: "center",
  },
};
