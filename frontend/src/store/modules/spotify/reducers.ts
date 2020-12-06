import { PayloadAction } from '@reduxjs/toolkit'
import { CurrentTrackResponse, Room } from '../../../util/types/rooms'
import {
  SpotifyPlaylist,
  SpotifyUser,
  WebPlaybackTrack,
  SpotifyPlayerStatus,
} from '../../../util/types/spotify'
import initialState, { initialCurrentRoom, SpotifyState } from './state'

export default {
  setUserToken(state: SpotifyState, action: PayloadAction<string>) {
    return { ...state, token: action.payload }
  },
  clearSpotifyState() {
    return { ...initialState }
  },
  setActivePlaylist(state: SpotifyState, action: PayloadAction<SpotifyPlaylist>) {
    return { ...state, activePlaylist: action.payload }
  },
  setQueue(state: SpotifyState, action: PayloadAction<WebPlaybackTrack[]>) {
    return { ...state, queue: action.payload }
  },
  setUser(state: SpotifyState, action: PayloadAction<SpotifyUser>) {
    return { ...state, user: action.payload }
  },
  setCurrentTrack(state: SpotifyState, action: PayloadAction<CurrentTrackResponse>) {
    return { ...state, currentTrack: action.payload }
  },
  setPlaybackInfo(state: SpotifyState, action: PayloadAction<SpotifyPlayerStatus>) {
    return { ...state, playbackInfo: action.payload }
  },
  setCurrentRoom(state: SpotifyState, action: PayloadAction<Room>) {
    return { ...state, room: action.payload }
  },
  clearCurrentRoom(state: SpotifyState) {
    return { ...state, room: initialCurrentRoom }
  },
}
