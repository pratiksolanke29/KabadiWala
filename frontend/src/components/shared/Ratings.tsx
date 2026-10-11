import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import { Button } from './Button';

export interface RatingSummary { count: number; average: number }
export interface ReviewItem { stars: number; comment: string; fromRole: string; fromName: string; createdAt: string }

export function Stars({ value }: { value: number }) {
  return <span aria-label={`${value} / 5`} className="text-muted">{'★'.repeat(Math.round(value))}<span className="text-line">{'★'.repeat(5 - Math.round(value))}</span></span>;
}

/** Small "★ 4.5 (3)" label. Shows "New" when nobody has rated yet. */
export function RatingBadge({ rating }: { rating?: RatingSummary }) {
  const { t } = useTranslation();
  if (!rating || !rating.count) return <span>{t('ratings.noRatings', { defaultValue: 'No ratings yet' })}</span>;
  return <span className="tabular-nums"><span className="text-muted">★</span> {rating.average.toFixed(1)} ({rating.count})</span>;
}

/** Public reviews list, shown on profiles. There is no way to hide a review. */
export function ReviewList({ reviews }: { reviews?: ReviewItem[] }) {
  const { t } = useTranslation();
  if (!reviews || !reviews.length) return null;
  return (
    <div className="mt-4 pt-4 border-t border-line space-y-3">
      <h3 className="font-semibold text-foreground font-sans">{t('ratings.reviews', { defaultValue: 'Reviews' })}</h3>
      {reviews.map((r, i) => (
        <div key={i} className="p-3 bg-surface-alt rounded-card">
          <div className="flex justify-between text-sm"><span className="font-medium text-foreground">{r.fromName}</span><Stars value={r.stars} /></div>
          {r.comment && <p className="text-sm text-muted mt-1 break-words">{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}

/** Rate-the-other-side box. `path` is the POST endpoint. Shows the given rating once it exists. */
export function RateDeal({ path, existing, whom, onDone }: { path: string; existing?: { stars: number; comment: string }; whom: string; onDone?: () => void }) {
  const { t } = useTranslation();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [mine, setMine] = useState(existing);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (mine) {
    return <div className="p-4 bg-surface-alt rounded-card text-sm text-muted">{t('ratings.youRated', { defaultValue: 'You rated {{name}}', name: whom })}: <Stars value={mine.stars} /></div>;
  }
  const submit = async () => {
    if (!stars) { setErr(t('ratings.pickStars', { defaultValue: 'Choose 1 to 5 stars' })); return; }
    setBusy(true); setErr('');
    try { await api('POST', path, { stars, comment }); setMine({ stars, comment }); onDone?.(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Error'); }
    finally { setBusy(false); }
  };
  return (
    <div className="p-4 bg-surface-alt rounded-card space-y-3">
      <p className="font-medium text-foreground">{t('ratings.rate', { defaultValue: 'Rate {{name}}', name: whom })}</p>
      <div className="flex gap-1" role="radiogroup">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n}`} onClick={() => setStars(n)}
            className={`text-2xl leading-none ${n <= stars ? 'text-muted' : 'text-line'}`}>★</button>
        ))}
      </div>
      <textarea value={comment} maxLength={500} onChange={(e) => setComment(e.target.value)} rows={2}
        placeholder={t('ratings.comment', { defaultValue: 'Add a comment (optional, visible to everyone)' })}
        className="w-full rounded-lg border border-line bg-panel text-foreground p-3" />
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <Button fullWidth onClick={submit} loading={busy}>{t('ratings.submit', { defaultValue: 'Submit rating' })}</Button>
    </div>
  );
}
