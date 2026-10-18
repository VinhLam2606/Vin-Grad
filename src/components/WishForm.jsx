import { useState } from 'react'
import { createWish } from '../firebase.js'

function WishForm({ connectionError }) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [notice, setNotice] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSending) return

    const cleanName = name.trim()
    const cleanMessage = message.trim()

    if (!cleanName || !cleanMessage) {
      setNotice({ type: 'error', text: 'Vui lòng nhập tên và câu chúc.' })
      return
    }

    if (cleanName.length > 16 || cleanMessage.length > 80) {
      setNotice({ type: 'error', text: 'Tên tối đa 16 ký tự, câu chúc tối đa 80 ký tự.' })
      return
    }

    setIsSending(true)
    setNotice(null)

    try {
      await createWish(cleanName, cleanMessage)
      setName('')
      setMessage('')
      setNotice({ type: 'success', text: 'Lời chúc đã được gửi. Cảm ơn bạn!' })
    } catch (error) {
      setNotice({
        type: 'error',
        text: error.message || 'Gửi lời chúc chưa thành công. Vui lòng thử lại.',
      })
    } finally {
      setIsSending(false)
    }
  }

  const displayedNotice = notice || (connectionError
    ? { type: 'error', text: connectionError }
    : null)

  return (
    <footer className="wish-form-wrap">
      <form className="wish-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">Người gửi</span>
          <span className="field-control field-control-name">
            <svg className="field-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="8" r="3.25" />
              <path d="M5.5 20c.35-3.55 2.65-5.5 6.5-5.5s6.15 1.95 6.5 5.5" />
            </svg>
            <input
              autoComplete="name"
              maxLength={16}
              name="name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Tên của bạn"
              required
              value={name}
            />
          </span>
        </label>
        <label className="field">
          <span className="field-label">Lời nhắn</span>
          <span className="field-control field-control-message">
            <textarea
              maxLength={80}
              name="message"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Gửi một lời chúc đến Vinh"
              required
              rows={1}
              value={message}
            />
            <svg className="field-icon field-icon-trailing" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m4 20 4.2-1 10.9-10.9a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z" />
              <path d="m14.8 6.2 3 3" />
            </svg>
          </span>
        </label>
        <button className="wish-submit" disabled={isSending} type="submit">
          {isSending ? 'Đang gửi…' : 'Gửi'}
          {!isSending && (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m21 3-7.2 18-3.9-7.9L2 9.2 21 3Z" />
              <path d="M21 3 9.9 13.1" />
            </svg>
          )}
        </button>
      </form>
      <p className="form-notice" data-kind={displayedNotice?.type || ''} aria-live="polite">
        {displayedNotice?.text || ''}
      </p>
    </footer>
  )
}

export default WishForm
