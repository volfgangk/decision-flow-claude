// =========================================================================
// 1. [FIREBASE CONFIG] — Firebase 연결 설정
// 역할: 앱과 Firebase를 연결하는 "콘센트" (전기 코드를 꽂는 곳)
// 수정할 일: Firebase 프로젝트를 변경할 때만
// =========================================================================

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// =========================================================================
// 2. [CONFIG VALUES] — .env에서 설정값 불러오기
// =========================================================================
const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

// =========================================================================
// 3. [INITIALIZATION] — Firebase 앱 초기화 및 서비스 내보내기
// =========================================================================
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
export default app;