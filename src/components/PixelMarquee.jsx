import { useLayoutEffect, useMemo, useRef, useState } from 'react'

const SAMPLE_WISHES = [
  'CHÚC MỪNG TỐT NGHIỆP!',
  'CONGRATULATIONS!',
  'CHÚC VINH THÀNH CÔNG!',
  'A NEW CHAPTER BEGINS!',
  'CHÚC BẠN LUÔN THÀNH CÔNG!',
]

const ROW_COUNT = 8
const MAX_MARQUEE_MESSAGE_LENGTH = 88
const MARQUEE_SPEED_PX_PER_SECOND = 38

function shortenWish(name, message) {
  const text = `${name}: ${message}`
  return text.length > MAX_MARQUEE_MESSAGE_LENGTH
    ? `${text.slice(0, MAX_MARQUEE_MESSAGE_LENGTH - 1).trimEnd()}…`
    : text
}

function MarqueeRow({ messages, rowIndex }) {
  const copyRef = useRef(null)
  const [motion, setMotion] = useState({ shouldLoop: false, duration: 0 })
  const isReverse = rowIndex % 2 === 1

  useLayoutEffect(() => {
    const copy = copyRef.current
    if (!copy) return undefined

    function measureCopy() {
      const copyWidth = copy.scrollWidth
      const viewportWidth = window.innerWidth
      const shouldLoop = copyWidth > viewportWidth
      const distance = shouldLoop ? copyWidth : viewportWidth + copyWidth
      const duration = distance / MARQUEE_SPEED_PX_PER_SECOND
      setMotion((currentMotion) => {
        if (currentMotion.shouldLoop === shouldLoop && currentMotion.duration === duration) {
          return currentMotion
        }

        return { shouldLoop, duration }
      })
    }

    measureCopy()
    const observer = new ResizeObserver(measureCopy)
    observer.observe(copy)
    window.addEventListener('resize', measureCopy)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measureCopy)
    }
  }, [messages])

  return (
    <div
      className={`marquee-row${isReverse ? ' marquee-row-reverse' : ''}`}
      style={{
        top: `${((rowIndex + 0.5) / messages.length) * 100}%`,
        '--duration': `${motion.duration}s`,
        '--delay': `${rowIndex * 0.35}s`,
      }}
    >
      <div className={`marquee-track${motion.shouldLoop ? ' marquee-track-seamless' : ' marquee-track-pass'}`}>
        <span className="marquee-copy" ref={copyRef}>
          {messages.map((message) => (
            <span className="marquee-phrase" key={message}>
              {message}
              <span className="marquee-separator"> ✦ </span>
            </span>
          ))}
        </span>
        {motion.shouldLoop && (
          <span className="marquee-copy marquee-copy-clone" aria-hidden="true">
            {messages.map((message) => (
              <span className="marquee-phrase" key={message}>
                {message}
                <span className="marquee-separator"> ✦ </span>
              </span>
            ))}
          </span>
        )}
      </div>
    </div>
  )
}

function PixelMarquee({ wishes }) {
  const messages = useMemo(() => (wishes.length > 0
    ? [...new Set(wishes.map(({ name, message }) => shortenWish(name, message)))]
    : SAMPLE_WISHES), [wishes])
  const lanes = useMemo(() => {
    const distributedMessages = Array.from({ length: ROW_COUNT }, () => [])
    messages.forEach((message, messageIndex) => {
      distributedMessages[messageIndex % ROW_COUNT].push(message)
    })
    return distributedMessages
  }, [messages])

  return (
    <div className="marquee-layer" aria-hidden="true">
      {lanes.filter((laneMessages) => laneMessages.length > 0).map((laneMessages, rowIndex) => (
        <MarqueeRow key={rowIndex} messages={laneMessages} rowIndex={rowIndex} />
      ))}
    </div>
  )
}

export default PixelMarquee
