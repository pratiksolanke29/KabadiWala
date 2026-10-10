// Optional AWS integrations. Every function is a safe no-op when its env var is not set or the call fails,
// so the app never breaks if AWS is not configured. Credentials come from the default AWS chain
// (the EC2 instance role on the server), never from code.
//   REKOGNITION=1          -> label detection on identify photos
//   SNS_TOPIC_ARN=arn:...  -> admin alerts
//   SES_FROM_EMAIL=a@b.com -> receipt emails (sender must be verified in SES)
//   AWS_REGION             -> defaults to ap-south-1
import { RekognitionClient, DetectLabelsCommand } from '@aws-sdk/client-rekognition';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const region = (env) => env.AWS_REGION || 'ap-south-1';

// Rekognition label -> existing identify category (lowercase label names).
const LABEL_CATEGORY = {
  'circuit board': 'PCB', 'electronic chip': 'PCB', 'motherboard': 'PCB', 'integrated circuit': 'PCB', 'printed circuit board': 'PCB', 'electronics': 'PCB', 'computer hardware': 'PCB', 'hardware': 'PCB',
  'cable': 'wires/cables', 'wire': 'wires/cables', 'electrical wiring': 'wires/cables', 'power cord': 'wires/cables', 'cord': 'wires/cables', 'extension cord': 'wires/cables',
  'battery': 'battery', 'power bank': 'battery',
  'metal': 'metal', 'scrap metal': 'metal', 'steel': 'metal', 'iron': 'metal', 'aluminium': 'metal',
  'plastic': 'plastic', 'plastic bottle': 'plastic',
  'appliance': 'appliance', 'television': 'appliance', 'tv': 'appliance', 'monitor': 'appliance', 'screen': 'appliance', 'lcd screen': 'appliance', 'display': 'appliance', 'computer monitor': 'appliance', 'refrigerator': 'appliance', 'microwave': 'appliance',
};
// Only these map to exactly one existing lot category; the rest stay for the user to pick.
const LOT_BY_CATEGORY = { PCB: 'PCB', 'wires/cables': 'Cables', battery: 'Batteries', plastic: 'Mixed Plastics' };

export function mapLabels(labels) {
  const best = labels.filter((l) => LABEL_CATEGORY[l.name.toLowerCase()]).sort((a, b) => b.confidence - a.confidence)[0];
  if (!best) return { category: null, lotCategory: null };
  const category = LABEL_CATEGORY[best.name.toLowerCase()];
  return { category, lotCategory: LOT_BY_CATEGORY[category] ?? null };
}

// Returns { labels: [{name, confidence}], category, lotCategory } or null (disabled / failed).
export function createLabeler({ env = process.env, send } = {}) {
  let client;
  return async (bytes) => {
    if (!send && env.REKOGNITION !== '1') return null;
    try {
      const input = { Image: { Bytes: bytes }, MaxLabels: 10, MinConfidence: 70 };
      const out = await (send ? send(input) : (client ??= new RekognitionClient({ region: region(env), maxAttempts: 1 })).send(new DetectLabelsCommand(input), { abortSignal: AbortSignal.timeout(8000) }));
      const labels = (out?.Labels ?? []).filter((l) => l.Name).map((l) => ({ name: l.Name, confidence: Math.round(l.Confidence ?? 0) })).slice(0, 8);
      if (!labels.length) return null;
      return { labels, ...mapLabels(labels) };
    } catch (e) { console.error('REKOGNITION FAILED:', e?.message ?? e); return null; }
  };
}

// notify(subject, message) -> Promise<boolean>. Never throws.
export function createNotifier({ env = process.env, send } = {}) {
  let client;
  return async (subject, message) => {
    const arn = env.SNS_TOPIC_ARN;
    if (!arn) return false;
    try {
      const input = { TopicArn: arn, Subject: String(subject).slice(0, 100), Message: String(message).slice(0, 2000) };
      await (send ? send(input) : (client ??= new SNSClient({ region: env.SNS_REGION || region(env), maxAttempts: 1 })).send(new PublishCommand(input), { abortSignal: AbortSignal.timeout(8000) }));
      return true;
    } catch (e) { console.error('SNS FAILED:', e?.message ?? e); return false; }
  };
}

// sendMail(to, subject, text) -> Promise<boolean>. Never throws.
export function createMailer({ env = process.env, send } = {}) {
  let client;
  return async (to, subject, text) => {
    const from = env.SES_FROM_EMAIL;
    if (!from || !to) return false;
    try {
      const input = { FromEmailAddress: from, Destination: { ToAddresses: [to] }, Content: { Simple: { Subject: { Data: subject }, Body: { Text: { Data: text } } } } };
      await (send ? send(input) : (client ??= new SESv2Client({ region: env.SES_REGION || region(env), maxAttempts: 1 })).send(new SendEmailCommand(input), { abortSignal: AbortSignal.timeout(8000) }));
      return true;
    } catch (e) { console.error('SES FAILED:', e?.message ?? e); return false; }
  };
}
