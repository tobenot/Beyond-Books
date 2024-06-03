// scripts/pythonInteraction.js

function handleTouch(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const touchX = touch.clientX - canvas.getBoundingClientRect().left;
    const touchY = touch.clientY - canvas.getBoundingClientRect().top;

    pyodide.runPythonAsync(`update_touch(${touchX}, ${touchY})`).then(state => {
        gameState = JSON.parse(state);
        draw();
    });
}