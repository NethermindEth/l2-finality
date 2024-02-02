import React, { useState, useEffect, useRef } from 'react'
import { useSpring, animated } from 'react-spring'

const AutoIncrementComponent: React.FC = () => {
  const [targetCount, setTargetCount] = useState(0)
  const prevCountRef = useRef(0)

  useEffect(() => {
    const intervalId = setInterval(() => {
      const newCount = prevCountRef.current + Math.random() * 100
      setTargetCount(newCount)
    }, 5000)

    return () => clearInterval(intervalId)
  }, [])

  const { number } = useSpring({
    reset: true,
    from: { number: prevCountRef.current },
    number: targetCount,
    config: { duration: 4500 },
    onRest: () => {
      prevCountRef.current = targetCount
    },
  })

  return <animated.h3>{number.to((n) => `Count: ${n.toFixed(0)}`)}</animated.h3>
}

export default AutoIncrementComponent
