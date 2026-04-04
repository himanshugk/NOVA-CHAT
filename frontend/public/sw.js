/**
 * Service Worker for NOVA-CHAT Push Notifications
 */

self.addEventListener("push", (event) => {
    let data = { title: "New Message", body: "You have a new message.", url: "/" };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: "/favicon.ico", 
        badge: "/favicon.ico",
        vibrate: [200, 100, 200],
        data: {
            url: data.url
        }
    };

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.focused && client.visibilityState === "visible") {
                    // Suppress push notification if they are actively looking at the chat
                    return null;
                }
            }
            return self.registration.showNotification(data.title, options);
        })
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;
            
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === urlToOpen && "focus" in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});
