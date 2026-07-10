export const exportBackup = () => {
  const backup = {};

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("vetsys_")) {
      backup[key] = JSON.parse(localStorage.getItem(key));
    }
  });

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = `VetSys-Yedek-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  a.click();

  URL.revokeObjectURL(url);
};

export const importBackup = (file, callback) => {
  const reader = new FileReader();

  reader.onload = (e) => {
    const data = JSON.parse(e.target.result);

    Object.keys(data).forEach((key) => {
      localStorage.setItem(
        key,
        JSON.stringify(data[key])
      );
    });

    window.dispatchEvent(new Event("storage"));

    if (callback) callback();
  };

  reader.readAsText(file);
};