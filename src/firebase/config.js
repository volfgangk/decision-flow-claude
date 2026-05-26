// =========================================================================
// 1. [FIREBASE CONFIG] — Firebase 연결 설정
// =========================================================================

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// =========================================================================
// 2. [CONFIG VALUES] — 직접 설정 (.env 리셋 문제 방지)
// =========================================================================
const firebaseConfig = {
  apiKey:            'AIzaSyBLATnyMM-sk1w_H6YIDsOJi0hcLfkiGyQ',
  authDomain:        'decisionflow-volfgangk.firebaseapp.com',
  projectId:         'decisionflow-volfgangk',
  storageBucket:     'decisionflow-volfgangk.firebasestorage.app',
  messagingSenderId: '658972701442',
  appId:             '1:658972701442:web:da08329f8b90d73864c81b',
};

// =========================================================================
// 3. [INITIALIZATION]
// =========================================================================
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
export default app;