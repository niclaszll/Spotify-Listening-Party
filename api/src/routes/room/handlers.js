import {id} from '../../util/common.js'
import shuffle from '../../util/shuffle.js'
import {getAllRooms, createRoom, findRoomById, updateRoom} from '../../persistence/queries.js'

export function handleError(socket, error) {
  console.log(error)
  socket.emit('server-error', {
    source: 'server',
    message: {payload: error.message},
  })
}

export async function sendFullRoomInformation(io, socket, roomId, distributeToRoom) {
  return findRoomById(roomId).then((room) => {
    if (distributeToRoom) {
      io.sockets.in(roomId).emit('room/full_info', {
        source: 'server',
        message: {payload: room},
      })
    } else {
      socket.emit('room/full_info', {
        source: 'server',
        message: {payload: room},
      })
    }
  })
}

export async function checkIfRoomIsPrivate(socket, roomId) {
  return findRoomById(roomId).then((room) => {
    socket.emit('room/is_private', {
      source: 'server',
      message: {payload: room.roomPublic},
    })
  })
}

export async function checkIfPasswordCorrect(roomId, password) {
  return findRoomById(roomId, true).then((room) => {
    return room.roomPassword === password
  })
}

export function updateAvailableRooms(io, socket, distributeAll) {
  getAllRooms().then((rooms) => {
    if (distributeAll) {
      io.sockets.emit('room/set_all', {
        source: 'server',
        message: {payload: rooms},
      })
    } else {
      socket.emit('room/set_all', {
        source: 'server',
        message: {payload: rooms},
      })
    }
  })
}

export async function leaveActiveRoom(io, socket, username) {
  const roomId = Object.keys(socket.rooms).filter((item) => item !== socket.id)[0]
  if (roomId) {
    socket.leave(roomId)
    return findRoomById(roomId)
      .then((room) =>
        updateRoom(roomId, {activeListeners: room.activeListeners.filter((listener) => listener !== username)})
      )
      .then(() => updateAvailableRooms(io, socket, true))
      .then(() => roomId)
      .catch((err) => console.log(err))
  }
  return ''
}

export async function createNewRoom(socket, message) {
  const {name, roomPublic, activeListeners, roomPassword} = message
  const roomId = `room${id()}`
  const roomName = name !== '' ? name : roomId
  const creatorId = socket.id
  const newRoom = {id: roomId, name: roomName, roomPublic, roomPassword, activeListeners, creatorId}

  return createRoom(newRoom)
    .then(() => {
      socket.emit('room/create', {
        source: 'server',
        message: {payload: roomId},
      })
    })
    .catch((err) => console.log(err))
}

export async function joinRoom(io, socket, roomId, username, password = '') {
  const room = await findRoomById(roomId)

  // if room is private, check password
  if (!room.roomPublic) {
    const correct = await checkIfPasswordCorrect(roomId, password)
    if (!correct) {
      return Promise.reject(new Error('Wrong Password'))
    }
  }

  socket.join(roomId)
  const activeListeners = [...room.activeListeners, username]

  console.log(`Joined room ${room.name} with id ${roomId}`)

  return updateRoom(roomId, {activeListeners})
    .then(() => {
      updateAvailableRooms(io, socket, true)
      console.log(`Room ${room.name} has now ${activeListeners.length} listener(s)`)
    })
    .catch((err) => {
      handleError(socket, err)
    })
}

export function distributeMessage(io, socket, msg) {
  const room = Object.keys(socket.rooms).filter((item) => item !== socket.id)[0]
  io.sockets.in(room).emit('room/chat/new_message', {
    source: 'server',
    message: {payload: msg},
  })
}

export function skipForward(io, socket, roomId) {
  findRoomById(roomId).then((room) => {
    if (room.shuffled && room.shuffledQueue.length) {
      const nextTrack = {
        position_ms: 0,
        paused: false,
        uri: room.shuffledQueue[0].uri,
        timestamp: new Date(),
      }
      const item = room.shuffledQueue.shift()
      room.queue.splice(room.queue.indexOf(item), 1)
      room.history.push(room.currentTrack)
      updateRoom(roomId, {
        currentTrack: nextTrack,
        queue: room.queue,
        shuffledQueue: room.shuffledQueue,
        history: room.history,
      }).then(() => {
        sendFullRoomInformation(io, socket, roomId, true)
      })
    } else if (room.queue.length > 0) {
      const nextTrack = {
        position_ms: 0,
        paused: false,
        uri: room.queue[0].uri,
        timestamp: new Date(),
      }
      room.queue.shift()
      room.history.push(room.currentTrack)
      updateRoom(roomId, {currentTrack: nextTrack, queue: room.queue, history: room.history}).then(() => {
        sendFullRoomInformation(io, socket, roomId, true)
      })
    }
  })
}

export function skipBackward(io, socket, roomId) {
  findRoomById(roomId).then((room) => {
    const nextTrack = {
      position_ms: 0,
      paused: false,
      uri: room.history.pop().uri,
      timestamp: new Date(),
    }
    updateRoom(roomId, {currentTrack: nextTrack, history: room.history}).then(() => {
      sendFullRoomInformation(io, socket, roomId, true)
    })
  })
}

export function updateQueue(io, socket, msg) {
  findRoomById(msg.roomId).then((room) => {
    const newQueue = [...room.queue, msg.track]
    updateRoom(msg.roomId, {queue: newQueue}).then(() => {
      sendFullRoomInformation(io, socket, msg.roomId, true).then(() => {
        if (room.currentTrack === null && newQueue.length > 0) {
          skipForward(io, socket, msg.roomId)
        }
      })
    })
  })
}

export function clearQueue(io, socket, msg) {
  updateRoom(msg.roomId, {queue: []}).then(() => sendFullRoomInformation(io, socket, msg.roomId, true))
}

export function updateTrackState(io, socket, msg) {
  findRoomById(msg.roomId).then((room) => {
    updateRoom(msg.roomId, {currentTrack: {...room.currentTrack, paused: msg.paused}}).then(() => {
      sendFullRoomInformation(io, socket, msg.roomId, true)
    })
  })
}

export function toggleShuffle(io, socket, msg) {
  findRoomById(msg.roomId).then((room) => {
    let shuffledQueue = []
    if (msg.shuffled && room.queue.length) {
      shuffledQueue = shuffle(room.queue)
    }
    updateRoom(msg.roomId, {shuffled: msg.shuffled, shuffledQueue}).then(() => {
      sendFullRoomInformation(io, socket, msg.roomId, true)
    })
  })
}
