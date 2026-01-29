chrome.commands.onCommand.addListener((command) => {
    if (command === "speed_up" || command === "slow_down") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, { action: command });
            }
        });
    }
});


