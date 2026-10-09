import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Shield, AlertTriangle, Info, ChevronRight } from 'lucide-react';
import i18n from 'i18next';

interface SafetyTopic {
  id: string;
  title: { mr: string; hi: string; en: string };
  icon: string;
  color: string;
  description: { mr: string; hi: string; en: string };
  detailImage: string;
}

const mockSafetyTopics: SafetyTopic[] = [
  {
    id: 'dont-burn-cables',
    title: { mr: 'केबल्स न जलवा', hi: 'केबल्स न जलाएं', en: "Don't Burn Cables" },
    icon: '🔥',
    color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
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
    icon: '📺',
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
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
    icon: '🔋',
    color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
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
    icon: '⚗️',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
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
    // Get current language from i18n
    return i18n.language || 'en';
  };

  const lang = getCurrentLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t('common.back', { defaultValue: 'Back' })}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('common.safety', { defaultValue: 'Safety' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Safety Topics */}
      <main className="max-w-2xl mx-auto px-4 pb-20">
        <div className="mb-6">
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {t('safety.staySafe', { defaultValue: 'Stay Safe While Collecting' })}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
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
        <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">
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
      className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow text-left"
    >
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl ${topic.color} flex items-center justify-center flex-shrink-0`}>
          <span className="text-2xl">{topic.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {topic.title[lang as keyof typeof topic.title] || topic.title.en}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {topic.description[lang as keyof typeof topic.description] || topic.description.en}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
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
        <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-hidden">
          <div className="relative h-48">
            <img
              src={topic.detailImage}
              alt={topic.title.en}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors" aria-label={t('common.close', { defaultValue: 'Close' })}>
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className={`flex items-center gap-3 ${topic.color} px-4 py-3 rounded-xl`}>
              <span className="text-3xl">{topic.icon}</span>
              <h2 className="font-bold text-lg">
                {topic.title[lang as keyof typeof topic.title] || topic.title.en}
              </h2>
            </div>

            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {topic.description[lang as keyof typeof topic.description] || topic.description.en}
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Info className="w-5 h-5" />
                {t('safety.keyPoints', { defaultValue: 'Key Safety Points' })}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
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