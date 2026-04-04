import { createContext, useState, useEffect } from "react";
import API_BASE from "../services/api";

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (token) {
      // Decode JWT to strictly assert the 3-hour limit
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          console.warn("Session strictly expired (3-hour rule).");
          logout();
          return;
        }
      } catch (err) {
        logout();
        return;
      }

      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(async data => {
          if (data.id) {
            setUser({ ...data, is_guest: !data.email });
            
            // Background Setups
            try {
                if (Notification.permission === 'default' && !data.is_guest) {
                    await Notification.requestPermission();
                }
                
                // 1. Setup E2EE Keys
                const { generateRSAKeyPair, exportPublicKey, exportPrivateKey } = await import('../lib/crypto');
                let priv = localStorage.getItem("nova_priv_key");
                let pub = localStorage.getItem("nova_pub_key");
                
                if (!priv || !pub) {
                    const kp = await generateRSAKeyPair();
                    priv = await exportPrivateKey(kp.privateKey);
                    pub = await exportPublicKey(kp.publicKey);
                    localStorage.setItem("nova_priv_key", priv);
                    localStorage.setItem("nova_pub_key", pub);
                }
                
                await fetch(`${API_BASE}/auth/public-key`, {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ public_key: pub })
                });

                // 2. Setup Web Push
                if ('serviceWorker' in navigator && 'PushManager' in window && Notification.permission === 'granted') {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    const urlBase64ToUint8Array = (base64String: string) => {
                        const padding = '='.repeat((4 - base64String.length % 4) % 4);
                        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
                        const rawData = window.atob(base64);
                        return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
                    };
                    const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array("BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLZ_4zccp_jI")
                    });
                    
                    await fetch(`${API_BASE}/auth/push-subscription`, {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ subscription: JSON.stringify(subscription) })
                    });
                }
            } catch (setupError) {
                console.error("Background routines failed", setupError);
            }

          } else {
            logout();
          }
        })
        .catch(err => console.error("Validation failed", err));
    } else {
      setUser(null);
    }
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
};
