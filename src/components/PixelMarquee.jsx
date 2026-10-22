import { useEffect, useState } from 'react'

const SAMPLE_WISHES = [
  'CHÚC MỪNG TỐT NGHIỆP!',
  'CONGRATULATIONS!',
  'CHÚC VINH THÀNH CÔNG!',
  'A NEW CHAPTER BEGINS!',
  'CHÚC BẠN LUÔN THÀNH CÔNG!',
]

const ROW_COUNT = 8
const MAX_MARQUEE_MESSAGE_LENGTH = 88
const PAGE_DURATION_MS = 34_000
const PAGE_DURATION_SECONDS = PAGE_DURATION_MS / 1000

function shortenWish(name, message) {
  const text = `${name}: ${message}`
  return text.length > MAX_MARQUEE_MESSAGE_LENGTH
    ? `${text.slice(0, MAX_MARQUEE_MESSAGE_LENGTH - 1).trimEnd()}…`
    : text
}

function PixelMarquee({ wishes }) {
  const messages = wishes.length > 0
    ? [...new Set(wishes.map(({ name, message }) => shortenWish(name, message)))]
    : SAMPLE_WISHES
  const pageCount = Math.max(1, Math.ceil(messages.length / ROW_COUNT))
  const [pageIndex, setPageIndex] = useState(0)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (pageCount < 2 || prefersReducedMotion) return undefined

    const timer = window.setInterval(() => {
      setPageIndex((currentPage) => (currentPage + 1) % pageCount)
    }, PAGE_DURATION_MS)

    return () => window.clearInterval(timer)
  }, [pageCount, prefersReducedMotion])

  const activePageIndex = pageIndex % pageCount
  const pageMessages = messages.slice(activePageIndex * ROW_COUNT, (activePageIndex + 1) * ROW_COUNT)

  return (
    <div className="marquee-layer" aria-hidden="true">
      {pageMessages.map((message, rowIndex) => {
        const isReverse = rowIndex % 2 === 1

        return (
          <div
            className={`marquee-row${isReverse ? ' marquee-row-reverse' : ''}`}
            key={message}
            style={{
              top: `${((rowIndex + 0.5) / ROW_COUNT) * 100}%`,
              '--duration': `${PAGE_DURATION_SECONDS}s`,
            }}
          >
            <div className="marquee-track">
              <span className="marquee-copy">
                <span className="marquee-phrase">
                  {message}
                  <span className="marquee-separator"> ✦ </span>
                </span>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default PixelMarquee
