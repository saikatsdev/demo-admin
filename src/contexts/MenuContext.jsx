import { createContext, useState } from 'react'

const MenuContext = createContext()

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

