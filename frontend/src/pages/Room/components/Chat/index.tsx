import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectSpotifyState } from '../../../../store/modules/spotify'
import { Message } from '../../../../util/types/rooms'
import { ReactComponent as Send } from '../../../../img/icons/send.svg'
import { socket, Response, sendMessage } from '../../../../util/websocket'
import * as styles from './style.module.sass'

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState<string>()
  const { user } = useSelector(selectSpotifyState)

  useEffect(() => {
    socket.on('chat', (data: Response<Message>) => {
      setMessages((oldMessages) => [...oldMessages, data.message.payload])
    })
    return () => {
      socket.off('chat')
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = e
    setNewMsg(target.value)
  }

  const handleClick = () => {
    if (newMsg) {
      const msg_user = user !== null ? user.display_name : 'anonymous'
      sendMessage({ user: msg_user, msg: newMsg })
      setNewMsg('')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.chat}>
        {messages.map((message, index) => (
          <div key={index} className={`${message.user === user?.display_name ? styles.mine : styles.yours} ${styles.messages}`}>
            <div className={`${styles.message} ${messages.length - 1 === index && styles.last}`}>{message.msg}</div>
          </div>
        ))}
      </div>
      <div className={styles.controls}>
        <input value={newMsg} onChange={handleChange} />
        <button type="button" onClick={handleClick}><Send /></button>
      </div>
    </div>
  )
}