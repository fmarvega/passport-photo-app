import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { TestCrop } from './TestCrop.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TestCrop />
  </StrictMode>,
)
