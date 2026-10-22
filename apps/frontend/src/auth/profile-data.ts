export const dadosContato = (form: FormData, addressId?: number) => ({
  telefone: form.get('telefone'),
  endereco: { ...(addressId ? { id: addressId } : {}), cep: form.get('cep'), rua: form.get('rua'), bairro: form.get('bairro'), numero: Number(form.get('numero')), complemento: form.get('complemento') || null },
});
