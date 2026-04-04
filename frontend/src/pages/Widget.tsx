import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { FaPaperPlane, FaTimes } from "react-icons/fa";
import CryptoJS from "crypto-js";

const SECRET_KEY = "NOVA_E2EE_MASTER_KEY"; // Using legacy key for Widget compatibility

function decryptPayload(content: string) {
    if (!content) return { text: "" };
    try {
        const dec = CryptoJS.AES.decrypt(content, SECRET_KEY).toString(CryptoJS.enc.Utf8);
        if (dec) return JSON.parse(dec);
    } catch (e) { }
    return { text: content };
}

const Widget = () => {
    const { token, user } = useAuth();
    const wsRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // We bind to the global "Yourself" / Public relay for the simple widget to start
    const [messages, setMessages] = useState<{ id: number; text: string; isMine: boolean; sender?: string; time?: string }[]>([]);
    const [inputText, setInputText] = useState("");

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
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]);
            } catch (e) { }
        };

        return () => ws.close();
    }, [token, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (!inputText.trim() || !wsRef.current) return;

        const originalPayload = { text: inputText };
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(originalPayload), SECRET_KEY).toString();

        wsRef.current.send(JSON.stringify({
            content: encrypted,
            room_id: 1, // Defaulting Widget to secure workspace 1
            receiver_id: null
        }));

        setInputText("");
    };

    if (!token || user?.is_guest) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-black p-4 font-sans text-center">
                <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-full">
                    <h2 className="text-sm font-bold mb-2 text-gray-900 dark:text-white uppercase tracking-wider">Access Denied</h2>
                    <p className="text-xs text-gray-500 mb-4">Please log in to the main NOVA network first.</p>
                    <a href="/auth" target="_blank" rel="noopener noreferrer" className="block w-full bg-blue-600 text-white text-xs font-bold py-2 rounded-lg text-center uppercase">Sign In</a>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-black font-sans text-sm p-4 w-full border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="h-[50px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl mb-3 flex items-center px-4 justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-bold text-gray-900 dark:text-white uppercase tracking-widest text-[11px]">NOVA CHAT</span>
                </div>
                <button onClick={() => window.parent.postMessage('close-widget', '*')} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    <FaTimes size={14} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-3 scrollbar-hide flex flex-col gap-3 p-1">
                {messages.map((msg) => (
                    <div key={msg.id} className={`max-w-[85%] ${msg.isMine ? "self-end bg-blue-600 text-white" : "self-start bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-gray-700"} px-3 py-2 rounded-xl text-[12px] shadow-sm`}>
                        <p>{msg.text}</p>
                        <span className="text-[9px] opacity-70 block mt-1 text-right">{msg.time || 'Now'}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1.5 border border-gray-200 dark:border-gray-700 rounded-xl shrink-0">
                <input 
                    type="text" 
                    className="flex-1 bg-transparent border-none outline-none px-3 text-[12px] text-gray-900 dark:text-white placeholder:text-gray-500"
                    placeholder="Enter message..." 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button onClick={handleSend} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition">
                    <FaPaperPlane size={12} />
                </button>
            </div>
        </div>
    );
};

export default Widget;
