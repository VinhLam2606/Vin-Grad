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
const MAX_PATTERN_REPEATS = 64
const MARQUEE_SPEED_PX_PER_SECOND = 38

function shortenWish(name, message) {
  const text = `${name}: ${message}`
  return text.length > MAX_MARQUEE_MESSAGE_LENGTH
    ? `${text.slice(0, MAX_MARQUEE_MESSAGE_LENGTH - 1).trimEnd()}…`
    : text
}

function MarqueeRow({ messages, rowIndex }) {
  const copyRef = useRef(null)
  const [motion, setMotion] = useState({ shouldLoop: false, duration: 0, repeatCount: 1 })
  const isReverse = rowIndex % 2 === 1

  useLayoutEffect(() => {
    const copy = copyRef.current
    if (!copy) return undefined

    function measureCopy() {
      const patternWidth = copy.firstElementChild?.scrollWidth || copy.scrollWidth
      const viewportWidth = window.innerWidth
      const repeatCount = patternWidth > 0
        ? Math.min(MAX_PATTERN_REPEATS, Math.max(1, Math.ceil(viewportWidth / patternWidth) + 1))
        : 1
      const copyWidth = patternWidth * repeatCount
      const shouldLoop = copyWidth > viewportWidth
      const distance = shouldLoop ? copyWidth : viewportWidth + copyWidth
      const duration = distance / MARQUEE_SPEED_PX_PER_SECOND
      setMotion((currentMotion) => {
        if (
          currentMotion.shouldLoop === shouldLoop &&
          currentMotion.duration === duration &&
          currentMotion.repeatCount === repeatCount
        ) {
          return currentMotion
        }

        return { shouldLoop, duration, repeatCount }
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
        '--delay': `${rowIndex * 0.35}s`,
      }}
    >
      <div className={`marquee-track${motion.shouldLoop ? ' marquee-track-seamless' : ' marquee-track-pass'}`}>
        <span className="marquee-copy" ref={copyRef}>
          {Array.from({ length: motion.repeatCount }, (_, patternIndex) => (
            <span className="marquee-pattern" key={patternIndex}>
              {messages.map((message, messageIndex) => (
                <span className="marquee-phrase" key={`${patternIndex}-${messageIndex}`}>
                  {message}
                  <span className="marquee-separator"> ✦ </span>
                </span>
              ))}
            </span>
          ))}
        </span>
        {motion.shouldLoop && (
          <span className="marquee-copy marquee-copy-clone" aria-hidden="true">
            {Array.from({ length: motion.repeatCount }, (_, patternIndex) => (
              <span className="marquee-pattern" key={patternIndex}>
                {messages.map((message, messageIndex) => (
                  <span className="marquee-phrase" key={`${patternIndex}-${messageIndex}`}>
                    {message}
                    <span className="marquee-separator"> ✦ </span>
                  </span>
                ))}
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
    if (messages.length < ROW_COUNT) {
      distributedMessages.forEach((laneMessages, rowIndex) => {
        const offset = rowIndex % messages.length
        laneMessages.push(...messages.slice(offset), ...messages.slice(0, offset))
      })
    } else {
      messages.forEach((message, messageIndex) => {
        distributedMessages[messageIndex % ROW_COUNT].push(message)
      })
    }
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
