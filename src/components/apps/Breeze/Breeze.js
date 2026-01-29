import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Upload, File, Download, Image, FileText, X } from 'lucide-react';
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

const Breeze = ({ currentUser }) => {
  const [friends, setFriends] = useState([]);
  const [friendProfiles, setFriendProfiles] = useState({});
  const [activeChannel, setActiveChannel] = useState(null);
  const [activePeerProfile, setActivePeerProfile] = useState(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [friendSearch, setFriendSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sendingRequest, setSendingRequest] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const friendSearchDisabled = !friendSearch.trim() || !currentUser;

  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => {
      if (a.status === 'accepted' && b.status !== 'accepted') return -1;
      if (a.status !== 'accepted' && b.status === 'accepted') return 1;
      return (a.created_at || '').localeCompare(b.created_at || '');
    });
  }, [friends]);

  const peerIds = useMemo(() => {
    if (!currentUser) return [];
    return friends.map(f =>
      f.requester_id === currentUser.id ? f.addressee_id : f.requester_id
    );
  }, [friends, currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    setLoadingFriends(true);
    fetchFriends(currentUser.id)
      .then(setFriends)
      .catch(console.error)
      .finally(() => setLoadingFriends(false));
  }, [currentUser]);

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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!currentUser || !activeChannel) return;
    if (!input.trim() && !selectedFile) return;

    const content = input.trim();
    setInput('');

    try {
      if (selectedFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const fileData = {
            type: 'file',
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            fileSize: selectedFile.size,
            fileData: e.target.result,
            caption: content
          };

          await sendMessage({
            senderId: currentUser.id,
            channelType: activeChannel.type,
            channelId: activeChannel.id,
            content: JSON.stringify(fileData)
          });

          clearSelectedFile();
        };
        reader.readAsDataURL(selectedFile);
      } else {
        await sendMessage({
          senderId: currentUser.id,
          channelType: activeChannel.type,
          channelId: activeChannel.id,
          content
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!friendSearch.trim()) return;

    searchProfiles(friendSearch.trim())
      .then(setSearchResults)
      .catch(console.error);
  };

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

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const downloadFile = (fileName, fileData) => {
    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMessage = (m) => {
    const isMine = m.sender_id === currentUser.id;
    const senderProfile = isMine
      ? currentUser
      : friendProfiles[m.sender_id] || activePeerProfile;

    let messageContent;

    try {
      const parsed = JSON.parse(m.content);
      if (parsed.type === 'file') {
        const isImage = parsed.fileType?.startsWith('image/');

        messageContent = (
          <div>
            {parsed.caption && (
              <div style={{ marginBottom: 6 }}>{parsed.caption}</div>
            )}
            <div
              style={{
                background: '#0a0a12',
                opacity: 0.7,
                borderRadius: 4,
                padding: 8,
                border: '1px solid #1f2933'
              }}
            >
              {isImage ? (
                <div>
                  <img
                    src={parsed.fileData}
                    alt={parsed.fileName}
                    style={{
                      maxWidth: 300,
                      maxHeight: 300,
                      borderRadius: 4,
                      marginBottom: 6
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Image size={14} />
                    <span style={{ fontSize: 11 }}>{parsed.fileName}</span>
                    <button
                      onClick={() => downloadFile(parsed.fileName, parsed.fileData)}
                      style={{
                        marginLeft: 'auto',
                        padding: '2px 6px',
                        background: '#1f2937',
                        border: 'none',
                        borderRadius: 3,
                        color: '#e5e7eb',
                        fontSize: 10,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3
                      }}
                    >
                      <Download size={12} />
                      Download
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={24} style={{ opacity: 0.7 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>
                      {parsed.fileName}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.6 }}>
                      {formatFileSize(parsed.fileSize)}
                    </div>
                  </div>
                  <button
                    onClick={() => downloadFile(parsed.fileName, parsed.fileData)}
                    style={{
                      padding: '4px 8px',
                      background: '#1f2937',
                      border: 'none',
                      borderRadius: 3,
                      color: '#e5e7eb',
                      fontSize: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3
                    }}
                  >
                    <Download size={12} />
                    Download
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      } else {
        messageContent = m.content;
      }
    } catch {
      messageContent = m.content;
    }

    return (
      <div
        key={m.id}
        style={{
          display: 'flex',
          justifyContent: isMine ? 'flex-end' : 'flex-start',
          marginBottom: 8
        }}
      >
        <div
          style={{
            maxWidth: '60%',
            padding: '8px 10px',
            borderRadius: 8,
            background: isMine ? '#1d4ed8' : '#111827',
            color: '#e5e7eb',
            fontSize: '13px'
          }}
        >
          <div
            style={{
              fontSize: '10px',
              opacity: 0.7,
              marginBottom: 3
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
          {messageContent}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: '#0f172a',
        color: '#e5e7eb',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div
        style={{
          width: 280,
          borderRight: '2px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          background: '#1e293b'
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #334155',
            fontWeight: 600,
            fontSize: '16px',
            background: '#0f172a'
          }}
        >
          Friends & DMs
        </div>

        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #334155'
          }}
        >
          <div
            style={{
              fontSize: '12px',
              marginBottom: 6,
              opacity: 0.7,
              fontWeight: 500
            }}
          >
            Search by username
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={friendSearch}
              onChange={e => setFriendSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search username..."
              style={{
                flex: 1,
                background: '#0f172a',
                borderRadius: 6,
                border: '1px solid #334155',
                padding: '6px 10px',
                color: '#e5e7eb',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSearch}
              disabled={friendSearchDisabled}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                background: friendSearchDisabled ? '#334155' : '#2563eb',
                color: '#e5e7eb',
                fontSize: '13px',
                cursor: friendSearchDisabled ? 'default' : 'pointer',
                fontWeight: 500
              }}
            >
              Search
            </button>
          </div>

          {searchResults.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {searchResults.map(profile => (
                <div
                  key={profile.id}
                  style={{
                    padding: '10px',
                    background: '#0f172a',
                    borderRadius: 6,
                    marginBottom: 8,
                    border: '1px solid #334155'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>
                    {profile.display_name || profile.username}
                  </div>
                  <div
                    style={{
                      opacity: 0.6,
                      fontSize: '12px',
                      marginBottom: 6
                    }}
                  >
                    @{profile.username}
                  </div>
                  <button
                    onClick={() => handleAddFriend(profile.id)}
                    disabled={sendingRequest}
                    style={{
                      width: '100%',
                      padding: '6px',
                      borderRadius: 4,
                      border: 'none',
                      background: '#2563eb',
                      color: '#fff',
                      fontSize: '12px',
                      cursor: sendingRequest ? 'default' : 'pointer',
                      opacity: sendingRequest ? 0.7 : 1,
                      fontWeight: 500
                    }}
                  >
                    {sendingRequest ? 'Sending…' : 'Add Friend'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}
        >
          {loadingFriends && (
            <div style={{ fontSize: '12px', opacity: 0.6, padding: '8px' }}>
              Loading friends…
            </div>
          )}

          {!loadingFriends && sortedFriends.length === 0 && (
            <div style={{ fontSize: '12px', opacity: 0.6, padding: '8px' }}>
              No friends yet. Search and add one above to start chatting.
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
            const isOutgoing =
              f.status === 'pending' && f.requester_id === currentUser.id;

            return (
              <div
                key={f.id}
                style={{
                  padding: '10px',
                  borderRadius: 6,
                  background: '#0f172a',
                  border: '1px solid #334155',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>
                    {profile
                      ? profile.display_name || profile.username
                      : 'Loading…'}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: 3,
                      background: isAccepted ? '#166534' : isIncoming ? '#1e40af' : '#78350f',
                      fontWeight: 600
                    }}
                  >
                    {isAccepted ? 'Friend' : isIncoming ? 'Incoming' : 'Pending'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  {isAccepted && (
                    <button
                      onClick={() => openDmWithFriend(f)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: 4,
                        border: 'none',
                        background: '#2563eb',
                        color: '#e5e7eb',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 500
                      }}
                    >
                      Open Chat
                    </button>
                  )}

                  {isIncoming && (
                    <button
                      onClick={() => handleAcceptRequest(f.id)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: 4,
                        border: 'none',
                        background: '#16a34a',
                        color: '#e5e7eb',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 500
                      }}
                    >
                      Accept Request
                    </button>
                  )}

                  {isOutgoing && (
                    <span
                      style={{
                        flex: 1,
                        fontSize: '11px',
                        opacity: 0.7,
                        textAlign: 'center',
                        padding: '6px'
                      }}
                    >
                      Request sent, awaiting response
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#0f172a'
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #1e293b',
            fontSize: '15px',
            fontWeight: 600,
            background: '#1e293b'
          }}
        >
          {activePeerProfile
            ? `${activePeerProfile.display_name || activePeerProfile.username} (@${activePeerProfile.username})`
            : 'Select a friend to start chatting'}
        </div>

        <div
          style={{
            flex: 1,
            padding: '16px 20px',
            overflowY: 'auto'
          }}
        >
          {loadingMessages && activeChannel && (
            <div style={{ fontSize: '13px', opacity: 0.6, marginBottom: 12 }}>
              Loading messages…
            </div>
          )}

          {!activeChannel && (
            <div
              style={{
                fontSize: '13px',
                opacity: 0.6,
                textAlign: 'center',
                marginTop: 40
              }}
            >
              Select a friend from the sidebar to begin chatting
            </div>
          )}

          {messages.map(renderMessage)}
        </div>

        {activeChannel && (
          <div
            style={{
              borderTop: '1px solid #1e293b',
              padding: '16px 20px',
              background: '#1e293b'
            }}
          >
            {selectedFile && (
              <div
                style={{
                  background: '#0f172a',
                  padding: '10px',
                  borderRadius: 6,
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  border: '1px solid #334155'
                }}
              >
                <File size={20} style={{ opacity: 0.7 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.6 }}>
                    {formatFileSize(selectedFile.size)}
                  </div>
                </div>
                <button
                  onClick={clearSelectedFile}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#e5e7eb',
                    cursor: 'pointer',
                    padding: 4
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#e5e7eb',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Upload size={16} />
              </button>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder={selectedFile ? "Add a caption (optional)..." : "Type a message..."}
                style={{
                  flex: 1,
                  background: '#0f172a',
                  borderRadius: 6,
                  border: '1px solid #334155',
                  padding: '8px 14px',
                  color: '#e5e7eb',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() && !selectedFile}
                style={{
                  padding: '8px 20px',
                  borderRadius: 6,
                  border: 'none',
                  background: (input.trim() || selectedFile) ? '#2563eb' : '#334155',
                  color: '#e5e7eb',
                  fontSize: '14px',
                  cursor: (input.trim() || selectedFile) ? 'pointer' : 'default',
                  fontWeight: 500
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Breeze;