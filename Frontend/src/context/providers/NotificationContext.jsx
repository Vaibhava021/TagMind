import { createContext, useContext, useState } from 'react'

const NotificationContext = createContext()

export const NotificationProvider = ({ children }) => {

    const [notification, setNotification] = useState(null)

    const showNotification = ({
        message,
        type = 'info',
        duration = 3000,
        position = 'bottomRight',
        style = {}
        }) => {
        setNotification({message, type, position, style})
        setTimeout(() => {setNotification(null)}, duration)}

    return (
        <NotificationContext.Provider
            value={{notification,showNotification}}>
            {children}
        </NotificationContext.Provider>
    )
}
export const useNotification = () =>
    useContext(NotificationContext)