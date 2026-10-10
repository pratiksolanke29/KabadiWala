import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import { RateDeal } from '../../components/shared/Ratings';
import type { TransactionRow, CompletedLot } from '../../types';
import { RecyclerShell, RequestState, cardClass } from './RecyclerShell';
import { Button } from '../../components/shared/Button';
import { CategoryIcon } from '../../components/shared/CategoryIcon';
import { StatusChip } from '../../components/shared/StatusChip';
import { CATEGORIES } from '../../types';
import { Eye, Download } from 'lucide-react';

export function RecyclerTransactions() {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<CompletedLot | null>(null);
  const [detailError, setDetailError] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await api<TransactionRow[]>('GET', '/transactions'));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const receipt = async (id: string) => {
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      setDetail(await api<CompletedLot>('GET', '/transactions/' + encodeURIComponent(id)));
    } catch (e) {
      setDetailError((e as Error).message);
    } finally {
      setDetailLoading(false);
    }
  };

  const money = (amount: number) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  return (
    <RecyclerShell>
      <div className="flex justify-between items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-[var(--color-text)] font-display">{t('common.transactions', { defaultValue: 'Transactions' })}</h2>
        <Button variant="outline" onClick={load} disabled={loading} leftIcon={<Download className="w-4 h-4" />}>
          {t('recyclerPages.refresh', { defaultValue: 'Refresh' })}
        </Button>
      </div>

      <RequestState loading={loading} error={error} retry={load} />

      {!loading && !error && (
        <div className={cardClass}>
          {rows.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[var(--color-text-muted)] mb-4">{t('recyclerPages.noTransactions', { defaultValue: 'No transactions yet. Confirm a handover to see it here.' })}</p>
              <Button onClick={load} leftIcon={<Download className="w-4 h-4" />}>{t('recyclerPages.refresh', { defaultValue: 'Refresh' })}</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map(row => (
                <TransactionRow
                  key={row.lotId}
                  row={row}
                  money={money}
                  onView={() => receipt(row.lotId)}
                  onPaid={load}
                  detailLoading={detailLoading}
                  language={i18n.language}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {detailLoading && <p role="status" className="mt-4 text-center text-[var(--color-text-muted)]">{t('common.loading', { defaultValue: 'Loading...' })}</p>}
      {detailError && <p role="alert" className="mt-4 text-center text-[var(--color-warning)]">{detailError}</p>}
      {detail && (
        <section aria-label={t('common.receipt', { defaultValue: 'Receipt' })} className={cardClass + ' mt-6 animate-in fade-in'}>
          <div className="flex justify-between mb-4">
            <h3 className="text-xl font-semibold text-[var(--color-text)] font-display">{t('common.receipt', { defaultValue: 'Receipt' })}</h3>
            <Button variant="ghost" size="sm" onClick={() => setDetail(null)}>{t('common.close', { defaultValue: 'Close' })}</Button>
          </div>
          <dl className="grid sm:grid-cols-2 gap-4">
            {[
              [t('recyclerPages.lotId', { defaultValue: 'Lot ID' }), detail.id.slice(-8).toUpperCase()],
              [t('recyclerPages.collector', { defaultValue: 'Collector' }), detail.collectorName],
              [t('common.handoverCode', { defaultValue: 'Handover Code' }), detail.refId],
              [t('recyclerPages.material', { defaultValue: 'Material' }), t('categories.' + detail.category, { defaultValue: detail.category })],
              [t('common.finalWeight', { defaultValue: 'Final Weight' }), detail.finalWeightKg + ' kg'],
              [t('common.finalRate', { defaultValue: 'Final Rate' }), money(detail.finalRate) + '/kg'],
              [t('common.total', { defaultValue: 'Total' }), money(detail.finalTotal)],
              [t('common.paymentMode', { defaultValue: 'Payment Mode' }), t('common.' + detail.paymentMode.toLowerCase(), { defaultValue: detail.paymentMode })]
            ].map(([key, value]) => (
              <div key={key}>
                <dt className="text-sm text-[var(--color-text-muted)]">{key}</dt>
                <dd className="font-medium text-[var(--color-text)] break-all tabular-nums font-mono">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6">
            <RateDeal key={detail.id} path={`/transactions/${detail.id}/rate`} existing={detail.myRating} whom={detail.collectorName} />
          </div>
        </section>
      )}
    </RecyclerShell>
  );
}

function TransactionRow({ row, money, onView, onPaid, detailLoading, language }: {
  row: TransactionRow;
  money: (amount: number) => string;
  onView: () => void;
  onPaid: () => void;
  detailLoading: boolean;
  language: string;
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'Cash' | 'Digital'>('Cash');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const confirmPayment = async () => {
    setBusy(true); setErr('');
    try { await api('POST', `/transactions/${encodeURIComponent(row.lotId)}/confirm-payment`, { paymentMode: mode }); onPaid(); }
    catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  const materialLabel = t('categories.' + row.material, { defaultValue: row.material });
  const statusLabel = t('common.' + row.paymentStatus.toLowerCase(), { defaultValue: row.paymentStatus });

  return (
    <article className="border border-[var(--color-border)] rounded-xl p-4 space-y-3 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-alt)] transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CategoryIcon category={row.material} size="md" />
          <div>
            <p className="font-semibold text-[var(--color-text)]">{materialLabel}</p>
            <p className="text-sm text-[var(--color-text-muted)] tabular-nums font-mono">{money(row.finalAmount)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-text-muted)]">{new Date(row.date).toLocaleString(language)}</span>
          <StatusChip status={row.paymentStatus as any} size="sm" context="recycler" />
          <Button variant="outline" size="sm" onClick={onView} disabled={detailLoading} leftIcon={<Eye className="w-4 h-4" />}>
            {t('common.view', { defaultValue: 'View' })}
          </Button>
        </div>
      </div>
      {row.paymentStatus === 'Pending' && (
        <div className="flex items-center justify-end gap-3">
          <select value={mode} onChange={(e) => setMode(e.target.value as 'Cash' | 'Digital')} disabled={busy} aria-label={t('common.paymentMode', { defaultValue: 'Payment Mode' })}
            className="border border-[var(--color-border)] rounded-lg px-2 py-1 text-sm bg-[var(--color-surface-elevated)] text-[var(--color-text)]">
            <option value="Cash">{t('common.cash', { defaultValue: 'Cash' })}</option>
            <option value="Digital">{t('common.digital', { defaultValue: 'Digital' })}</option>
          </select>
          <Button variant="primary" size="sm" onClick={confirmPayment} disabled={busy}>
            {t('recyclerPages.confirmPayment', { defaultValue: 'Confirm Payment' })}
          </Button>
        </div>
      )}
      {err && <p role="alert" className="text-sm text-[var(--color-warning)]">{err}</p>}
    </article>
  );
}