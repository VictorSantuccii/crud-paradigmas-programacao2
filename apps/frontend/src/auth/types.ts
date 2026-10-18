export type Usuario = {
  id: number;
  nome: string;
  email: string | null;
  cpf: string;
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
