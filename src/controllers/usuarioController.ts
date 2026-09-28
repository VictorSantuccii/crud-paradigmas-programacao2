import { crudController } from "../lib/crudController";
import * as usuarioService from "../services/usuarioService";

export default crudController(usuarioService, "Usuário removido com sucesso.");
