"use client"

import { useEffect, useState, useRef } from 'react'

const images = [
  '/images/carrusel/carrusel-1.jpg',
  '/images/carrusel/carrusel-2.jpg',
  '/images/carrusel/carrusel-3.jpg',
  '/images/carrusel/carrusel-4.png',
  '/images/carrusel/carrusel-5.jpg',
  '/images/carrusel/carrusel-6.jpg',
]

export default function Carousel({ className = '' }: { className?: string }) {
  const [index, setIndex] = useState(0)
  const [prevIndex, setPrevIndex] = useState<number | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    start()
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  function start() {
    stop()
    timer.current = window.setTimeout(() => {
      setPrevIndex(index)
      setIndex((i) => (i + 1) % images.length)
    }, 4000)
  }

  function stop() {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }

  return (
    <div className={`w-full flex justify-center ${className}`}>
      <div className="w-full max-w-4xl flex flex-col items-center">
        <div className="relative w-full overflow-hidden rounded-lg">
          <div className="relative h-48 w-full">
          {images.map((src, i) => {
            const isCurrent = i === index
            const isPrev = i === prevIndex
            const posClass = isCurrent ? 'translate-x-0' : isPrev ? '-translate-x-full' : 'translate-x-full'
            const opacityClass = isCurrent ? 'opacity-100' : 'opacity-0'

            return (
              <img
                key={src}
                src={src}
                alt={`slide-${i}`}
                className={`pointer-events-none absolute left-0 top-0 h-full w-full object-cover ${posClass} ${opacityClass} transition-all duration-700 ease-in-out`}
              />
            )
          })}
          </div>
        </div>

        {/* indicators below the carousel */}
        <div className="w-full py-3">
          <div className="flex justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              aria-label={`Ir a la diapositiva ${i + 1}`}
              onClick={() => {
                setPrevIndex(index)
                setIndex(i)
              }}
              className={`h-2 w-8 rounded-full ${i === index ? 'bg-gray-800' : 'bg-gray-400'}`}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
  )
}
