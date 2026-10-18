const SAMPLE_WISHES = [
  'CHÚC MỪNG TỐT NGHIỆP!',
  'CONGRATULATIONS!',
  'CHÚC VINH THÀNH CÔNG!',
  'A NEW CHAPTER BEGINS!',
  'CHÚC BẠN LUÔN THÀNH CÔNG!',
]

const ROW_COUNT = 8
const MAX_MARQUEE_MESSAGE_LENGTH = 88

function shortenWish(name, message) {
  const text = `${name}: ${message}`
  return text.length > MAX_MARQUEE_MESSAGE_LENGTH
    ? `${text.slice(0, MAX_MARQUEE_MESSAGE_LENGTH - 1).trimEnd()}…`
    : text
}

function PixelMarquee({ wishes }) {
  const messages = wishes.length > 0
    ? wishes.map(({ name, message }) => shortenWish(name, message))
    : SAMPLE_WISHES

  return (
    <div className="marquee-layer" aria-hidden="true">
      {Array.from({ length: ROW_COUNT }, (_, rowIndex) => {
        const orderedMessages = messages.map(
          (_, messageIndex) => messages[(messageIndex + rowIndex) % messages.length],
        )
        const isReverse = rowIndex % 2 === 1

        return (
          <div
            className={`marquee-row${isReverse ? ' marquee-row-reverse' : ''}`}
            key={rowIndex}
            style={{
              top: `${((rowIndex + 0.5) / ROW_COUNT) * 100}%`,
              '--duration': `${34 + (rowIndex % 4) * 8}s`,
            }}
          >
            <div className="marquee-track">
              {[0, 1].map((copy) => (
                <span className="marquee-copy" key={copy}>
                  {orderedMessages.map((message, messageIndex) => (
                    <span className="marquee-phrase" key={`${copy}-${messageIndex}`}>
                      {message}
                      <span className="marquee-separator"> ✦ </span>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default PixelMarquee
