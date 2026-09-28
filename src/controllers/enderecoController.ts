import { crudController } from "../lib/crudController";
import * as enderecoService from "../services/enderecoService";

export default crudController(enderecoService, "Endereço removido com sucesso.");
