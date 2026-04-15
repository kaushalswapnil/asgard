import { createContext, useContext, useState } from 'react'

const ChatbotContext = createContext()

export function ChatbotProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [role, setRole]     = useState(null)   // 'manager' | 'admin' | null (within chatbot)
  return (
    <ChatbotContext.Provider value={{ isOpen, setIsOpen, role, setRole }}>
      {children}
    </ChatbotContext.Provider>
  )
}

export const useChatbot = () => useContext(ChatbotContext)
