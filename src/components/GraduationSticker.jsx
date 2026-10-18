import { useEffect, useState } from 'react'

const BACKGROUND_DARKNESS_THRESHOLD = 24

function removeConnectedBlackBackground(image) {
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null

  context.drawImage(image, 0, 0)
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData
  const pixelCount = canvas.width * canvas.height
  const queue = new Uint32Array(pixelCount)
  let queueEnd = 0
  let queueStart = 0

  function enqueueIfBackground(pixelIndex) {
    const offset = pixelIndex * 4
    if (
      data[offset + 3] !== 0 &&
      data[offset] <= BACKGROUND_DARKNESS_THRESHOLD &&
      data[offset + 1] <= BACKGROUND_DARKNESS_THRESHOLD &&
      data[offset + 2] <= BACKGROUND_DARKNESS_THRESHOLD
    ) {
      data[offset + 3] = 0
      queue[queueEnd] = pixelIndex
      queueEnd += 1
    }
  }

  for (let x = 0; x < canvas.width; x += 1) {
    enqueueIfBackground(x)
    enqueueIfBackground((canvas.height - 1) * canvas.width + x)
  }
  for (let y = 1; y < canvas.height - 1; y += 1) {
    enqueueIfBackground(y * canvas.width)
    enqueueIfBackground(y * canvas.width + canvas.width - 1)
  }

  while (queueStart < queueEnd) {
    const pixelIndex = queue[queueStart]
    queueStart += 1
    const x = pixelIndex % canvas.width
    const y = Math.floor(pixelIndex / canvas.width)

    if (x > 0) enqueueIfBackground(pixelIndex - 1)
    if (x < canvas.width - 1) enqueueIfBackground(pixelIndex + 1)
    if (y > 0) enqueueIfBackground(pixelIndex - canvas.width)
    if (y < canvas.height - 1) enqueueIfBackground(pixelIndex + canvas.width)
  }

  context.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

function GraduationSticker({ src }) {
  const [displaySource, setDisplaySource] = useState(null)

  useEffect(() => {
    let isCurrent = true
    const image = new Image()

    image.onload = () => {
      try {
        const transparentSource = removeConnectedBlackBackground(image)
        if (isCurrent) setDisplaySource(transparentSource || src)
      } catch {
        if (isCurrent) setDisplaySource(src)
      }
    }
    image.onerror = () => {
      if (isCurrent) setDisplaySource(src)
    }
    image.src = src

    return () => {
      isCurrent = false
    }
  }, [src])

  return (
    <img
      className="graduate-image"
      src={displaySource || src}
      alt="Lâm Thế Vinh trong lễ phục tốt nghiệp"
      style={{ visibility: displaySource ? 'visible' : 'hidden' }}
    />
  )
}

export default GraduationSticker
