
const timerDisplay = document.getElementById("timerDisplay");
const millisecondsDisplay = document.getElementById("milliseconds");
const startButton = document.getElementById("startButton");
const startText = document.getElementById("startText");
const startIcon = document.getElementById("startIcon");
const resetButton = document.getElementById("resetButton");
const lapButton = document.getElementById("lapButton");
const clearButton = document.getElementById("clearButton");
const exportButton = document.getElementById("exportButton");
const themeButton = document.getElementById("themeButton");
const timerRing = document.getElementById("timerRing");
const statusPill = document.getElementById("statusPill");
const statusText = document.getElementById("statusText");
const elapsedMetric = document.getElementById("elapsedMetric");
const lapMetric = document.getElementById("lapMetric");
const bestMetric = document.getElementById("bestMetric");
const lapCount = document.getElementById("lapCount");
const summaryLaps = document.getElementById("summaryLaps");
const averageLap = document.getElementById("averageLap");
const lastLap = document.getElementById("lastLap");
const lapList = document.getElementById("lapList");
const toast = document.getElementById("toast");

let running = false;
let startedAt = 0;
let accumulatedTime = 0;
let animationFrame = null;
let laps = [];
let toastTimer = null;

function getElapsedTime() {
    if (running) {
        return accumulatedTime + performance.now() - startedAt;
    }

    return accumulatedTime;
}

function formatTime(time) {
    const totalMilliseconds = Math.max(0, Math.floor(time));
    const hours = Math.floor(totalMilliseconds / 3600000);
    const minutes = Math.floor((totalMilliseconds % 3600000) / 60000);
    const seconds = Math.floor((totalMilliseconds % 60000) / 1000);

    return [
        String(hours).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0")
    ].join(":");
}

function formatShortTime(time) {
    const totalMilliseconds = Math.max(0, Math.floor(time));
    const minutes = Math.floor(totalMilliseconds / 60000);
    const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
    const centiseconds = Math.floor((totalMilliseconds % 1000) / 10);

    return [
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0")
    ].join(":") + "." + String(centiseconds).padStart(2, "0");
}

function updateStatus(status) {
    statusText.textContent = status;
    statusPill.classList.remove("running", "paused");

    if (status === "RUNNING") {
        statusPill.classList.add("running");
    }

    if (status === "PAUSED") {
        statusPill.classList.add("paused");
    }
}

function updateDisplay() {
    const elapsed = getElapsedTime();

    timerDisplay.textContent = formatTime(elapsed);
    millisecondsDisplay.textContent =
        "." + String(Math.floor((elapsed % 1000) / 10)).padStart(2, "0");

    elapsedMetric.textContent = formatShortTime(elapsed);
    timerRing.style.setProperty(
        "--progress",
        ((elapsed % 60000) / 60000 * 360).toFixed(2) + "deg"
    );

    updateStatistics();

    if (running) {
        animationFrame = requestAnimationFrame(updateDisplay);
    }
}

function startStopwatch() {
    if (running) {
        accumulatedTime += performance.now() - startedAt;
        running = false;

        if (animationFrame !== null) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }

        startText.textContent = "Resume Timer";
        startIcon.textContent = "▶";
        lapButton.disabled = true;
        updateStatus("PAUSED");
        updateDisplay();
        showToast("Timer paused. Your time is saved.");
        return;
    }

    startedAt = performance.now();
    running = true;

    startText.textContent = "Pause Timer";
    startIcon.textContent = "Ⅱ";
    lapButton.disabled = false;
    updateStatus("RUNNING");

    animationFrame = requestAnimationFrame(updateDisplay);
    showToast("Stopwatch started. Make every second count!");
}

function resetStopwatch() {
    running = false;

    if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }

    accumulatedTime = 0;
    startedAt = 0;
    laps = [];

    startText.textContent = "Start Timer";
    startIcon.textContent = "▶";
    lapButton.disabled = true;

    updateStatus("READY");
    renderLaps();
    updateDisplay();

    showToast("Stopwatch reset successfully.");
}

function recordLap() {
    if (!running) {
        showToast("Start the timer before recording a lap.");
        return;
    }

    const totalTime = getElapsedTime();
    const previousTotal = laps.length ? laps[laps.length - 1].total : 0;
    const lapTime = totalTime - previousTotal;

    laps.push({
        number: laps.length + 1,
        split: lapTime,
        total: totalTime
    });

    renderLaps();
    updateStatistics();

    showToast("Lap " + laps.length + " recorded.");
}

function updateStatistics() {
    const total = getElapsedTime();

    lapMetric.textContent = String(laps.length).padStart(2, "0");
    lapCount.textContent = laps.length;
    summaryLaps.textContent = laps.length;

    lastLap.textContent = laps.length
        ? formatShortTime(laps[laps.length - 1].split)
        : "--:--";

    if (laps.length) {
        const average = laps.reduce((sum, lap) => sum + lap.split, 0) / laps.length;
        averageLap.textContent = formatShortTime(average);

        const best = Math.min(...laps.map(lap => lap.split));
        bestMetric.textContent = formatShortTime(best);
    } else {
        averageLap.textContent = "--:--";
        bestMetric.textContent = "--:--";
    }

    if (total === 0 && !laps.length) {
        elapsedMetric.textContent = "00:00.00";
    }
}

function renderLaps() {
    if (!laps.length) {
        lapList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⌁</div>
                <strong>Your journey starts here</strong>
                <p>Start the timer and record your first lap.</p>
            </div>
        `;

        updateStatistics();
        return;
    }

    const bestLap = Math.min(...laps.map(lap => lap.split));

    lapList.innerHTML = [...laps].reverse().map(lap => {
        let performance = "RECORDED";
        let performanceClass = "";

        if (lap.split === bestLap) {
            performance = "★ BEST";
            performanceClass = "fastest";
        } else if (lap.split > bestLap) {
            performance = "SLOWER";
            performanceClass = "slower";
        }

        return `
            <div class="lap-row">
                <span class="lap-number">#${String(lap.number).padStart(2, "0")}</span>
                <span class="lap-time">${formatShortTime(lap.split)}</span>
                <span class="total-time">${formatShortTime(lap.total)}</span>
                <span class="lap-performance ${performanceClass}">${performance}</span>
            </div>
        `;
    }).join("");

    updateStatistics();
}

function clearLaps() {
    if (!laps.length) {
        showToast("There are no laps to clear.");
        return;
    }

    laps = [];
    renderLaps();
    updateDisplay();
    showToast("Lap history cleared. Timer was not reset.");
}

function exportCSV() {
    if (!laps.length) {
        showToast("Record at least one lap before exporting.");
        return;
    }

    const rows = [
        ["Lap Number", "Lap Time", "Total Time", "Performance"]
    ];

    const bestLap = Math.min(...laps.map(lap => lap.split));

    laps.forEach(lap => {
        const performance = lap.split === bestLap ? "Best Lap" : "Recorded";

        rows.push([
            lap.number,
            formatShortTime(lap.split),
            formatShortTime(lap.total),
            performance
        ]);
    });

    const csvContent = rows
        .map(row => row.map(value => `"${value}"`).join(","))
        .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = url;
    downloadLink.download = "chronox-lap-history.csv";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(url);

    showToast("Your lap history CSV has been exported.");
}

function toggleTheme() {
    document.body.classList.toggle("light-theme");

    const lightMode = document.body.classList.contains("light-theme");

    themeButton.textContent = lightMode ? "☾" : "☼";
    themeButton.setAttribute(
        "aria-label",
        lightMode ? "Switch to dark theme" : "Switch to light theme"
    );

    showToast(lightMode ? "Light theme activated." : "Dark theme activated.");
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    if (toastTimer !== null) {
        clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
        toastTimer = null;
    }, 2400);
}

startButton.addEventListener("click", startStopwatch);
resetButton.addEventListener("click", resetStopwatch);
lapButton.addEventListener("click", recordLap);
clearButton.addEventListener("click", clearLaps);
exportButton.addEventListener("click", exportCSV);
themeButton.addEventListener("click", toggleTheme);

document.addEventListener("keydown", event => {
    const target = event.target;
    const typing = target instanceof HTMLElement &&
        (target.isContentEditable ||
         ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName));

    if (typing || event.repeat || event.ctrlKey || event.altKey || event.metaKey) {
        return;
    }

    if (event.code === "Space") {
        event.preventDefault();
        startStopwatch();
    }

    if (event.key.toLowerCase() === "l" && running) {
        recordLap();
    }

    if (event.key.toLowerCase() === "r") {
        resetStopwatch();
    }
});

updateDisplay();