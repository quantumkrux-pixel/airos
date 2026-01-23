import React, { useEffect, useState, useMemo } from 'react';
import { searchProfiles, getProfile } from '../../../api/chat/profileApi';
import {
  fetchFriends,
  getOrCreateDmChannel,
  sendFriendRequest,
  acceptFriendRequest
} from '../../../api/chat/friendsApi';
import {
  fetchChannelMessages,
  sendMessage,
  subscribeToChannelMessages
} from '../../../api/chat/chatApi';

const AirChat = ({ currentUser }) => {
  const [friends, setFriends] = useState([]);
  const [friendProfiles, setFriendProfiles] = useState({});
  const [activeChannel, setActiveChannel] = useState(null); // { type: 'dm', id, peerId }
  const [activePeerProfile, setActivePeerProfile] = useState(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [friendSearch, setFriendSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sendingRequest, setSendingRequest] = useState(false);

  const friendSearchDisabled = !friendSearch.trim() || !currentUser;

  // Sort friends by accepted → pending
  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => {
      if (a.status === 'accepted' && b.status !== 'accepted') return -1;
      if (a.status !== 'accepted' && b.status === 'accepted') return 1;
      return (a.created_at || '').localeCompare(b.created_at || '');
    });
  }, [friends]);

  // Stable list of peer IDs for profile fetching
  const peerIds = useMemo(() => {
    if (!currentUser) return [];
    return friends.map(f =>
      f.requester_id === currentUser.id ? f.addressee_id : f.requester_id
    );
  }, [friends, currentUser]);

  // Load friends for current user
  useEffect(() => {
    if (!currentUser) return;

    setLoadingFriends(true);
    fetchFriends(currentUser.id)
      .then(setFriends)
      .catch(console.error)
      .finally(() => setLoadingFriends(false));
  }, [currentUser]);

  // Load profiles for all friend peerIds
  useEffect(() => {
    async function loadProfiles() {
      const map = {};

      for (const id of peerIds) {
        if (!id) continue;
        const profile = await getProfile(id);
        map[id] = profile;
      }

      setFriendProfiles(map);
    }

    if (peerIds.length > 0) {
      loadProfiles();
    } else {
      setFriendProfiles({});
    }
  }, [peerIds]);

  // Load messages for active channel + subscribe to new ones
  useEffect(() => {
    if (!activeChannel) return;

    setLoadingMessages(true);
    setMessages([]);

    let unsubscribe = () => {};

    (async () => {
      try {
        const initial = await fetchChannelMessages(
          activeChannel.type,
          activeChannel.id,
          200
        );
        setMessages(initial);

        unsubscribe = subscribeToChannelMessages(
          activeChannel.type,
          activeChannel.id,
          msg => setMessages(prev => [...prev, msg])
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingMessages(false);
      }
    })();

    return () => unsubscribe();
  }, [activeChannel]);

  // Open DM with friend
  const openDmWithFriend = async (friendRow) => {
    if (!currentUser) return;

    const peerId =
      friendRow.requester_id === currentUser.id
        ? friendRow.addressee_id
        : friendRow.requester_id;

    try {
      const channel = await getOrCreateDmChannel(currentUser.id, peerId);
      setActiveChannel({ type: 'dm', id: channel.id, peerId });

      const profile = friendProfiles[peerId] || await getProfile(peerId);
      setActivePeerProfile(profile);
    } catch (e) {
      console.error(e);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!currentUser || !activeChannel || !input.trim()) return;

    const content = input.trim();
    setInput('');

    try {
      await sendMessage({
        senderId: currentUser.id,
        channelType: activeChannel.type,
        channelId: activeChannel.id,
        content
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Search profiles by username
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!friendSearch.trim()) return;

    try {
      const results = await searchProfiles(friendSearch.trim());
      setSearchResults(results);
    } catch (e) {
      console.error(e);
    }
  };

  // Accept friend request
  const handleAcceptRequest = async (friendRowId) => {
    if (!currentUser) return;

    try {
      await acceptFriendRequest(friendRowId, currentUser.id);
      const updated = await fetchFriends(currentUser.id);
      setFriends(updated);
    } catch (e) {
      console.error(e);
    }
  };

  // Add friend from search result
  const handleAddFriend = async (profileId) => {
    if (!currentUser) return;

    setSendingRequest(true);
    try {
      await sendFriendRequest(currentUser.id, profileId);
      const updated = await fetchFriends(currentUser.id);
      setFriends(updated);
      setSearchResults([]);
      setFriendSearch('');
    } catch (e) {
      console.error(e);
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        background: '#303047a8',
        color: '#e5e7eb',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '18px'
      }}
    >
      {/* SIDEBAR */}
      <div
        style={{
          width: 220,
          borderRight: '2px double #1f2933',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '6px 8px',
            borderBottom: '1px solid #1f2933',
            fontWeight: 600,
            fontSize: '14px'
          }}
        >
          Friends & DMs
        </div>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          style={{
            padding: '8px 12px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              marginBottom: 4,
              opacity: 0.7
            }}
          >
            Search by username
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={friendSearch}
              onChange={e => setFriendSearch(e.target.value)}
              placeholder="Search username..."
              style={{
                flex: 1,
                background: '#020617',
                borderRadius: 4,
                border: '1px solid #1f2933',
                padding: '4px 6px',
                color: '#e5e7eb',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={friendSearchDisabled}
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                border: 'none',
                background: friendSearchDisabled ? '#1f2937' : '#2563eb',
                color: '#e5e7eb',
                fontSize: '12px',
                cursor: friendSearchDisabled ? 'default' : 'pointer'
              }}
            >
              Go
            </button>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {searchResults.map(profile => (
                <div
                  key={profile.id}
                  style={{
                    padding: '6px 8px',
                    background: '#0a0a12',
                    borderRadius: 4,
                    marginBottom: 4
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    {profile.display_name || profile.username}
                  </div>
                  <div
                    style={{
                      opacity: 0.6,
                      fontSize: '12px'
                    }}
                  >
                    @{profile.username}
                  </div>
                  <button
                    onClick={() => handleAddFriend(profile.id)}
                    disabled={sendingRequest}
                    style={{
                      marginTop: 4,
                      padding: '3px 6px',
                      borderRadius: 3,
                      border: 'none',
                      background: '#2563eb',
                      color: '#fff',
                      fontSize: '11px',
                      cursor: sendingRequest ? 'default' : 'pointer',
                      opacity: sendingRequest ? 0.7 : 1
                    }}
                  >
                    {sendingRequest ? 'Sending…' : 'Add Friend'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Friends list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '6px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          {loadingFriends && (
            <div
              style={{
                fontSize: '11px',
                opacity: 0.6,
                padding: '4px 2px'
              }}
            >
              Loading friends…
            </div>
          )}

          {!loadingFriends && sortedFriends.length === 0 && (
            <div
              style={{
                fontSize: '11px',
                opacity: 0.6,
                padding: '4px 2px'
              }}
            >
              No friends yet. Search and add one above to start a DM.
            </div>
          )}

          {sortedFriends.map(f => {
            const peerId =
              f.requester_id === currentUser.id
                ? f.addressee_id
                : f.requester_id;

            const profile = friendProfiles[peerId];

            const isAccepted = f.status === 'accepted';
            const isIncoming =
              f.status === 'pending' && f.addressee_id === currentUser.id;

            return (
              <div
                key={f.id}
                style={{
                  padding: '6px 8px',
                  borderRadius: 4,
                  background: '#020617',
                  border: '1px solid #111827',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontSize: '12px' }}>
                    {profile
                      ? profile.display_name || profile.username
                      : 'Loading…'}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      opacity: 0.7
                    }}
                  >
                    {f.status}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 4,
                    marginTop: 4
                  }}
                >
                  {isAccepted && (
                    <button
                      onClick={() => openDmWithFriend(f)}
                      style={{
                        flex: 1,
                        padding: '3px 6px',
                        borderRadius: 3,
                        border: 'none',
                        background: '#111827',
                        color: '#e5e7eb',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Open DM
                    </button>
                  )}

                  {isIncoming && (
                    <button
                      onClick={() => handleAcceptRequest(f.id)}
                      style={{
                        flex: 1,
                        padding: '3px 6px',
                        borderRadius: 3,
                        border: 'none',
                        background: '#16a34a',
                        color: '#e5e7eb',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Accept
                    </button>
                  )}

                  {!isAccepted && !isIncoming && (
                    <span
                      style={{
                        fontSize: '11px',
                        opacity: 0.6
                      }}
                    >
                      Waiting…
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div
        style={{
          flex: 1,
          display: 'fill',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '10px 12px',
            borderBottom: '1px solid #1f2933',
            fontSize: '13px'
          }}
        >
          {activePeerProfile
            ? `${activePeerProfile.display_name || activePeerProfile.username} (@${activePeerProfile.username})`
            : 'Select a friend to start chatting'}
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            padding: '8px 12px',
            overflowY: 'auto'
          }}
        >
          {loadingMessages && activeChannel && (
            <div
              style={{
                fontSize: '12px',
                opacity: 0.6,
                marginBottom: 8
              }}
            >
              Loading messages…
            </div>
          )}

          {!activeChannel && (
            <div
              style={{
                fontSize: '12px',
                opacity: 0.6
              }}
            >
              Open a friend from the left to begin chatting.
            </div>
          )}

          {messages.map(m => {
            const isMine = m.sender_id === currentUser.id;
            const senderProfile =
              isMine
                ? currentUser
                : friendProfiles[m.sender_id] || activePeerProfile;

            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: isMine ? 'flex-end' : 'flex-start',
                  marginBottom: 4
                }}
              >
                <div
                  style={{
                    maxWidth: '60%',
                    padding: '6px 8px',
                    borderRadius: 6,
                    background: isMine ? '#1d4ed8' : '#111827',
                    color: '#e5e7eb',
                    fontSize: '12px'
                  }}
                >
                  <div
                    style={{
                      fontSize: '10px',
                      opacity: 0.7,
                      marginBottom: 2
                    }}
                  >
                    {isMine
                      ? 'You'
                      : senderProfile
                        ? senderProfile.display_name ||
                          senderProfile.username ||
                          m.sender_id.slice(0, 8)
                        : m.sender_id.slice(0, 8)}
                  </div>
                  {m.content}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        {activeChannel && (
          <div
            style={{
              borderTop: '1px solid #1f2933',
              padding: '8px 12px',
              display: 'flex',
              gap: 8
            }}
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              style={{
                flex: 1,
                background: '#020617',
                borderRadius: 4,
                border: '1px solid #1f2933',
                padding: '6px 8px',
                color: '#e5e7eb',
                fontSize: '13px'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim()}
              style={{
                padding: '6px 12px',
                borderRadius: 4,
                border: 'none',
                background: input.trim() ? '#2563eb' : '#1f2937',
                color: '#e5e7eb',
                fontSize: '13px',
                cursor: input.trim() ? 'pointer' : 'default'
              }}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AirChat;