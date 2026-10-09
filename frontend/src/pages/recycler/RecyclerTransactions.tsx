import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import type { TransactionRow, CompletedLot } from '../../types';
import { RecyclerShell, RequestState, cardClass } from './RecyclerShell';

export function RecyclerTransactions() {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<CompletedLot | null>(null);
  const [detailError, setDetailError] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const load = async () => { setLoading(true); setError(''); try { setRows(await api<TransactionRow[]>('GET', '/transactions')); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const receipt = async (id: string) => { setDetail(null); setDetailError(''); setDetailLoading(true); try { setDetail(await api<CompletedLot>('GET', '/transactions/' + encodeURIComponent(id))); } catch (e) { setDetailError((e as Error).message); } finally { setDetailLoading(false); } };
  const money = (amount: number) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'INR' }).format(amount);
  return <RecyclerShell><div className="flex justify-between items-center gap-4 mb-6"><h2 className="text-2xl font-bold">{t('common.transactions')}</h2><button className="text-green-700 dark:text-green-400" onClick={load} disabled={loading}>{t('recyclerPages.refresh')}</button></div>
    <RequestState loading={loading} error={error} retry={load} />
    {!loading && !error && <div className={cardClass}>{rows.length === 0 ? <p className="py-8 text-center text-gray-500">{t('recyclerPages.noTransactions')}</p> : <div><div className="md:hidden space-y-4">{rows.map(row => <article key={row.lotId} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3"><p className="font-semibold">{t('categories.' + row.material, { defaultValue: row.material })} · {money(row.finalAmount)}</p><p className="text-sm text-gray-500">{new Date(row.date).toLocaleString(i18n.language)}</p><div className="flex justify-between gap-3"><span>{t('common.' + row.paymentStatus.toLowerCase())}</span><button className="text-green-700 dark:text-green-400 underline" disabled={detailLoading} onClick={() => receipt(row.lotId)}>{t('common.view')} {t('common.receipt')}</button></div></article>)}</div><div className="hidden md:block overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['date', 'material', 'amount', 'status', 'receipt'].map(key => <th key={key} className="p-3 border-b dark:border-gray-700">{t(key === 'material' ? 'recyclerPages.material' : 'common.' + key)}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.lotId}><td className="p-3">{new Date(row.date).toLocaleString(i18n.language)}</td><td className="p-3">{t('categories.' + row.material, { defaultValue: row.material })}</td><td className="p-3 font-semibold">{money(row.finalAmount)}</td><td className="p-3">{t('common.' + row.paymentStatus.toLowerCase())}</td><td className="p-3"><button className="text-green-700 dark:text-green-400 underline" disabled={detailLoading} onClick={() => receipt(row.lotId)}>{t('common.view')}</button></td></tr>)}</tbody></table></div></div>}</div>}
    {detailLoading && <p role="status" className="mt-4">{t('common.loading')}</p>}
    {detailError && <p role="alert" className="mt-4 text-red-600">{detailError}</p>}
    {detail && <section aria-label={t('common.receipt')} className={cardClass + ' mt-6'}><div className="flex justify-between mb-4"><h3 className="text-xl font-semibold">{t('common.receipt')}</h3><button onClick={() => setDetail(null)}>{t('common.close')}</button></div><dl className="grid sm:grid-cols-2 gap-4">{[
      [t('recyclerPages.lotId'), detail.id], [t('recyclerPages.collector'), detail.collectorName], [t('common.handoverCode'), detail.refId], [t('recyclerPages.material'), t('categories.' + detail.category, { defaultValue: detail.category })], [t('common.finalWeight'), detail.finalWeightKg + ' kg'], [t('common.finalRate'), money(detail.finalRate) + '/kg'], [t('common.total'), money(detail.finalTotal)], [t('common.paymentMode'), t('common.' + detail.paymentMode.toLowerCase())]
    ].map(([key, value]) => <div key={key}><dt className="text-sm text-gray-500">{key}</dt><dd className="font-medium break-all">{value}</dd></div>)}</dl></section>}
  </RecyclerShell>;
}
