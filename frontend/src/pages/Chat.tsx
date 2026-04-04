import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { FaPaperclip, FaPaperPlane, FaSearch, FaPlus, FaSmile, FaTimes } from "react-icons/fa";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "../context/ThemeContext";
import CryptoJS from "crypto-js";

const SECRET_KEY = "NOVA_E2EE_MASTER_KEY";

const NeonStyles = () => (
    <style>{`
    @keyframes neon-flow-h {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
    @keyframes neon-flow-v {
      0% { background-position: 50% 0%; }
      100% { background-position: 50% 200%; }
    }
    .dark .neon-border-h {
      background: linear-gradient(90deg, #ff0000, #ffffff, #0000ff, #00ff00, #87ceeb, #800080, #ff0000);
      background-size: 200% auto;
      animation: neon-flow-h 3s linear infinite;
    }
    .dark .neon-border-v {
      background: linear-gradient(180deg, #ff0000, #ffffff, #0000ff, #00ff00, #87ceeb, #800080, #ff0000);
      background-size: auto 200%;
      animation: neon-flow-v 3s linear infinite;
    }
    .dark .void-glow {
      box-shadow: inset 0 0 100px rgba(0,0,0,1);
    }
  `}</style>
);

function decryptPayload(content: string) {
    if (!content) return { text: "", isImage: false, isVideo: false, isOtherFile: false, fileUrl: "" };
    try {
        const dec = CryptoJS.AES.decrypt(content, SECRET_KEY).toString(CryptoJS.enc.Utf8);
        if (dec) {
            const data = JSON.parse(dec);
            return {
                text: data.text || "",
                fileUrl: data.fileUrl || "",
                isImage: data.fileType?.startsWith("image/") || false,
                isVideo: data.fileType?.startsWith("video/") || false,
                isOtherFile: data.fileUrl && !data.fileType?.startsWith("image/") && !data.fileType?.startsWith("video/")
            };
        }
    } catch (e) {
        // Fallback for legacy
    }
    return { text: content.startsWith("data:image") ? "" : content, fileUrl: content.startsWith("data:image") ? content : "", isImage: content.startsWith("data:image"), isVideo: false, isOtherFile: false };
}

const Chat = () => {
    const { token, user } = useAuth();
    const { theme } = useTheme();
    const wsRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const [contacts, setContacts] = useState<{ id: number; name: string; status?: string; profile_song?: string, age?: number, bio?: string, passion?: string }[]>([
        { id: 1, name: "Yourself", status: "Personal Secure Notebook", age: 99, bio: "My isolated local workspace.", passion: "Security" },
    ]);
    const [activeContact, setActiveContact] = useState<{ id: number; name: string; status?: string; profile_song?: string, age?: number, bio?: string, passion?: string }>(contacts[0]);
    const [messages, setMessages] = useState<{ id: number; text: string; isMine: boolean; sender?: string; fileUrl?: string; isImage?: boolean; isVideo?: boolean; isOtherFile?: boolean; time?: string }[]>([]);
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

    const [inputText, setInputText] = useState("");
    const [attachmentUrl, setAttachmentUrl] = useState("");
    const [attachmentType, setAttachmentType] = useState("");
    const [attachmentName, setAttachmentName] = useState("");
    const [showEmoji, setShowEmoji] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [newContactUsername, setNewContactUsername] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchContacts = async () => {
        try {
            const baseUrl = import.meta.env.VITE_API_BASE || "http://localhost:8000";
            const res = await fetch(`${baseUrl}/api/chat/contacts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const combined = [{ id: 1, name: "Yourself", status: "Personal Secure Notebook", age: 99, bio: "My isolated local workspace.", passion: "Security" }, ...data];
                const unique = Array.from(new Map(combined.map((item: any) => [item.id, item])).values());
                // @ts-ignore
                setContacts(unique);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchHistory = async (contactId: number) => {
        try {
            const baseUrl = import.meta.env.VITE_API_BASE || "http://localhost:8000";
            const res = await fetch(`${baseUrl}/api/chat/history/${contactId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data.map((m: any) => {
                    const dec = decryptPayload(m.content);
                    return {
                        id: m.id,
                        text: dec.text,
                        isMine: m.sender_id === user?.id,
                        sender: m.sender_id === user?.id ? "Me" : activeContact?.name,
                        fileUrl: dec.fileUrl,
                        isImage: dec.isImage,
                        isVideo: dec.isVideo,
                        isOtherFile: dec.isOtherFile,
                        time: new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (token) fetchContacts();
    }, [token]);

    useEffect(() => {
        if (activeContact && token) {
            fetchHistory(activeContact.id);
            if (audioRef.current && activeContact.profile_song) {
                audioRef.current.play().catch(e => console.log("Audio autoplay blocked", e));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeContact, token]);

    useEffect(() => {
        if (!token) return;

        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsHost = import.meta.env.VITE_API_BASE?.replace('http://', '').replace('https://', '') || "localhost:8000";

        const ws = new WebSocket(`${wsProtocol}//${wsHost}/ws/chat/${token}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const data = event.data;
            try {
                const parsed = JSON.parse(data);
                
                const msgSender = parsed.sender_id?.toString();
                const msgReceiver = parsed.receiver_id?.toString();
                const myId = user?.id?.toString();
                const contactId = activeContact?.id?.toString();
                
                const isGlobalChat = parsed.receiver_id === null && activeContact?.id === 1;
                const isPrivateChatWithActive = (msgSender === myId && msgReceiver === contactId) || (msgReceiver === myId && msgSender === contactId);

                if (isGlobalChat || isPrivateChatWithActive) {
                    const senderName = parsed.sender_id === (user?.id?.toString() || user?.id) ? "Me" : `Pilot ${parsed.sender_id}`;
                    const isMine = parsed.sender_id === user?.id?.toString() || parsed.sender_id === user?.id;
                    const dec = decryptPayload(parsed.content);
                    
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: Date.now() + Math.random(),
                            text: dec.text,
                            isMine: isMine,
                            sender: isMine ? "Me" : senderName,
                            fileUrl: dec.fileUrl,
                            isImage: dec.isImage,
                            isVideo: dec.isVideo,
                            isOtherFile: dec.isOtherFile,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }
                    ]);
                }
            } catch (e) { }
        };

        return () => ws.close();
    }, [token, user, activeContact]);

    useEffect(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    }, [messages]);

    const handleSend = () => {
        if ((!inputText.trim() && !attachmentUrl) || !wsRef.current) return;

        const originalPayload = {
            text: inputText,
            fileUrl: attachmentUrl,
            fileType: attachmentType,
            fileName: attachmentName
        };
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(originalPayload), SECRET_KEY).toString();
        const roomId = activeContact.id === 1 ? null : activeContact.id;

        wsRef.current.send(JSON.stringify({
            content: encrypted,
            room_id: roomId,
            receiver_id: roomId
        }));

        setInputText("");
        setAttachmentUrl("");
        setAttachmentType("");
        setAttachmentName("");
        setShowEmoji(false);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append("file", file);
            
            try {
                const baseUrl = import.meta.env.VITE_API_BASE || "http://localhost:8000";
                const res = await fetch(`${baseUrl}/api/upload`, {
                    method: "POST",
                    body: formData
                });
                if (res.ok) {
                    const data = await res.json();
                    setAttachmentUrl(baseUrl + data.url);
                    setAttachmentType(file.type);
                    setAttachmentName(file.name);
                    setShowEmoji(false);
                } else {
                    alert("Failed to upload file");
                }
            } catch (err) {
                console.error("Upload error", err);
            }
        }
    };

    const handleAddContact = async () => {
        if (!newContactUsername.trim()) return;
        try {
            const baseUrl = import.meta.env.VITE_API_BASE || "http://localhost:8000";
            const res = await fetch(`${baseUrl}/api/chat/add_contact`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ username: newContactUsername })
            });
            if (res.ok) {
                fetchContacts();
                setShowAddModal(false);
                setNewContactUsername("");
            } else {
                alert("Player not found!");
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (!token || user?.is_guest) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-black text-gray-900 dark:text-white pt-16 void-glow transition-colors duration-500">
                <NeonStyles />
                <div className="text-center p-8 bg-white dark:bg-black border border-gray-200 dark:border-gray-600 rounded-2xl max-w-sm shadow-xl dark:shadow-[0_0_50px_rgba(0,0,0,1)] relative overflow-hidden transition-all duration-500">
                    <div className="absolute top-0 left-0 w-full h-[2px] neon-border-h"></div>
                    <div className="absolute bottom-0 left-0 w-full h-[2px] neon-border-h"></div>
                    <h2 className="text-lg font-bold mb-3 tracking-wide text-gray-900 dark:text-white mt-2 uppercase">Verification Required</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 text-xs font-semibold">
                        Please sign in with a verified account to access secure comms.
                    </p>
                    <button onClick={() => window.location.href = '/auth'} className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black font-black py-3 rounded-lg transition-all shadow-lg text-xs tracking-widest uppercase">
                        Sign In Now
                    </button>
                </div>
            </div>
        );
    }

    const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex flex-col h-[100dvh] bg-white dark:bg-black text-gray-900 dark:text-white font-sans overflow-hidden text-[13px] void-glow transition-colors duration-500">
            <NeonStyles />
            <audio ref={audioRef} autoPlay loop hidden src={activeContact?.profile_song || ""} />

            {/* Main Chat Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Container */}
                <div className={`w-full md:w-[280px] flex-col bg-gray-50 dark:bg-black shrink-0 border-r border-gray-200 dark:border-gray-600 relative transition-colors duration-500 ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
                {/* Neon Vertical Separator right on the edge of the Sidebar */}
                <div className="absolute top-0 right-[-1px] w-[2px] h-full neon-border-v z-10 opacity-70 hidden dark:block"></div>

                {/* User Profile Header */}
                <div className="h-[60px] flex items-center justify-between px-5 shrink-0 border-b border-gray-200 dark:border-gray-600 transition-colors duration-500">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src={user?.profile_image || `https://ui-avatars.com/api/?name=${user?.username}&background=random`}
                                alt="Me"
                                className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600 shadow-sm transition-colors duration-500 cursor-pointer"
                                onClick={() => window.location.href = '/profile'}
                            />
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-black"></div>
                        </div>
                        <h2 className="font-bold text-gray-900 dark:text-white tracking-widest text-[13px] uppercase">{user?.username || "My Account"}</h2>
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm dark:shadow-none">
                        <FaPlus className="size-3" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-5 mb-3 mt-3 relative">
                    <FaSearch className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 size-3" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-gray-800 text-[12px] text-gray-900 dark:text-white rounded-full py-2 pl-9 pr-3 outline-none border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-white shadow-sm dark:shadow-none transition-colors duration-500"
                    />
                </div>

                {/* Contact List */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent mt-1">
                    {filteredContacts.map((contact) => (
                        <div
                            key={contact.id}
                            onClick={() => {
                                setActiveContact(contact);
                                setIsMobileChatOpen(true);
                            }}
                            className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors border-l-2 ${activeContact?.id === contact.id ? "bg-blue-50 dark:bg-gray-900 border-blue-600 dark:border-white shadow-sm dark:shadow-none" : "border-transparent hover:bg-gray-100 dark:hover:bg-gray-900"
                                }`}
                        >
                            <div className="relative shrink-0">
                                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 flex items-center justify-center font-bold text-sm text-gray-900 dark:text-white shadow-sm overflow-hidden transition-colors duration-500">
                                    <img src={`https://ui-avatars.com/api/?name=${contact.name}&background=random`} alt={contact.name} className="w-full h-full object-cover opacity-90" />
                                </div>
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-black"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className="font-bold text-[13px] truncate text-gray-900 dark:text-white tracking-wide uppercase">
                                        {contact.name} 
                                        {contact.age && contact.id !== 1 && (
                                            <span className="ml-1.5 text-[9px] font-black bg-blue-100 text-blue-700 dark:bg-gray-800 dark:text-blue-400 px-1 py-0.5 rounded uppercase">
                                                {contact.age >= 25 ? 'Adult' : contact.age >= 18 ? 'Young Adult' : contact.age >= 13 ? 'Teen' : 'Child'}
                                            </span>
                                        )}
                                    </h3>
                                    <span className="text-[9px] text-gray-400 dark:text-gray-500 shrink-0 font-bold uppercase">Now</span>
                                </div>
                                <p className="text-[11px] text-gray-500 font-medium truncate">{contact.bio || contact.status || "Tap to open comms"}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex-col relative bg-white dark:bg-black void-glow transition-colors duration-500 ${isMobileChatOpen ? 'flex' : 'hidden md:flex'}`}>

                {/* Chat Header */}
                <div className="h-[60px] flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-600 shrink-0 relative transition-colors duration-500">
                    <div className="flex items-center gap-3">
                        <button 
                            className="md:hidden mr-2 p-2 -ml-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            onClick={() => setIsMobileChatOpen(false)}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                        <div className="size-9 rounded-full overflow-hidden shadow-sm border border-gray-300 dark:border-gray-600 transition-colors duration-500">
                            <img src={`https://ui-avatars.com/api/?name=${activeContact?.name}&background=random`} alt={activeContact?.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h3 className="text-gray-900 dark:text-white font-black text-[14px] tracking-widest uppercase">
                                {activeContact?.name}
                                {activeContact?.age && activeContact?.id !== 1 && (
                                    <span className="ml-2 inline-block text-[9px] font-black bg-blue-100 text-blue-700 dark:bg-gray-800 dark:text-blue-400 px-1.5 py-0.5 rounded tracking-widest align-top mt-0.5">
                                        [{activeContact.age >= 25 ? 'Adult' : activeContact.age >= 18 ? 'Young Adult' : activeContact.age >= 13 ? 'Teen' : 'Child'}]
                                    </span>
                                )}
                            </h3>
                            <span className="text-[10px] text-green-600 dark:text-green-400 font-bold opacity-90 block -mt-0.5 tracking-wider">
                                {activeContact?.passion ? `Passion: ${activeContact.passion}` : (activeContact?.status || "Active Relay Node")}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Messages Hub */}
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent relative">
                    {messages.map((msg, index) => {
                        const isMe = msg.isMine;
                        return (
                            <div key={msg.id + index} className={`flex max-w-[65%] ${isMe ? "self-end" : "self-start"} flex-col`}>
                                {!isMe && (
                                    <div className="flex items-baseline gap-2 mb-1 ml-1.5">
                                        <span className="text-[10.5px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{msg.sender}</span>
                                        <span className="text-[9px] text-gray-400 dark:text-gray-600 font-bold">{msg.time || "Now"}</span>
                                    </div>
                                )}

                                <div className={`flex items-end gap-2 ${isMe ? "flex-row" : "flex-row-reverse"}`}>
                                    <div className={`w-fit max-w-full px-4 py-3 relative group transition-colors duration-500 font-medium ${isMe
                                            ? "bg-blue-600 text-white dark:bg-black dark:text-white rounded-[16px] rounded-br-[4px] shadow-md dark:shadow-none dark:border dark:border-gray-600"
                                            : "bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white rounded-[16px] rounded-bl-[4px] shadow-sm dark:shadow-none dark:border dark:border-gray-600"
                                        }`}>
                                        {isMe && (
                                            <div className={`absolute top-1.5 right-2.5 text-[8px] font-bold ${theme === 'light' ? 'text-blue-200' : 'text-gray-500'}`}>{msg.time || "Now"}</div>
                                        )}

                                        {msg.isImage && (
                                            <img src={msg.fileUrl} alt="Attachment" className={`max-w-full rounded-[10px] object-contain max-h-[220px] ${msg.text ? "mb-2" : ""} shadow-sm border border-gray-300 dark:border-gray-600`} />
                                        )}
                                        {msg.isVideo && (
                                            <video src={msg.fileUrl} controls className={`max-w-full rounded-[10px] max-h-[220px] flex border border-gray-300 dark:border-gray-600 ${msg.text ? "mb-2" : ""}`} />
                                        )}
                                        {msg.isOtherFile && (
                                            <a href={msg.fileUrl} download target="_blank" rel="noreferrer" className={`inline-block px-3 py-2 bg-blue-100/30 dark:bg-gray-800 text-blue-100 dark:text-blue-300 rounded font-bold text-xs underline ${msg.text ? "mb-2" : ""}`}>
                                                Download Wrapped Document
                                            </a>
                                        )}
                                        
                                        {msg.text && (
                                            <p className={`text-[13px] leading-relaxed break-words whitespace-pre-wrap ${isMe ? "min-w-[40px] pr-6 mt-0.5" : ""}`}>{msg.text}</p>
                                        )}
                                    </div>

                                    {isMe && (
                                        <div className="size-5 rounded-full overflow-hidden shrink-0 hidden sm:block border border-gray-300 dark:border-gray-600 shadow-sm transition-colors duration-500">
                                            <img src={user?.profile_image || `https://ui-avatars.com/api/?name=${user?.username}&background=random`} alt="Me" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    {!isMe && (
                                        <div className="size-5 rounded-full overflow-hidden shrink-0 hidden sm:block border border-gray-300 dark:border-gray-600 shadow-sm transition-colors duration-500">
                                            <img src={`https://ui-avatars.com/api/?name=${msg.sender}&background=random`} alt="Them" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} className="h-2" />
                </div>

                {/* Input Hub */}
                <div className="px-5 py-3 shrink-0 flex gap-2.5 items-end border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-black relative transition-colors duration-500">

                    {/* Neon Horizontal Separator right on the edge of the Input Box border */}
                    <div className="absolute top-[-1px] left-0 w-full h-[2px] neon-border-h z-10 opacity-70 hidden dark:block"></div>

                    {/* Integrated Emoji Picker Window */}
                    {showEmoji && (
                        <div className="absolute bottom-[65px] left-6 z-50 shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-600">
                            <EmojiPicker
                                theme={theme === 'light' ? Theme.LIGHT : Theme.DARK}
                                onEmojiClick={(emoji) => setInputText(prev => prev + emoji.emoji)}
                                lazyLoadEmojis={true}
                                searchDisabled={true}
                                skinTonesDisabled={true}
                            />
                        </div>
                    )}

                    {/* Messenger Box */}
                    <div className="flex-1 flex flex-col items-end gap-1.5 bg-white dark:bg-gray-800 rounded-[20px] px-4 border border-gray-300 dark:border-gray-600 focus-within:border-blue-500 dark:focus-within:border-white shadow-sm transition-all duration-300">
                        {attachmentUrl && (
                            <div className="w-full my-1.5 relative inline-block p-1 bg-gray-100 dark:bg-gray-900 rounded-xl self-start border border-gray-200 dark:border-gray-600">
                                {attachmentType.startsWith('image/') ? (
                                    <img src={attachmentUrl} alt="Preview" className="h-[45px] w-auto rounded-[8px] object-cover border border-gray-300 dark:border-transparent" />
                                ) : attachmentType.startsWith('video/') ? (
                                    <video src={attachmentUrl} className="h-[45px] w-auto rounded-[8px] object-cover" />
                                ) : (
                                    <div className="text-xs p-2 truncate">{attachmentName}</div>
                                )}
                                <button onClick={() => setAttachmentUrl("")} className="absolute top-0 right-0 bg-white dark:bg-black text-gray-900 dark:text-white rounded-full p-1 hover:text-red-500 dark:hover:text-red-500 transition-colors border border-gray-300 dark:border-gray-600 shadow-sm">
                                    <FaTimes className="size-2.5" />
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-2 w-full h-[42px]">
                            <button onClick={() => setShowEmoji(!showEmoji)} className="text-gray-400 hover:text-blue-500 dark:hover:text-white transition-colors shrink-0">
                                <FaSmile className="size-4" />
                            </button>
                            <input
                                type="text"
                                className="flex-1 bg-transparent text-[13px] text-gray-900 dark:text-white font-medium outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                placeholder="Transmit message (Secure E2EE)..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onClick={() => setShowEmoji(false)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleSend();
                                        setShowEmoji(false);
                                    }
                                }}
                            />
                            <label className="text-gray-400 hover:text-blue-500 dark:hover:text-white cursor-pointer p-1 transition-colors shrink-0">
                                <FaPaperclip className="size-[14px]" />
                                <input type="file" accept="*/*" className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>
                    {/* Send Button */}
                    <button
                        onClick={handleSend}
                        className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black size-[42px] rounded-full flex items-center justify-center transition-all shadow-md dark:shadow-[0_0_15px_rgba(255,255,255,0.4)] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed mb-0"
                        disabled={!inputText.trim() && !attachmentUrl}
                    >
                        <FaPaperPlane className="size-[14px] mr-1" />
                    </button>
                </div>
            </div>

            {/* Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 dark:bg-black/80 backdrop-blur-sm px-4">
                    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-600 rounded-[20px] p-6 w-full max-w-[320px] shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,1)] relative overflow-hidden transition-colors duration-500">
                        <div className="absolute top-0 left-0 w-full h-[2px] neon-border-h hidden dark:block"></div>
                        <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <FaTimes className="size-3" />
                        </button>
                        <h3 className="text-[15px] font-black text-gray-900 dark:text-white mb-5 uppercase tracking-widest text-center mt-2">Add Contact</h3>
                        <input
                            type="text"
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-[13px] text-gray-900 dark:text-white mb-5 outline-none focus:border-blue-500 dark:focus:border-white font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-inner dark:shadow-none text-center tracking-wide transition-colors"
                            placeholder="Enter Callsign..."
                            value={newContactUsername}
                            onChange={(e) => setNewContactUsername(e.target.value)}
                        />
                        <button
                            onClick={handleAddContact}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black font-black py-2.5 rounded-lg transition-colors shadow-md uppercase text-[11px] tracking-widest"
                        >
                            Connect To Node
                        </button>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default Chat;
