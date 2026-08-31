type Args = {
  onClick: () => void
  onDismiss: () => void
  release: () => void
}

export const createNotificationLifecycleHandlers = ({ onClick, onDismiss, release }: Args) => {
  let clicked = false

  return {
    onClick: () => {
      clicked = true
      onClick()
      release()
    },
    onClose: () => {
      if (!clicked) onDismiss()
      release()
    },
  }
}
