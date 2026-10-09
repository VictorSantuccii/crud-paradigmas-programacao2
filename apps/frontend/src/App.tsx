import { CadastroPage } from "@/pages/CadastroPage";
import { ConsultasPage } from "@/pages/ConsultasPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { MeusPetsPage } from "@/pages/MeusPetsPage";
import { ServicosPage } from "@/pages/ServicosPage";
import { Route, Routes } from "react-router-dom";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/servicos" element={<ServicosPage />} />
      <Route path="/consultas" element={<ConsultasPage />} />
      <Route path="/meus-pets" element={<MeusPetsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
    </Routes>
  );
}
