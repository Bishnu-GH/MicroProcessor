// 8085 Simulator Logic

// --- State ---
const memory = new Uint8Array(65536); // 64KB
const registers = {
    A: 0, B: 0, C: 0, D: 0, E: 0, H: 0, L: 0,
    PC: 0, SP: 0xFFFF,
    Flags: { Z: false, S: false, P: false, CY: false, AC: false }
};

let mode = 'RESET'; // RESET, ADDR, DATA
let currentAddr = 0;
let inputBuffer = '';

// --- DOM Elements ---
const displayAddrEl = document.getElementById('display-addr');
const displayDataEl = document.getElementById('display-data');

// --- Helpers ---
function toHex(num, padding = 2) {
    return num.toString(16).toUpperCase().padStart(padding, '0');
}

function fromHex(hex) {
    return parseInt(hex, 16);
}

function updateDisplay(addrStr, dataStr) {
    displayAddrEl.textContent = addrStr;
    displayDataEl.textContent = dataStr;
}

// --- Core Logic ---

function reset() {
    // Clear Registers
    registers.A = 0; registers.B = 0; registers.C = 0;
    registers.D = 0; registers.E = 0; registers.H = 0; registers.L = 0;
    registers.PC = 0; registers.SP = 0xFFFF;
    registers.Flags = { Z: false, S: false, P: false, CY: false, AC: false };

    // Reset State
    mode = 'RESET';
    currentAddr = 0;
    inputBuffer = '';

    updateDisplay('UP', '85');
}

function handleKey(key) {
    if (mode === 'RESET') return;

    inputBuffer = (inputBuffer + key).slice(-4); // Max 4 chars

    if (mode === 'ADDR') {
        updateDisplay(inputBuffer.padStart(4, ' '), '');
    } else if (mode === 'DATA') {
        updateDisplay(toHex(currentAddr, 4), inputBuffer.slice(-2));
    }
}

function handleCmd(cmd) {
    switch (cmd) {
        case 'RES':
            reset();
            break;

        case 'EX MEM':
            mode = 'ADDR';
            inputBuffer = '';
            updateDisplay('    ', '');
            break;

        case 'NEXT':
            if (mode === 'ADDR') {
                // Commit Address
                const addr = fromHex(inputBuffer || '0');
                currentAddr = addr;
                mode = 'DATA';
                inputBuffer = '';
                updateDisplay(toHex(currentAddr, 4), toHex(memory[currentAddr], 2));
            } else if (mode === 'DATA') {
                // Commit Data
                if (inputBuffer) {
                    memory[currentAddr] = fromHex(inputBuffer);
                }
                // Increment
                currentAddr = (currentAddr + 1) & 0xFFFF;
                inputBuffer = '';
                updateDisplay(toHex(currentAddr, 4), toHex(memory[currentAddr], 2));
            }
            break;

        case 'PREV':
            if (mode === 'DATA') {
                // Commit Data
                if (inputBuffer) {
                    memory[currentAddr] = fromHex(inputBuffer);
                }
                // Decrement
                currentAddr = (currentAddr - 1) & 0xFFFF;
                inputBuffer = '';
                updateDisplay(toHex(currentAddr, 4), toHex(memory[currentAddr], 2));
            }
            break;

        case 'GO':
            mode = 'ADDR'; // Simplified GO
            inputBuffer = '';
            updateDisplay('GO  ', '');
            break;

        case 'EXEC':
            if (mode === 'ADDR' || mode === 'DATA') {
                const startAddr = mode === 'ADDR' ? fromHex(inputBuffer || '0') : currentAddr;
                registers.PC = startAddr;
                runProgram();
            }
            break;
    }
}

function runProgram() {
    let instructions = 0;
    let halted = false;

    while (!halted && instructions < 1000) {
        const opcode = memory[registers.PC];
        registers.PC = (registers.PC + 1) & 0xFFFF;

        switch (opcode) {
            case 0x76: // HLT
                halted = true;
                break;

            // MOV A, B
            case 0x78: registers.A = registers.B; break;

            // MVI A, d8
            case 0x3E:
                registers.A = memory[registers.PC];
                registers.PC++;
                break;

            // MVI B, d8
            case 0x06:
                registers.B = memory[registers.PC];
                registers.PC++;
                break;

            // ADD B
            case 0x80:
                registers.A = (registers.A + registers.B) & 0xFF;
                break;

            // STA a16
            case 0x32:
                const low = memory[registers.PC++];
                const high = memory[registers.PC++];
                const addr = (high << 8) | low;
                memory[addr] = registers.A;
                break;

            // Add more opcodes as needed...
        }
        instructions++;
    }

    // Show result (Reg A)
    updateDisplay('E   ', toHex(registers.A, 2));
    mode = 'RESET';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log("8085 Simulator Loaded");
    if (!displayAddrEl || !displayDataEl) {
        console.error("Display elements not found!");
        alert("Error: Display elements not found. Check console.");
    } else {
        reset();
    }
});

// Expose functions to global scope explicitly (just in case)
window.handleKey = handleKey;
window.handleCmd = handleCmd;
