import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLotStore } from '../../hooks/useLotStore';
import { Button } from '../../components/shared/Button';
import { StatusChip } from '../../components/shared/StatusChip';
import { Card, ListRow, SectionTitle, Stat } from '../../components/shared/primitives';
import { ChevronRight, CircleHelp, Package, Recycle, ShieldCheck, Wallet } from 'lucide-react';

export function CollectorHomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { savedLots, loadLots } = useLotStore();
  useEffect(() => { loadLots().catch(() => {}); }, [loadLots]);

  const totalEarned = savedLots.filter((lot) => lot.status === 'Paid').reduce((sum, lot) => sum + (lot.finalTotal || 0), 0);
  const totalPending = savedLots.filter((lot) => lot.status === 'HandedOver' || lot.status === 'Quoted').reduce((sum, lot) => sum + (lot.quotedTotal || lot.estimateMax || 0), 0);
  const recentLots = [...savedLots].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()).slice(0, 3);

  const links = [
    { label: t('common.earnings', { defaultValue: 'Earnings' }), icon: Wallet, onClick: () => navigate('/collector/earnings') },
    { label: t('common.safety', { defaultValue: 'Safety' }), icon: ShieldCheck, onClick: () => navigate('/collector/safety') },
    { label: t('common.help', { defaultValue: 'Help' }), icon: CircleHelp, onClick: () => navigate('/collector/help') },
  ];

  return (
    <div className="grid gap-6 py-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)] lg:items-start lg:gap-8 lg:py-8">
      <div className="min-w-0 space-y-6 lg:col-start-1">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold leading-snug text-foreground lg:text-3xl">{t('home.welcome', { defaultValue: 'Welcome back' })}</h2>
        <p className="mt-1 text-sm text-muted">{t('home.chooseAction', { defaultValue: 'Manage your scrap lots and earnings' })}</p>
      </div>

      <Button fullWidth size="lg" className="justify-between lg:max-w-sm" onClick={() => navigate('/collector/create-lot/photo')} leftIcon={<Recycle size={20} strokeWidth={1.75} />} rightIcon={<ChevronRight size={20} strokeWidth={1.75} />}>
        {t('common.createLot', { defaultValue: 'Create lot' })}
      </Button>

      <div className="grid grid-cols-2 gap-6 border-b border-line pb-5 lg:gap-10">
        <Stat label={t('common.totalEarned', { defaultValue: 'Earned' })} value={`₹${totalEarned.toLocaleString()}`} />
        <Stat label={t('common.pending', { defaultValue: 'Pending' })} value={`₹${totalPending.toLocaleString()}`} />
      </div>

      <section aria-labelledby="recent-lots-heading" className="min-w-0">
        <SectionTitle action={<button type="button" onClick={() => navigate('/collector/my-lots')} className="min-h-11 rounded-lg px-2 text-sm font-medium text-accent hover:bg-surface-alt">{t('common.viewAll', { defaultValue: 'View all' })}</button>}>
          <span id="recent-lots-heading">{t('home.recentLots', { defaultValue: 'Recent lots' })}</span>
        </SectionTitle>
        <Card className="px-4">
          {recentLots.length === 0 ? (
            <div className="py-7 text-center">
              <Package className="mx-auto mb-2 text-subtle" size={24} strokeWidth={1.75} aria-hidden="true" />
              <p className="text-sm text-muted">{t('myLots.noLots', { defaultValue: 'No lots yet' })}</p>
            </div>
          ) : recentLots.map((lot) => (
            <ListRow
              key={lot.id}
              title={t(`categories.${lot.category}`, { defaultValue: lot.category })}
              meta={`${lot.weightKg} kg · ${new Date(lot.updatedAt || lot.createdAt).toLocaleDateString()}`}
              trailing={<div className="flex shrink-0 flex-col items-end gap-1.5"><StatusChip status={lot.status} size="sm" /><span className="text-sm font-medium tabular-nums text-foreground">₹{(lot.finalTotal || lot.quotedTotal || lot.estimateMax || 0).toLocaleString()}</span></div>}
              onClick={() => navigate(`/collector/my-lots/${lot.id}`)}
            />
          ))}
        </Card>
      </section>
      </div>

      <section aria-label={t('common.more', { defaultValue: 'More' })} className="min-w-0 lg:col-start-2 lg:row-start-1 lg:rounded-xl lg:border lg:border-line lg:bg-panel lg:p-5">
        <div className="divide-y divide-line border-y border-line">
          {links.map(({ label, icon: Icon, onClick }) => (
            <button key={label} type="button" onClick={onClick} className="flex min-h-14 w-full items-center gap-3 py-3 text-left text-foreground hover:bg-surface-alt/60">
              <Icon size={20} strokeWidth={1.75} className="text-muted" />
              <span className="min-w-0 flex-1 font-medium">{label}</span>
              <ChevronRight size={18} className="text-subtle" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
