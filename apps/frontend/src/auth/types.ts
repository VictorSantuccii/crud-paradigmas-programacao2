export type Usuario = {
  id: number;
  nome: string;
  email: string | null;
  cpf: string;
  telefone: string | null;
  perfilCompleto: boolean;
  camposPendentes: string[];
  role: string;
  fotoURL: string | null;
  enderecos: Array<{
    id: number;
    rua: string;
    numero: number;
    complemento: string | null;
    bairro: string;
    cep: string;
  }>;
};
