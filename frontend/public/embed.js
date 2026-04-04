(function() {
    // Nova Chat Embed Script
    const WIDGET_URL = "https://nova-site-eosin.vercel.app/widget"; // You can change this when deploying different environments
    const BUBBLE_ICON = "https://ui-avatars.com/api/?name=NOVA&background=0D8ABC&color=fff"; // Uses an avatar generator for a neat logo

    // Create Container
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.bottom = "20px";
    container.style.right = "20px";
    container.style.zIndex = "999999";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "flex-end";

    // Create Bubble Button
    const bubble = document.createElement("div");
    bubble.style.width = "60px";
    bubble.style.height = "60px";
    bubble.style.borderRadius = "50%";
    bubble.style.backgroundColor = "#2563eb"; // Nova Blue
    bubble.style.backgroundImage = `url('${BUBBLE_ICON}')`;
    bubble.style.backgroundSize = "cover";
    bubble.style.boxShadow = "0 10px 25px rgba(37,99,235, 0.4)";
    bubble.style.cursor = "pointer";
    bubble.style.transition = "transform 0.3s ease";
    
    bubble.onmouseover = () => { bubble.style.transform = "scale(1.1)"; };
    bubble.onmouseleave = () => { bubble.style.transform = "scale(1)"; };

    // Create iframe panel
    const panel = document.createElement("div");
    panel.style.width = "380px";
    panel.style.height = "600px";
    panel.style.maxWidth = "90vw";
    panel.style.maxHeight = "80vh";
    panel.style.backgroundColor = "transparent";
    panel.style.borderRadius = "20px";
    panel.style.boxShadow = "0 15px 40px rgba(0,0,0,0.3)";
    panel.style.overflow = "hidden";
    panel.style.marginBottom = "15px";
    panel.style.display = "none"; // Hidden initially
    panel.style.transition = "opacity 0.3s ease";
    panel.style.opacity = "0";

    const iframe = document.createElement("iframe");
    iframe.src = WIDGET_URL;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.allow = "microphone; camera"; // Optional permissions for attachment uploads
    panel.appendChild(iframe);

    let isOpen = false;
    bubble.onclick = () => {
        isOpen = !isOpen;
        if (isOpen) {
            panel.style.display = "block";
            // trigger reflow
            void panel.offsetWidth;
            panel.style.opacity = "1";
        } else {
            panel.style.opacity = "0";
            setTimeout(() => {
                if (!isOpen) panel.style.display = "none";
            }, 300);
        }
    };

    container.appendChild(panel);
    container.appendChild(bubble);
    document.body.appendChild(container);
})();
