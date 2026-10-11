import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import { Button } from './Button';
import { Input } from './Input';

export function HelpForm() {
  const { t } = useTranslation();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) { setError(t('help.fillBoth', { defaultValue: 'Please enter a subject and a description' })); return; }
    setBusy(true); setError('');
    try { await api('POST', '/help', { subject: subject.trim(), message: message.trim() }); setSent(true); setSubject(''); setMessage(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'Error'); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="surface-card p-6 space-y-4">
      <p className="text-muted">{t('help.intro', { defaultValue: 'Tell us about your problem and we will look into it.' })}</p>
      <Input label={t('help.subject', { defaultValue: 'Subject' })} value={subject} maxLength={200} onChange={(e) => { setSent(false); setSubject(e.target.value); }} />
      <label className="block">
        <span className="block text-sm font-medium text-muted mb-1.5">{t('help.description', { defaultValue: 'Description' })}</span>
        <textarea rows={5} maxLength={2000} value={message} onChange={(e) => { setSent(false); setMessage(e.target.value); }}
          className="w-full rounded-lg border border-line bg-panel text-foreground p-3" />
      </label>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {sent && <p role="status" className="text-sm text-success">{t('help.sent', { defaultValue: 'Sent. We will get back to you.' })}</p>}
      <Button type="submit" fullWidth size="lg" loading={busy}>{t('help.send', { defaultValue: 'Send' })}</Button>
    </form>
  );
}
