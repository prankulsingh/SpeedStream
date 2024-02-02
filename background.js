chrome.commands.onCommand.addListener(function(command) {
    displayPopup(command);
});


function displayPopup(message) {
    if(message !== "speed_up" && message !== "slow_down") {
        return;
    }
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const tab = tabs[0];
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (message) => {
                const popup = document.createElement('div');
                popup.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background-color: #222;
                    color: #ccc;
                    padding: 10px 20px;
                    border: 1px solid #ccc;
                    font-size: 40px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.5);
                    z-index: 99999999 !important;
                `;
                if(!document.querySelector("video")) {
                    popup.textContent = "Video not found!"
                } else {
                    var playbackRate = document.querySelector("video").playbackRate;
                    if(message === "speed_up") {
                        playbackRate = playbackRate + 0.25;
                        popup.textContent = "⏩ " + playbackRate;
                    }
                    if(message === "slow_down") {
                        playbackRate = playbackRate - 0.25;
                        popup.textContent = "⏪ " + playbackRate;
                    }
                    document.querySelector("video").playbackRate = playbackRate;
                }
                document.body.appendChild(popup);
                setTimeout(() => {
                    popup.remove();
                }, 1000);
            },
            args: [message] // Pass message as an argument
        });
    });
}


