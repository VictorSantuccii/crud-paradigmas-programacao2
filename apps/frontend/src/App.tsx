import { CadastroPage } from "@/pages/CadastroPage";
import { ConsultasPage } from "@/pages/ConsultasPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { MeusPetsPage } from "@/pages/MeusPetsPage";
import { ServicosPage } from "@/pages/ServicosPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GoogleCpfPage } from "@/pages/GoogleCpfPage";
import { Route, Routes } from "react-router-dom";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/servicos" element={<ServicosPage />} />
      <Route path="/consultas" element={<ProtectedRoute><ConsultasPage /></ProtectedRoute>} />
      <Route path="/meus-pets" element={<ProtectedRoute><MeusPetsPage /></ProtectedRoute>} />
      <Route path="/meu-perfil" element={<ProtectedRoute><MeusPetsPage /></ProtectedRoute>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route path="/cadastro/google/cpf" element={<GoogleCpfPage />} />
    </Routes>
  );
}
