import { crudController } from "../lib/crudController";
import * as fidelidadeService from "../services/fidelidadeService";

export default crudController(fidelidadeService, "Fidelidade removida com sucesso.");
