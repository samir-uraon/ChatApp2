"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const isDisabled = message.trim() === "";
 
 
const [isUserLoading, setIsUserLoading] = useState(true);
 
  const [showProfile, setShowProfile] = useState(false);
  const [showProfile2, setShowProfile2] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const [lastMessageMap, setLastMessageMap] = useState({});

  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  const [unreadCounts, setUnreadCounts] = useState(() => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("unreadCounts");
    return saved ? JSON.parse(saved) : {};
  }
  return {};
});

  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL,
    withCredentials: true,
  });

  




  /* ---------------- USERS ---------------- */
  useEffect(() => {
    if (!currentUser) return;

    const fetchUsers = async () => {
      try {
        setIsUsersLoading(true);
        const res = await api.get("/api/auth/contacts");
        setUsers(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsUsersLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);


  
useEffect(() => {
  localStorage.setItem("unreadCounts", JSON.stringify(unreadCounts));
}, [unreadCounts]);




  /* ---------------- FETCH CHAT ---------------- */
  useEffect(() => {
    if (!selectedUser || !currentUser) return;

    const fetchChat = async () => {
      try {
        const res = await api.get(
          `/api/auth/messages?userId=${currentUser._id}&contactId=${selectedUser._id}`
        );
        setChat(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchChat();
  }, [selectedUser, currentUser]);


const formatDateTime = (dateString) => {
  console.log("date : " ,dateString);
  
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return `${date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  })} ${date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
};



  /* ---------------- SOCKET ---------------- */
  useEffect(() => {
  if (!currentUser?._id) return;

  socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
    withCredentials: true,
    transports: ["websocket"],
  });

  socketRef.current.emit("register", currentUser._id);

  socketRef.current.on("online-users", setOnlineUsers);


  socketRef.current.on("receive-message", (data) => {

     updateLastMessage({
      senderId: data.from,
      receiverId: currentUser._id,
      createdAt: data.createdAt,
    });

    setUnreadCounts((prev) => {
      if (selectedUser && data.from === selectedUser._id) {
        return prev;
      }

      return {
        ...prev,
        [data.from]: (prev[data.from] || 0) + 1,
      };
    });

    if (selectedUser && data.from === selectedUser._id) {
      setChat((prev) => [...prev, data]);
    }
  });

  return () => socketRef.current?.disconnect();
}, [currentUser, selectedUser]);

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  /* ---------------- SEND MESSAGE ---------------- */
const sendMessage = async () => {
    if (!selectedUser || !message) return;

  const payload = {
  from: currentUser._id,
  to: selectedUser._id,
  message,
  type: "text",
  createdAt: new Date().toISOString()
};

    try {
      await api.post("/api/auth/messages", payload);
      console.log("Sent payload:", payload);
      socketRef.current.emit("private-message", payload);

      setChat((prev) => [...prev, payload]);

      setLastMessageMap((prev) => ({
        ...prev,
        [selectedUser._id]: Date.now(),
      }));

       updateLastMessage(payload);
      setMessage("");
    } catch (err) {
      console.error(err);
    }
  };


  
 /* ---------------- SORT USERS ---------------- */


const sortedUsers = useMemo(() => {
  return [...users].sort((a, b) => {
    const aUnread = unreadCounts[a._id] || 0;
    const bUnread = unreadCounts[b._id] || 0;

    // 🔥 Step 1: Unread priority
    if (aUnread > 0 && bUnread === 0) return -1;
    if (bUnread > 0 && aUnread === 0) return 1;

    // 🔥 Step 2: Sort by last message timestamp
    const aLast = lastMessageMap[a._id];
    const bLast = lastMessageMap[b._id];

    if (!aLast && !bLast) return 0;
    if (!aLast) return 1;
    if (!bLast) return -1;

    return bLast - aLast;
  });
}, [users, lastMessageMap, unreadCounts]);


  /* ---------------- LOGOUT ---------------- */
  const logout = async () => {
    socketRef.current?.disconnect();
    await api.post("/api/auth/logout");
    localStorage.removeItem("unreadCounts");
    localStorage.removeItem("lastMessageMap");
  
    router.push("/");
  };


  useEffect(() => {
  const stored = localStorage.getItem("lastMessageMap");
  if (stored) {
    setLastMessageMap(JSON.parse(stored));
  }
}, []);
  
  useEffect(() => {
  const fetchCurrentUser = async () => {
    try {
      const res = await api.get("/api/me");
      setCurrentUser(res.data);
      setEditName(res.data.name);
      setEditEmail(res.data.email);
    } catch {
      router.push("/");
    } finally {
      setIsUserLoading(false);
    }
  };

  fetchCurrentUser();
}, []);


const updateLastMessage = (msg) => {
  const otherUserId =
    msg.senderId === currentUser._id
      ? msg.receiverId
      : msg.senderId;

  const timestamp = msg.createdAt
    ? new Date(msg.createdAt).getTime()
    : Date.now();

  setLastMessageMap((prev) => {
    const updated = {
      ...prev,
      [otherUserId]: timestamp,
    };

    localStorage.setItem(
      "lastMessageMap",
      JSON.stringify(updated)
    );

    return updated;
  });
};


  /* ---------------- SAVE PROFILE ---------------- */
  const saveProfile = async () => {
    try {
      const res = await api.put("/api/auth/update-profile", {
        name: editName,
        email: editEmail,
      }
    , {
  headers: { "Content-Type": "application/json" }
});
console.log(res.data);

      setCurrentUser(res.data);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

if (isUserLoading) {
  return (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-sm text-gray-500">
        Verifying secure session...
      </p>
    </div>
  );
}



  return (
    <>
      <div className="min-h-screen bg-gray-100 p-3 sm:p-4 md:p-6 
                 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

        {/* LEFT PANEL */}
        <div className={`bg-white rounded-2xl shadow-lg p-4 md:p-5 flex flex-col 
        h-[calc(100vh-24px)] md:h-[calc(100vh-48px)]
        ${selectedUser ? "hidden md:flex" : "flex"}`}>
          <div className="flex justify-between items-center mb-6 shrink-0">
            
            <button
              onClick={() => setShowProfile(true)}
className="w-10 h-10 md:w-11 md:h-11 hover:cursor-pointer rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center"            >
              {currentUser.name.charAt(0).toUpperCase()}
            </button>

            <button
              onClick={() => router.push("/api/invite")}
className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg text-sm hover:cursor-pointer"            >
              Invite
            </button>

          </div>

          <ul className="space-y-3 overflow-y-auto flex-1 min-h-0 no-scrollbar">
            {isUsersLoading ? (
              <div className="text-center text-gray-400 mt-10">
                Loading contacts...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center text-gray-400 mt-10">
                No contacts found
              </div>
            ) : (
            sortedUsers.map((user) => {
              const isOnline = onlineUsers.includes(user._id);

              return (
                <li
                  key={user._id}
                onClick={() => {
  setSelectedUser(user);

  setUnreadCounts((prev) => ({
    ...prev,
    [user._id]: 0,
  }));
}}
                  className={`p-3 border rounded-xl cursor-pointer ${
                  selectedUser?._id === user._id
                    ? "bg-blue-50 border-blue-400"
                    : "hover:bg-gray-50"
                }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span>{user.name}</span>

                      {/* Green Dot */}
                      {unreadCounts[user._id] > 0 && (
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      )}
                    </div>

                    {unreadCounts[user._id] > 0 && (
                      <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {unreadCounts[user._id]}
                      </span>
                    )}
                  </div>

                  <div className="text-xs mt-1">
                    <span
                      className={
                        isOnline ? "text-green-600" : "text-gray-400"
                      }
                    >
                      ● {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

        {/* RIGHT PANEL */}
        <div className={`col-span-1 md:col-span-2 bg-white rounded-2xl shadow-lg 
        flex flex-col h-[calc(100vh-24px)] md:h-[calc(100vh-48px)] 
        overflow-hidden
        ${!selectedUser ? "hidden md:flex" : "flex"}`}> 

          {!selectedUser ? (
            <div className="flex items-center justify-center flex-1 text-gray-400">
              Select a contact to start chatting
            </div>
          ) : (
            <>
              {/* HEADER */}
              <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50">
                <div className="flex items-center justify-center gap-3">
                    <button
              onClick={() => setShowProfile2(true)}
              className="w-10 h-10 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center hover:cursor-pointer"
            >
              {selectedUser.name.charAt(0).toUpperCase()}
            </button>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {selectedUser.name}
                  </h2>
                  <p
                    className={`text-sm ${
                      onlineUsers.includes(selectedUser._id)
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                  
                  </p>
                </div>

                <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-gray-700 text-xl hover:cursor-pointer"
              >
                <span className="md:hidden text-2xl">←</span>
                <span className="hidden md:inline">✕</span>
              </button>
            </div>

              {/* CHAT SCROLL AREA */}
<div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 no-scrollbar">         
         {chat.map((msg, i) => {
                  const isMe = msg.from === currentUser._id;

                    return (
                      <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] sm:max-w-xs p-3 rounded-xl ${
                        isMe
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200"
                      }`}>
                        {msg.message}
                        <div className="text-[10px] mt-1 text-right opacity-70">
                         {formatDateTime(msg.createdAt)}
                        </div>
                      </div>
                      </div>
                    );
                })}
                <div ref={chatEndRef} />
              </div>

             

              {/* INPUT */}
          <div className="p-2 border-t bg-white">
  <div className="flex items-center gap-2 w-full">

    <input
      type="text"
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !isDisabled) {
          sendMessage();
        }
      }}
      className="flex-1 min-w-0 border rounded-full 
                 px-3 py-2 text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Type message..."
    />

    <button
      onClick={sendMessage}
      disabled={isDisabled}
      className={`shrink-0 px-5 py-2 text-sm rounded-full text-white transition
        ${
          isDisabled
            ? "bg-blue-600 opacity-50 cursor-not-allowed"
            : "bg-blue-600 active:scale-95"
        }`}
    >
      Send
    </button>

  </div>
</div>
            </>
          )}
        </div>
      </div>

      {/* PROFILE MODAL */}
      {showProfile && (
        <div className="fixed inset-0 z-50 font-mono flex items-center justify-center">
          <div
            onClick={() => {
              setShowProfile(false);
              setIsEditing(false);
            }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div className="relative bg-white w-96 max-w-[90%] rounded-2xl shadow-2xl p-8">
            <button
              onClick={() => {
                setShowProfile(false);
                setIsEditing(false);
              }}
              className="absolute top-3 right-6 text-gray-400 hover:text-gray-700 hover:cursor-pointer"
            >
              ✕
            </button>
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white text-4xl font-bold flex items-center justify-center shadow-lg">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              {!isEditing ? (
                <>
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-800">
                      {currentUser.name}
                    </h3>
                    <p className="text-gray-500 mt-1">{currentUser.email}</p>
                  </div>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-xl hover:cursor-pointer"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={logout}
                      className="flex-1 bg-red-500 text-white py-2 rounded-xl hover:cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-full space-y-4">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border rounded-xl px-4 py-2"
                    />
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full border rounded-xl px-4 py-2"
                    />
                  </div>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={saveProfile}
                      className="flex-1 bg-green-600 text-white py-2 rounded-xl hover:cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-gray-400 text-white py-2 rounded-xl hover:cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}




      {showProfile2 && (
        <div className="fixed inset-0 z-50 font-mono flex items-center justify-center">
          <div
            onClick={() => {
              setShowProfile2(false);
            }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div className="relative bg-white w-75 max-w-[60%] rounded-2xl shadow-2xl p-8">
            <button
              onClick={() => {
                setShowProfile2(false);
                 
              }}
              className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 hover:cursor-pointer"
            >
              ✕
            </button>
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="w-24 h-24 rounded-full bg-linear-to-br  from-blue-500 to-indigo-600 text-white text-4xl font-bold flex items-center justify-center shadow-lg">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              {!isEditing ? (
                <>
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-800">
                      {selectedUser.name}
                    </h3>
                    <p className="text-gray-500 mt-1">{selectedUser.email}</p>
                  </div>
                  
                </>
              ) : (
                <>
                  <div className="w-full space-y-4">
                    <input
                      type="text"
                       
                      className="w-full border rounded-xl px-4 py-2"
                    />
                    <input
                      type="email"
                       
                      className="w-full border rounded-xl px-4 py-2"
                    />
                  </div>
                
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
