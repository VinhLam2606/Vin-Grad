import { initializeApp } from 'firebase/app'
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId,
)

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null
export const db = app ? getFirestore(app) : null

if (db && import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

export function subscribeToWishes(onWishes, onError) {
  if (!db) throw new Error('Firebase chưa được cấu hình.')

  const wishesQuery = query(collection(db, 'wishes'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    wishesQuery,
    (snapshot) => {
      onWishes(snapshot.docs.map((wishDoc) => ({ id: wishDoc.id, ...wishDoc.data() })))
    },
    (error) => onError(new Error(getFirestoreErrorMessage(error))),
  )
}

function getFirestoreErrorMessage(error) {
  const messages = {
    'permission-denied': 'Firestore từ chối truy cập. Hãy publish firestore.rules trong Firebase Console và kiểm tra Rules cho collection wishes.',
    'not-found': 'Chưa tìm thấy Firestore Database. Hãy tạo Cloud Firestore Database trong Firebase Console.',
    unavailable: 'Không kết nối được Firestore. Hãy kiểm tra mạng và thử lại.',
    'failed-precondition': 'Firestore chưa sẵn sàng hoặc cần cấu hình bổ sung. Kiểm tra Firestore Console.',
    'invalid-argument': 'Dữ liệu gửi lên không hợp lệ. Kiểm tra tên và câu chúc.',
    unauthenticated: 'Firebase yêu cầu xác thực. Kiểm tra cấu hình Authentication hoặc Rules.',
  }

  const code = error?.code?.replace(/^firestore\//, '')
  const message = messages[code] || `Không thể lưu lời chúc${code ? ` (Firebase: ${code})` : ''}. Kiểm tra Firestore Console và thử lại.`

  if (import.meta.env.DEV) console.error('Firestore error:', error)
  return message
}

export async function createWish(name, message) {
  if (!db) throw new Error('Firebase chưa được cấu hình. Hãy thêm các biến VITE_FIREBASE_* trước khi gửi.')
  if (!name || name.length > 40 || !message || message.length > 300) {
    throw new Error('Tên và câu chúc phải hợp lệ, lần lượt tối đa 40 và 300 ký tự.')
  }

  try {
    await addDoc(collection(db, 'wishes'), {
      name,
      message,
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    throw new Error(getFirestoreErrorMessage(error))
  }
}