import { Router } from "express";
import { equipmentController } from "../controllers/equipmentController";
import { locationController } from "../controllers/locationController";
import { technicianController } from "../controllers/technicianController";
import businessRulesRoutes from "./businessRoutes";
import { crudRouter } from "./crudRouter";

const router = Router();
router.use("/equipments", crudRouter(equipmentController));
router.use("/locations", crudRouter(locationController));
router.use("/technicians", crudRouter(technicianController));
router.use("/regras-negocio", businessRulesRoutes);
export default router;
