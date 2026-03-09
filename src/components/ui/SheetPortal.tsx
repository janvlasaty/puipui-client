import { createContext, useContext, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const SheetPortalContext = createContext<HTMLElement | null>(null)

export const SheetProvider = ({ children }: { children: ReactNode }) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  return (
    <SheetPortalContext.Provider value={container}>
      {children}
      <div ref={setContainer} />
    </SheetPortalContext.Provider>
  )
}

export const SheetPortal = ({ children }: { children: ReactNode }) => {
  const container = useContext(SheetPortalContext)
  return createPortal(children, container ?? document.body)
}
