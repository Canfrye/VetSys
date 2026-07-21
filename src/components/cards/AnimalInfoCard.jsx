import {
  Card,
  CardContent,
  Divider,
  Typography,
  Stack,
} from "@mui/material";

import { getAnimalOwnerDisplay, OWNER_TYPE } from "../../utils/ownerType";

function AnimalInfoCard({ animal, owner }) {
  const ownerDisplay = getAnimalOwnerDisplay(animal, owner);

  return (
    <Card>

      <CardContent>

        <Typography
          variant="h6"
          fontWeight="bold"
        >
          Hayvan Bilgileri
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>

          <div>
            <Typography color="text.secondary">
              Sahibi
            </Typography>

            <Typography noWrap title={ownerDisplay}>
              {ownerDisplay}
            </Typography>
          </div>

          {animal.ownerType && animal.ownerType !== OWNER_TYPE.CUSTOMER && (
            <div>
              <Typography color="text.secondary">
                Sahip Tipi
              </Typography>

              <Typography>{animal.ownerType}</Typography>
            </div>
          )}

          <div>
            <Typography color="text.secondary">
              Tür
            </Typography>

            <Typography>{animal.species}</Typography>
          </div>

          <div>
            <Typography color="text.secondary">
              Irk
            </Typography>

            <Typography>{animal.breed}</Typography>
          </div>

          <div>
            <Typography color="text.secondary">
              Cinsiyet
            </Typography>

            <Typography>{animal.gender}</Typography>
          </div>

          <div>
            <Typography color="text.secondary">
              Doğum Tarihi
            </Typography>

            <Typography>
              {animal.birthDate || "-"}
            </Typography>
          </div>

          <div>
            <Typography color="text.secondary">
              Renk
            </Typography>

            <Typography>
              {animal.color || "-"}
            </Typography>
          </div>

          <div>
            <Typography color="text.secondary">
              Kilo
            </Typography>

            <Typography>
              {animal.weight || "-"} kg
            </Typography>
          </div>

          <div>
            <Typography color="text.secondary">
              Mikroçip
            </Typography>

            <Typography>
              {animal.microchipNo || "-"}
            </Typography>
          </div>

        </Stack>

      </CardContent>

    </Card>
  );
}

export default AnimalInfoCard;
