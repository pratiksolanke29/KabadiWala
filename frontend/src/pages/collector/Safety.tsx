import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Shield, AlertTriangle, Info, ChevronRight } from 'lucide-react';
import i18n from 'i18next';
import { Modal } from '../../components/shared/Modal';
import { Button } from '../../components/shared/Button';

interface SafetyTopic {
  id: string;
  title: { mr: string; hi: string; en: string };
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: { mr: string; hi: string; en: string };
  detailImage: string;
}

/* SVG icons for safety topics */
const FireIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const MonitorIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M2 9h20" />
    <path d="M12 17v4" />
    <path d="M8 21h8" />
    <circle cx="12" cy="17" r="1" />
  </svg>
);

const BatteryIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="6" width="16" height="12" rx="2" />
    <rect x="18" y="9" width="4" height="6" rx="1" />
    <path d="M6 10h4" />
    <path d="M6 14h4" />
    <path d="M14 10h4" />
    <path d="M14 14h4" />
  </svg>
);

const AcidIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
    <path d="M12 7v10" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const mockSafetyTopics: SafetyTopic[] = [
  {
    id: 'dont-burn-cables',
    title: { mr: 'केबल्स न जलवा', hi: 'केबल्स न जलाएं', en: "Don't Burn Cables" },
    icon: FireIcon,
    color: 'text-danger',
    bgColor: 'bg-danger-soft',
    description: {
      mr: 'कॉपर मिळवण्यासाठी केबल्स जलवणे वातावरणाला दूषित करते आणि आरोग्यसाठी हानिकारक आहे.',
      hi: 'कॉपर पाने के लिए केबल्स जलाना पर्यावरण को प्रदूषित करता है और स्वास्थ्य के लिए हानिकारक है।',
      en: 'Burning cables to extract copper pollutes the environment and is harmful to health.'
    },
    detailImage: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800'
  },
  {
    id: 'crt-handling',
    title: { mr: 'CRT हाताळणी', hi: 'CRT संचालन', en: 'CRT Handling' },
    icon: MonitorIcon,
    color: 'text-accent',
    bgColor: 'bg-accent-soft/10',
    description: {
      mr: 'CRT मॉनिटर्समध्ये लेड असते. त्यांचे चुकीच्या प्रकारचे हाताळणी विषारी असू शकते.',
      hi: 'CRT मॉनिटर्स में लेड होता है। गलत संचालन विषाक्त हो सकता है।',
      en: 'CRT monitors contain lead. Improper handling can be toxic.'
    },
    detailImage: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800'
  },
  {
    id: 'batteries',
    title: { mr: 'बॅटरीज', hi: 'बैटरीज', en: 'Batteries' },
    icon: BatteryIcon,
    color: 'text-muted',
    bgColor: 'bg-surface-alt',
    description: {
      mr: 'लिथियम आयन बॅटरीज दाबल्यास किंवा थेट सूर्यप्रकाशात ठेवल्यास विस्फोटू शकतात.',
      hi: 'लिथियम आयन बैटरीज दबाने पर या सीधी धूप में रखने पर फट सकती हैं।',
      en: 'Lithium-ion batteries can explode if punctured or exposed to direct sunlight.'
    },
    detailImage: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800'
  },
  {
    id: 'dont-open-pcbs',
    title: { mr: 'PCB उघडू नका / अॅसिड', hi: 'PCB न खोलें / एसिड', en: "Don't Open PCBs / Acid" },
    icon: AcidIcon,
    color: 'text-accent',
    bgColor: 'bg-accent-soft',
    description: {
      mr: 'PCB उघडण्यासाठी अॅसिड वापरणे अत्यंत धोकादायक आहे. व्यावसायिकांचा सहारा घ्या.',
      hi: 'PCB खोलने के लिए एसिड का उपयोग करना बेहद खतरनाक है। पेशेवरों की मदद लें।',
      en: 'Using acid to open PCBs is extremely dangerous. Seek professional help.'
    },
    detailImage: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800'
  },
];

export function Safety() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<SafetyTopic | null>(null);

  const handleBack = () => {
    if (selectedTopic) {
      setSelectedTopic(null);
    } else {
      navigate('/collector/home');
    }
  };

  const getCurrentLanguage = () => {
    return i18n.language || 'en';
  };

  const lang = getCurrentLanguage();

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-panel border-b border-line sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-surface-alt transition-colors focus-visible:ring-2 ring-accent ring-offset-2"
            aria-label={t('common.back', { defaultValue: 'Back' })}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground font-sans">
            {t('common.safety', { defaultValue: 'Safety' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Safety Topics */}
      <main className="max-w-6xl mx-auto px-4 pb-24">
        <div className="mb-6">
          <div className="flex items-center gap-3 p-4 bg-accent-soft border border-accent rounded-card">
            <div className="w-10 h-10 rounded-lg bg-accent-soft/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {t('safety.staySafe', { defaultValue: 'Stay Safe While Collecting' })}
              </p>
              <p className="text-sm text-muted">
                {t('safety.followGuidelines', { defaultValue: 'Follow these guidelines to protect yourself and the environment' })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {mockSafetyTopics.map((topic) => (
            <SafetyCard
              key={topic.id}
              topic={topic}
              lang={lang}
              onClick={() => setSelectedTopic(topic)}
            />
          ))}
        </div>

        {/* Emergency Info */}
        <div className="mt-8 p-4 bg-danger-soft border border-danger rounded-card">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-danger/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
            <div className="text-sm text-danger">
              <p className="font-medium mb-1">{t('safety.emergency', { defaultValue: 'Emergency Contacts' })}</p>
              <p>{t('safety.fire', { defaultValue: 'Fire: 101' })}</p>
              <p>{t('safety.ambulance', { defaultValue: 'Ambulance: 108' })}</p>
              <p>{t('safety.police', { defaultValue: 'Police: 100' })}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Safety Detail Modal */}
      {selectedTopic && (
        <SafetyDetailModal
          topic={selectedTopic}
          lang={lang}
          onClose={() => setSelectedTopic(null)}
        />
      )}
    </div>
  );
}

function SafetyCard({ topic, lang, onClick }: { topic: SafetyTopic; lang: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full surface-card p-4 hover:bg-surface-alt transition-colors duration-150 text-left focus-visible:ring-2 ring-accent ring-offset-2"
    >
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-card ${topic.bgColor} flex items-center justify-center flex-shrink-0 ${topic.color}`}>
          {topic.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground break-words">
            {topic.title[lang as keyof typeof topic.title] || topic.title.en}
          </h3>
          <p className="text-sm text-muted mt-1 break-words">
            {topic.description[lang as keyof typeof topic.description] || topic.description.en}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-subtle flex-shrink-0" />
      </div>
    </button>
  );
}

function SafetyDetailModal({ topic, lang, onClose }: { topic: SafetyTopic; lang: string; onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
        <div className="relative w-full max-w-lg surface-card max-h-[90vh] overflow-hidden">
          <div className="relative h-48">
            <img
              src={topic.detailImage}
              alt={topic.title.en}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-panel/90  rounded-full hover:bg-panel  transition-colors focus-visible:ring-2 ring-accent ring-offset-2" aria-label={t('common.close', { defaultValue: 'Close' })}>
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className={`flex items-center gap-3 ${topic.bgColor} ${topic.color} px-4 py-3 rounded-card`}>
              <span className="text-2xl">{topic.icon}</span>
              <h2 className="font-semibold text-base">
                {topic.title[lang as keyof typeof topic.title] || topic.title.en}
              </h2>
            </div>

            <div className="prose  max-w-none">
              <p className="text-foreground leading-relaxed">
                {topic.description[lang as keyof typeof topic.description] || topic.description.en}
              </p>
            </div>

            <div className="p-4 bg-surface-alt rounded-card">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Info className="w-5 h-5 text-accent" />
                {t('safety.keyPoints', { defaultValue: 'Key Safety Points' })}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted">
                <li>{t('safety.point1', { defaultValue: 'Always wear protective gloves and eyewear' })}</li>
                <li>{t('safety.point2', { defaultValue: 'Work in well-ventilated areas' })}</li>
                <li>{t('safety.point3', { defaultValue: 'Never burn e-waste to extract metals' })}</li>
                <li>{t('safety.point4', { defaultValue: 'Store batteries in cool, dry places away from sunlight' })}</li>
                <li>{t('safety.point5', { defaultValue: 'Dispose of broken CRTs at authorized centers only' })}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}