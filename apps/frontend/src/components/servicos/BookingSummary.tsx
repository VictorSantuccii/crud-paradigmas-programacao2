import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import type { Booking } from '@/booking/useBooking';
import { dataHoraFormatada, moeda } from '@/lib/booking';
import { textoBeneficio } from '@/lib/fidelidade';
import { estadosAgenda } from '@/types/agenda';
export function BookingSummary({ booking: b }: { booking: Booking }) {
  if (b.sucesso) return <div role="status"><span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-tertiary-fixed text-tertiary"><Icon name="check_circle" className="text-3xl" /></span><h2 className="font-headline-md font-bold">{b.reagendando ? 'Agendamento atualizado' : 'Agendamento confirmado'}</h2><p className="mt-3 text-sm">{b.sucesso.animal.nome} • {b.sucesso.servico.nome}</p><p className="mt-2 font-bold text-primary">{dataHoraFormatada(b.sucesso.dataHoraIni)}</p><p className="mt-2 text-sm">{b.sucesso.funcionario.nome} • {estadosAgenda[b.sucesso.status]}</p><p className="mt-3 text-sm">Preço base: {moeda(b.sucesso.precoBase)} • Desconto: {moeda(b.sucesso.desconto)}</p><p className="mt-2 font-bold text-secondary">Total: {moeda(b.sucesso.precoContratado)}</p>{b.sucesso.situacaoBeneficio && <p className="mt-2 text-sm font-bold text-primary">{textoBeneficio(b.sucesso.situacaoBeneficio)}</p>}<p className="mt-2 text-xs">Horário de São Paulo</p><Link className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary" to="/meu-perfil#agenda">Ver meus agendamentos</Link></div>;
  const linhas = [
    ['Pet', b.pet ? `${b.pet.nome} (${b.pet.especie})` : 'Selecione um pet'],
    ['Serviço', b.servico?.nome || 'Selecione um serviço'],
    ['Profissional', b.slot?.funcionario.nome || b.profissionais.find(p => p.id === b.funcionarioId)?.nome || 'Selecione um horário'],
    ['Data e horário', b.slot ? dataHoraFormatada(b.slot.inicio) : 'Selecione data e horário'],
  ];
  const contrato = b.original ?? b.cotacao;
  const f = b.fidelidade;
  const podeConfirmar = b.pet && b.servico && b.slot && !b.pending && !b.horariosLoading && (b.original || b.cotacao);
  return <div><h2 className="mb-5 font-headline-md font-bold text-on-surface">Resumo do Agendamento</h2><dl className="space-y-4 text-sm">{linhas.map(([label, valor]) => <div key={label} className="flex justify-between gap-3"><dt className="text-on-surface-variant">{label}</dt><dd className="text-right font-bold text-on-surface">{valor}</dd></div>)}</dl>
    {b.servico?.categoria === 'BANHO_TOSA' && <div className="mt-5 text-sm text-on-surface-variant">{f.loading ? <p role="status">Carregando fidelidade…</p> : f.error ? <div><p role="alert">{f.error}</p><button type="button" onClick={f.recarregar} className="min-h-11 font-bold text-primary">Tentar novamente</button></div> : f.dados ? <><p>Fidelidade: <strong>{f.dados.progresso} de {f.dados.meta} banhos</strong> • {f.dados.beneficios.disponiveis} {f.dados.beneficios.disponiveis === 1 ? 'benefício disponível' : 'benefícios disponíveis'}</p><p className="mt-1 text-xs">Somente banhos elegíveis pagos e concluídos contam. Benefícios sem validade.</p></> : null}</div>}
    <div className="my-5 border-t border-dashed border-outline-variant" />
    {b.original && <p className="mb-3 text-xs text-on-surface-variant">Contrato original preservado no reagendamento.</p>}
    {!b.original && b.cotacaoLoading && <p role="status" className="mb-3 text-sm">Calculando preço e benefício…</p>}
    {!b.original && b.cotacaoError && <div className="mb-3"><p role="alert" className="text-sm text-error">{b.cotacaoError}</p><button type="button" onClick={b.retryCotacao} className="min-h-11 text-sm font-bold text-primary">Recalcular resumo</button></div>}
    {contrato && <dl className="mb-3 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-on-surface-variant">Preço base</dt><dd>{moeda(contrato.precoBase)}</dd></div><div className="flex justify-between gap-3"><dt className="text-on-surface-variant">Desconto de fidelidade</dt><dd>{moeda(contrato.desconto)}</dd></div></dl>}
    <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-label-md text-on-surface-variant">Total</span><span className="font-headline-md text-xl font-bold text-secondary">{contrato ? moeda(contrato.precoContratado) : '—'}</span></div>
    {b.original?.situacaoBeneficio && <p className="mt-3 text-sm font-bold text-primary">{textoBeneficio(b.original.situacaoBeneficio)}</p>}
    {!b.original && b.cotacao?.beneficioId && <p className="mt-3 text-sm font-bold text-primary">Benefício será reservado ao confirmar. Banho gratuito não conta para o próximo ciclo.</p>}
    {!b.original && b.cotacao && !b.cotacao.elegivelFidelidade && <p className="mt-2 text-xs text-on-surface-variant">Este serviço não participa da fidelidade.</p>}
    {b.servico && <p className="mt-2 text-sm text-on-surface-variant">Duração: {b.original?.duracaoContratadaMin ?? b.servico.duracaoMin} min • Horário de São Paulo</p>}
    <button type="button" disabled={!podeConfirmar} onClick={() => void b.confirmar()} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-4 font-headline-md font-bold text-on-primary shadow-lg transition hover:bg-primary-container disabled:cursor-default disabled:opacity-50"><Icon name="check_circle" />{b.pending ? 'Salvando…' : b.reagendando ? 'Confirmar Reagendamento' : 'Confirmar Agendamento'}</button>{b.submitError && <p role="alert" className="mt-4 rounded-lg bg-error-container p-3 text-sm text-on-error-container">{b.submitError}</p>}
  </div>;
}
