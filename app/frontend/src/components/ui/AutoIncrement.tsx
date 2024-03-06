import React, { useState, useEffect, useRef } from 'react'
import { useSpring, animated } from 'react-spring'
import { FETCH_LIVE_DATA_INTERVAL_MS } from '@/pages'

interface AutoIncrementComponentProps {
  initialValue: number
  newValue: number
}

const AutoIncrementComponent: React.FC<AutoIncrementComponentProps> = ({
  initialValue,
  newValue,
}) => {
  const [currentCount, setCurrentCount] = useState(initialValue)
  const [isFirstRender, setIsFirstRender] = useState(true)
  const prevCountRef = useRef(initialValue)

  useEffect(() => {
    setCurrentCount(newValue)
  }, [newValue])

  const { number } = useSpring({
    reset: true,
    from: { number: isFirstRender ? initialValue : prevCountRef.current },
    number: currentCount,
    config: { duration: FETCH_LIVE_DATA_INTERVAL_MS - 1000 },
    onStart: () => {
      if (isFirstRender) {
        setIsFirstRender(false)
      }
    },
    onRest: () => {
      prevCountRef.current = currentCount
    },
  })

  return <animated.h3>{number.to((n) => `Count: ${n.toFixed(0)}`)}</animated.h3>
}

export default AutoIncrementComponent
