import { useState, useEffect } from 'react'
import './App.css'
import { useFaceDetection } from './hooks/useFaceDetection'

function App() {
  const [count, setCount] = useState(0)
  const { modelsLoaded } = useFaceDetection()

  useEffect(() => {
    console.log('modelsLoaded:', modelsLoaded)
  }, [modelsLoaded])

  return (
    <>
      <div style={{ padding: '2rem' }}>
        <h1>Passport Photo Generator - Phase 3 Test</h1>
        <p>Models loaded: {modelsLoaded ? 'YES' : 'NO'}</p>
        <button onClick={() => setCount(c => c + 1)}>Count is {count}</button>
      </div>
    </>
  )
}

export default App
