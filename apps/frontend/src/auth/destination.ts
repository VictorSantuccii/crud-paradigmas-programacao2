export const destinoInterno = (value?: string | null) => value?.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : '/meu-perfil';
export const guardarDestino = (value?: string) => { const destino = destinoInterno(value); sessionStorage.setItem('petexpress-destino', destino); return destino; };
export const recuperarDestino = (value?: string) => destinoInterno(value || sessionStorage.getItem('petexpress-destino'));
