// Normalizes a phone number typed by a client: 8-digit Tunisian numbers (with
// or without 216 / +216 / 00216) become +216XXXXXXXX, other international
// numbers are kept as +<digits>. Returns null when it doesn't look like a phone.
const normalizePhone = (raw) => {
  let p = String(raw || '').replace(/[\s().-]/g, '');
  if (p.startsWith('00')) p = `+${p.slice(2)}`;
  if (/^\d{8}$/.test(p)) return `+216${p}`;
  if (/^216\d{8}$/.test(p)) return `+${p}`;
  if (/^\+\d{8,15}$/.test(p)) return p;
  return null;
};

const phoneDigits = (p) => String(p || '').replace(/\D/g, '');

// Two numbers match when their last 8 digits are the same (ignores country code and spacing)
const samePhone = (a, b) => {
  const x = phoneDigits(a);
  const y = phoneDigits(b);
  return x.length >= 8 && y.length >= 8 && x.slice(-8) === y.slice(-8);
};

module.exports = { normalizePhone, phoneDigits, samePhone };
