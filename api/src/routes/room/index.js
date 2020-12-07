import express from 'express'

import {
  createNewRoom,
  joinRoom,
  sendRoomInformation,
  leaveActiveRoom,
  distributeMessage,
  updateQueue,
  clearQueue,
  updateTrackState,
  updateAvailableRooms,
  setCurrentTrack,
  sendFullRoomInformation,
} from './handlers.js'

export default function roomRouter(io) {
  const router = express.Router()

  io.on('connection', (socket) => {
    console.log('New client connected')

    socket.on('create', (data) => {
      createNewRoom(socket, data.message).then(() => {
        sendFullRoomInformation(io, socket, data.message.roomId, true)
      })
    })

    socket.on('join', (data) => {
      joinRoom(io, socket, data.message.roomId).then(() => {
        sendFullRoomInformation(io, socket, data.message.roomId, true)
      })
      sendRoomInformation(socket, data.message.roomId)
    })

    socket.on('leave', () => {
      leaveActiveRoom(io, socket).then((roomId) => {
        console.log(roomId)
        sendFullRoomInformation(io, socket, roomId, true)
      })
    })

    socket.on('new-message', (data) => {
      distributeMessage(io, socket, data.message)
    })

    socket.on('add-to-queue', (data) => {
      updateQueue(io, socket, data.message)
    })

    socket.on('clear-queue', (data) => {
      clearQueue(io, socket, data.message)
    })

    socket.on('toggle-play', (data) => {
      updateTrackState(io, socket, data.message)
    })

    socket.on('get-available-rooms', () => {
      updateAvailableRooms(io, socket, false)
    })

    socket.on('current-track', (data) => {
      setCurrentTrack(io, socket, data.message.msg)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected')
    })
  })

  return router
}
