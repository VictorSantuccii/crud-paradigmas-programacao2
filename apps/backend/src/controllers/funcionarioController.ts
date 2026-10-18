import { crudController } from "../lib/crudController";
import * as funcionarioService from "../services/funcionarioService";

export default crudController(funcionarioService, "Funcionário removido com sucesso.");
