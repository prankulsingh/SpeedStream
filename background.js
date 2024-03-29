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
                const dialog = document.createElement('dialog');
                if(!document.querySelector("video")) {
                    dialog.textContent = "Video not found!"
                } else {
                    var playbackRate = document.querySelector("video").playbackRate;
                    if(message === "speed_up") {
                        playbackRate = playbackRate + 0.25;
                        dialog.textContent = "⏩ " + playbackRate;
                    }
                    if(message === "slow_down") {
                        playbackRate = playbackRate - 0.25;
                        dialog.textContent = "⏪ " + playbackRate;
                    }
                    document.querySelector("video").playbackRate = playbackRate;
                }
                document.body.appendChild(dialog);
                dialog.showModal();
                setTimeout(() => {
                    dialog.remove();
                }, 1000);
            },
            args: [message] // Pass message as an argument
        });
    });
}


