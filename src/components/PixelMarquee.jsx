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
const MARQUEE_SPEED_PX_PER_SECOND = 24

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
      const shouldLoop = copyWidth > viewportWidth * 1.05

      const duration = shouldLoop ? copyWidth / MARQUEE_SPEED_PX_PER_SECOND : 0
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
        top: `${((rowIndex + 0.5) / ROW_COUNT) * 100}%`,
        '--duration': `${motion.duration}s`,
        '--phase': `${-(rowIndex / ROW_COUNT) * motion.duration}s`,
      }}
    >
      <div className={`marquee-track${motion.shouldLoop ? ' marquee-track-animated' : ' marquee-track-static'}`}>
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
      {lanes.map((laneMessages, rowIndex) => (
        <MarqueeRow key={rowIndex} messages={laneMessages} rowIndex={rowIndex} />
      ))}
    </div>
  )
}

export default PixelMarquee
