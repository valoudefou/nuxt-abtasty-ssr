interface NotificationInput {
  title: string
  message: string
  type?: 'success' | 'cart'
  timeout?: number
}

interface InternalNotification extends NotificationInput {
  id: number
  type: 'success' | 'cart'
}

export const useNotifications = () => {
  const notifications = useState<InternalNotification[]>('notifications', () => [])

  const show = (payload: NotificationInput) => {
    const notification: InternalNotification = {
      id: Date.now(),
      type: payload.type ?? 'success',
      timeout: payload.timeout ?? 3500,
      ...payload
    }

    notifications.value.push(notification)

    if (notification.timeout) {
      setTimeout(() => dismiss(notification.id), notification.timeout)
    }
  }

  const dismiss = (id: number) => {
    notifications.value = notifications.value.filter((item) => item.id !== id)
  }

  return { notifications, show, dismiss }
}
