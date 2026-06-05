'use client'

import Snowfall from 'react-snowfall'

export default function SnowfallEffect() {
  return (
    <Snowfall
      style={{
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
      snowflakeCount={200}
    />
  )
}


