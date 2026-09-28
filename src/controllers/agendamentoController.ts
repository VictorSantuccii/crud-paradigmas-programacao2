import { crudController } from "../lib/crudController";
import * as agendamentoService from "../services/agendamentoService";

export default crudController(agendamentoService, "Agendamento removido com sucesso.");
