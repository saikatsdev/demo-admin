import { createContext, useContext, useState } from 'react'

const MenuContext = createContext()

export const useMenu = () => {
  const context = useContext(MenuContext)
  if (!context) {
    throw new Error('useMenu must be used within MenuProvider')
  }
  return context
}

export const MenuProvider = ({ children }) => {
  const [activeMenuItems, setActiveMenuItems] = useState([])

  const setActiveMenu = (menuItems) => {
    setActiveMenuItems(menuItems)
  }

  const clearActiveMenu = () => {
    setActiveMenuItems([])
  }

  return (
    <MenuContext.Provider value={{ activeMenuItems, setActiveMenu, clearActiveMenu }}>
      {children}
    </MenuContext.Provider>
  )
}

