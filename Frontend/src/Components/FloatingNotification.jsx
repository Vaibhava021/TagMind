import { useNotification } from '../context/providers/NotificationContext'
const notificationPositions = {
    dashboard: {

    },
    topCenter: {
        top: "80px",
        left: "50%",
        transform: "translateX(-50%)"
    },

    bottomRight: {
        bottom: "20px",
        right: "20px"
    },

    bottomCenter: {
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)"
    }
}
const FloatingNotification = () => {

    const { notification } = useNotification()

    if (!notification)
        return null

    return (
        <div
            className="fixed z-9999 px-2 py-1 rounded-lg shadow-lg text-white pointer-events-none transition-all ease-in-out duration-100"
            style={{
                ...notificationPositions[notification.position ||  'bottomRight'], ...notification.style,
                backgroundColor:
                notification.style?.backgroundColor ??
                (
                    notification.type === 'success'
                    ? '#16a34a'
                    : notification.type === 'error'
                    ? '#dc2626'
                    : '#3b82f6'
                )
            }}>
            {notification.message}
        </div>
    )
}

export default FloatingNotification