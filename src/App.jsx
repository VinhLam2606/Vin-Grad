import { useEffect, useState } from 'react'
import GraduationSticker from './components/GraduationSticker.jsx'
import PixelMarquee from './components/PixelMarquee.jsx'
import WishForm from './components/WishForm.jsx'
import { isFirebaseConfigured, subscribeToWishes } from './firebase.js'
import './App.css'

const FIREBASE_SETUP_ERROR = 'Firebase chưa được cấu hình. Hãy thiết lập các biến VITE_FIREBASE_* để gửi và đồng bộ lời chúc.'

function App() {
  const [wishes, setWishes] = useState([])
  const [connectionError, setConnectionError] = useState(
    isFirebaseConfigured ? '' : FIREBASE_SETUP_ERROR,
  )

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined

    return subscribeToWishes((nextWishes) => {
      setWishes(nextWishes)
      setConnectionError('')
    }, () => {
      setConnectionError('Không thể tải lời chúc từ Firestore. Vui lòng kiểm tra cấu hình và kết nối mạng.')
    })
  }, [])

  return (
    <main className="page-shell">
      <PixelMarquee wishes={wishes} />
      <section className="hero-stage" aria-label="Lời chúc mừng tốt nghiệp">
        <div className="graduate">
          <GraduationSticker src={`${import.meta.env.BASE_URL}vinhsticker.png`} />
        </div>
      </section>
      <WishForm connectionError={connectionError} />
    </main>
  )
}

export default App
