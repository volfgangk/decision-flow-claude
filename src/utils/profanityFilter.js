// =========================================================================
// 1. [IMPORTS]
// =========================================================================
import { BANNED_WORDS_KO, BANNED_WORDS_EN, SUBSTITUTION_MAP } from '../constants/bannedWords';

// =========================================================================
// 2. [NORMALIZE TEXT] — 우회 방지용 텍스트 정규화
// 비유: 변장을 벗겨서 원래 얼굴을 확인하는 것
// =========================================================================
function normalizeText(text) {
  if (!text) return '';

  let normalized = text.toLowerCase();

  // 공백/특수문자 제거 (띄어쓰기 우회 방지: "시 발" → "시발")
  normalized = normalized.replace(/[\s\-_.,!?@#$%^&*()+=\[\]{}<>\/\\|~`'"：；·•]/g, '');

  // 문자 치환 복원 (숫자/기호 → 원래 문자: "s1bal" → "sibal")
  let substituted = '';
  for (const char of normalized) {
    substituted += SUBSTITUTION_MAP[char] || char;
  }

  return substituted;
}

// =========================================================================
// 3. [CHECK PROFANITY] — 부적절한 단어 검사
// 반환: { isClean: true/false, matchedWord: '매칭된단어' }
// =========================================================================
function checkProfanity(text) {
  if (!text || text.trim().length === 0) {
    return { isClean: true, matchedWord: null };
  }

  const normalized = normalizeText(text);
  const original = text.toLowerCase().replace(/\s/g, '');

  // 한국어 검사
  for (const word of BANNED_WORDS_KO) {
    const normalizedWord = word.toLowerCase().replace(/\s/g, '');
    if (normalized.includes(normalizedWord) || original.includes(normalizedWord)) {
      return { isClean: false, matchedWord: word };
    }
  }

  // 영어 검사
  for (const word of BANNED_WORDS_EN) {
    const normalizedWord = word.toLowerCase();
    if (normalized.includes(normalizedWord) || original.includes(normalizedWord)) {
      return { isClean: false, matchedWord: word };
    }
  }

  // 반복 문자 우회 검사 ("시이이발" → "시발")
  const deduped = normalized.replace(/(.)\1{2,}/g, '$1');
  for (const word of BANNED_WORDS_KO) {
    const normalizedWord = word.toLowerCase().replace(/\s/g, '');
    if (deduped.includes(normalizedWord)) {
      return { isClean: false, matchedWord: word };
    }
  }
  for (const word of BANNED_WORDS_EN) {
    if (deduped.includes(word.toLowerCase())) {
      return { isClean: false, matchedWord: word };
    }
  }

  return { isClean: true, matchedWord: null };
}

// =========================================================================
// 4. [VALIDATE INPUT] — 통합 검증 함수 (모든 입력란에서 사용)
// 반환: { valid: true/false, message: '에러메시지' }
// =========================================================================
function validateInput(text, maxLength = 20, fieldName = '입력') {
  if (!text || text.trim().length === 0) {
    return { valid: false, message: `${fieldName}을(를) 입력해주세요` };
  }

  if (text.trim().length > maxLength) {
    return { valid: false, message: `${fieldName}은(는) ${maxLength}자 이내로 입력해주세요` };
  }

  const profanityCheck = checkProfanity(text);
  if (!profanityCheck.isClean) {
    return { valid: false, message: '부적절한 표현이 포함되어 있어요' };
  }

  return { valid: true, message: null };
}

export { checkProfanity, validateInput, normalizeText };