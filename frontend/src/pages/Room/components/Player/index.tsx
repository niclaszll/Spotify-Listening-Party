/* eslint-disable max-len */
import React, { useEffect, useState } from 'react'
import { getData } from '../../../../util/auth'
import { SpotifyAuthInfo } from '../../../../util/getHash'
import {
  getPlaylists, getPlaylistTracks, loadScript, play,
} from '../../../../util/spotify'
import {
  PagingObject, SpotifyPlayerCallback, SpotifyPlaylist, WebPlaybackPlayer, SpotifyPlaylistTrackObject,
} from '../../../../util/types/spotify'
import * as styles from './style.module.sass'

export default function WebPlayer() {
  const [token, setToken] = useState<string>('')
  const [isInitializing, setIsInitializing] = useState<Boolean>(false)
  const [deviceId, setDeviceId] = useState<string>('')
  const [userPlaylists, setUserPlaylists] = useState<PagingObject>()
  const [activePlaylist, setActivePlaylist] = useState<SpotifyPlaylist>()
  const [activePlaylistTracks, setActivePlaylistTracks] = useState<PagingObject>()

  let player: WebPlaybackPlayer

  const initializePlayer = () => {
    setIsInitializing(true)

    const authInfo = getData('spotifyAuthInfo') as SpotifyAuthInfo
    // @ts-ignore
    player = new window.Spotify.Player({
      getOAuthToken: (cb: SpotifyPlayerCallback) => {
        cb(authInfo.access_token)
      },
      name: 'Spotify Web Player SCC',
    }) as WebPlaybackPlayer

    // Error handling
    player.addListener('initialization_error', ({ message }) => { console.error(message) })
    player.addListener('authentication_error', ({ message }) => { console.error(message) })
    player.addListener('account_error', ({ message }) => { console.error(message) })
    player.addListener('playback_error', ({ message }) => { console.error(message) })

    // Playback status updates
    player.addListener('player_state_changed', (state) => { console.log(state) })

    // Ready
    player.addListener('ready', ({ device_id }) => {
      setDeviceId(device_id)
      console.log('Ready with Device ID', device_id)
    })

    // Not Ready
    player.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id)
    })

    // Connect to the player!
    player.connect()
  }

  useEffect(() => {
    const authInfo = getData('spotifyAuthInfo') as SpotifyAuthInfo
    setToken(authInfo.access_token)
    // @ts-ignore
    window.onSpotifyWebPlaybackSDKReady = initializePlayer
    async function loadSpotify() {
      await loadScript({
        defer: true,
        id: 'spotify-player',
        source: 'https://sdk.scdn.co/spotify-player.js',
      })
    }
    loadSpotify()
    getPlaylists(authInfo.access_token).then((res) => setUserPlaylists(res))
  }, [])

  const playSong = async (uri: string) => {
    await play(token, { context_uri: uri, deviceId })
  }

  const handleSelectPlaylist = async (playlist: SpotifyPlaylist) => {
    setActivePlaylist(playlist)
    // fetch all tracks of selected playlist
    const tracks = await getPlaylistTracks(token, playlist.id)
    setActivePlaylistTracks(tracks)
  }

  return (
    <div className={styles.container}>
      {userPlaylists ? console.log(userPlaylists) : null}
      <div className={styles.playlists}>
        {userPlaylists && (
          (userPlaylists.items as SpotifyPlaylist[]).map((playlist: SpotifyPlaylist) => (
            <button type="button" onClick={() => handleSelectPlaylist(playlist)} title={playlist.name}>
              <div className={styles.imgContainer}>
                <img src={playlist.images[0].url} alt={playlist.name} />
              </div>
            </button>
          ))
        )}
      </div>
      <div>
        {activePlaylistTracks && (
          // eslint-disable-next-line max-len
          (activePlaylistTracks.items as SpotifyPlaylistTrackObject[]).map((trackObject: SpotifyPlaylistTrackObject) => <span>{trackObject.track.name}</span>)
        )}
      </div>
    </div>
  )
}