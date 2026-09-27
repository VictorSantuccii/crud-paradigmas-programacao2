import { crudController } from "../lib/crudController";
import * as animalService from "../services/animalService";

export default crudController(animalService, "Animal removido com sucesso.");
