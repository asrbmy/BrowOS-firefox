/**
 * NEO-CALC PRO - Advanced Glassmorphic Calculator Engine
 * Author: Nikhil Rathor (CodeAlpha Frontend Internship)
 */

class NeoCalculator {
  constructor() {
    // Calculator State
    this.currentInput = '0';
    this.expression = '';
    this.memoryValue = 0;
    this.isAngleDeg = true; // DEG or RAD
    this.soundEnabled = true;
    this.history = JSON.parse(localStorage.getItem('neocalc_history') || '[]');
    this.currentTheme = localStorage.getItem('neocalc_theme') || 'cyber-dark';
    this.activeMode = 'standard'; // 'standard', 'scientific', 'converter'

    // DOM Elements
    this.outputDisplay = document.getElementById('outputDisplay');
    this.expressionDisplay = document.getElementById('expressionDisplay');
    this.previewDisplay = document.getElementById('previewDisplay');
    this.angleModeBadge = document.getElementById('angleModeBadge');
    this.angleToggleBtn = document.getElementById('angleToggleBtn');
    this.memoryBadge = document.getElementById('memoryBadge');
    this.historyDrawer = document.getElementById('historyDrawer');
    this.historyList = document.getElementById('historyList');
    this.calcContainer = document.querySelector('.calc-container');
    this.scientificKeypad = document.getElementById('scientificKeypad');
    this.standardKeypad = document.getElementById('standardKeypad');
    this.converterPanel = document.getElementById('converterPanel');
    this.toastEl = document.getElementById('toast');
    this.shortcutsModal = document.getElementById('shortcutsModal');
    this.themeMenu = document.getElementById('themeMenu');

    // Audio Context for Tactile Sound Feedback
    this.audioCtx = null;

    // Unit Converter Data
    this.converterCategories = {
      length: {
        units: ['Meters (m)', 'Kilometers (km)', 'Centimeters (cm)', 'Millimeters (mm)', 'Miles (mi)', 'Yards (yd)', 'Feet (ft)', 'Inches (in)'],
        toBase: [1, 1000, 0.01, 0.001, 1609.344, 0.9144, 0.3048, 0.0254]
      },
      weight: {
        units: ['Kilograms (kg)', 'Grams (g)', 'Milligrams (mg)', 'Pounds (lb)', 'Ounces (oz)', 'Metric Tonnes (t)'],
        toBase: [1, 0.001, 0.000001, 0.45359237, 0.02834952, 1000]
      },
      temp: {
        units: ['Celsius (°C)', 'Fahrenheit (°F)', 'Kelvin (K)'],
        isTemp: true
      },
      data: {
        units: ['Bytes (B)', 'Kilobytes (KB)', 'Megabytes (MB)', 'Gigabytes (GB)', 'Terabytes (TB)'],
        toBase: [1, 1024, 1048576, 1073741824, 1099511627776]
      }
    };
    this.activeConvCat = 'length';

    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.renderHistory();
    this.initConverter();
    this.attachEventListeners();
    this.updateDisplay();
  }

  // Web Audio Tactile Tone Generator
  playClickSound(freq = 600, type = 'sine', duration = 0.04) {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      // Audio fallback silent
    }
  }

  // Toast Notification
  showToast(message) {
    if (!this.toastEl) return;
    this.toastEl.textContent = message;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, 2400);
  }

  // Format Number Output with localized commas
  formatNumber(val) {
    if (val === 'Error' || isNaN(Number(val))) return val;
    const parts = val.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  // Update Main Display
  updateDisplay() {
    this.outputDisplay.textContent = this.currentInput;
    this.expressionDisplay.textContent = this.expression;

    // Auto adjust font size if long
    if (this.currentInput.length > 11) {
      this.outputDisplay.style.fontSize = '1.6rem';
    } else if (this.currentInput.length > 8) {
      this.outputDisplay.style.fontSize = '2.1rem';
    } else {
      this.outputDisplay.style.fontSize = '2.5rem';
    }

    // Live preview
    if (this.expression && !this.expression.endsWith('=')) {
      try {
        const fullExpr = this.sanitizeForEval(this.expression + this.currentInput);
        const res = this.safeEvaluate(fullExpr);
        if (res !== null && !isNaN(res) && isFinite(res) && res.toString() !== this.currentInput) {
          this.previewDisplay.textContent = '= ' + res;
        } else {
          this.previewDisplay.textContent = '';
        }
      } catch (e) {
        this.previewDisplay.textContent = '';
      }
    } else {
      this.previewDisplay.textContent = '';
    }
  }

  // Input Digits
  inputDigit(digit) {
    this.playClickSound(700, 'triangle');
    if (this.currentInput === '0' || this.currentInput === 'Error') {
      this.currentInput = digit;
    } else {
      this.currentInput += digit;
    }
    this.updateDisplay();
  }

  // Input Decimal Point
  inputDecimal() {
    this.playClickSound(650);
    if (this.currentInput === 'Error') this.currentInput = '0';
    if (!this.currentInput.includes('.')) {
      this.currentInput += '.';
      this.updateDisplay();
    }
  }

  // Input Operator (+, -, *, /, ^, etc.)
  inputOperator(op) {
    this.playClickSound(520, 'sine');
    if (this.currentInput === 'Error') return;

    const opSymbol = op === '*' ? '×' : op === '/' ? '÷' : op === '^' ? '^' : op;

    if (this.expression.endsWith('= ')) {
      this.expression = `${this.currentInput} ${opSymbol} `;
      this.currentInput = '0';
    } else if (this.currentInput === '0' && this.expression.length > 0 && /[\+\-\×\÷\^]\s*$/.test(this.expression)) {
      // Replace trailing operator
      this.expression = this.expression.replace(/[\+\-\×\÷\^]\s*$/, `${opSymbol} `);
    } else {
      this.expression += `${this.currentInput} ${opSymbol} `;
      this.currentInput = '0';
    }
    this.updateDisplay();
  }

  // Execute Calculation (=)
  calculate() {
    this.playClickSound(880, 'sine', 0.08);
    if (this.currentInput === 'Error') return;

    const fullExprString = this.expression + this.currentInput;
    if (!this.expression) return;

    try {
      const sanitized = this.sanitizeForEval(fullExprString);
      const result = this.safeEvaluate(sanitized);

      if (result === null || isNaN(result) || !isFinite(result)) {
        this.currentInput = 'Error';
        this.expression = '';
      } else {
        const cleanResult = parseFloat(Number(result).toPrecision(12)).toString();
        this.saveHistory(fullExprString, cleanResult);
        this.expression = `${fullExprString} = `;
        this.currentInput = cleanResult;
      }
    } catch (e) {
      this.currentInput = 'Error';
      this.expression = '';
    }
    this.updateDisplay();
  }

  // Sanitize math expressions to standard JS math
  sanitizeForEval(expr) {
    let sanitized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-');

    // Handle power
    sanitized = sanitized.replace(/(\d+(\.\d+)?|\([^\)]+\))\s*\^\s*(\d+(\.\d+)?|\([^\)]+\))/g, 'Math.pow($1, $3)');
    return sanitized;
  }

  // Safe Math Evaluator using recursive descent / Function sandbox
  safeEvaluate(expr) {
    // Only allow Math, numbers, and arithmetic symbols
    const allowed = /^[0-9\+\-\*\/\.\(\)\sMath\.powMath\.sqrtMath\.sinMath\.cosMath\.tanMath\.logMath\.PIEe,]+$/;
    if (!allowed.test(expr)) return null;
    try {
      // Changed for BrowOS: Chrome extensions block `new Function`,
      // so the expression is calculated with evaluateExpression() instead.
      return evaluateExpression(expr);
    } catch (e) {
      return null;
    }
  }

  // Clear All (AC)
  clearAll() {
    this.playClickSound(400);
    this.currentInput = '0';
    this.expression = '';
    this.previewDisplay.textContent = '';
    this.updateDisplay();
  }

  // Backspace (Delete Last Digit)
  backspace() {
    this.playClickSound(480);
    if (this.currentInput === 'Error') {
      this.currentInput = '0';
    } else if (this.currentInput.length > 1) {
      this.currentInput = this.currentInput.slice(0, -1);
    } else {
      this.currentInput = '0';
    }
    this.updateDisplay();
  }

  // Percentage Function (%)
  percentage() {
    this.playClickSound(580);
    if (this.currentInput === 'Error') return;
    const val = parseFloat(this.currentInput);
    this.currentInput = (val / 100).toString();
    this.updateDisplay();
  }

  // Negate Number (±)
  negate() {
    this.playClickSound(550);
    if (this.currentInput === '0' || this.currentInput === 'Error') return;
    if (this.currentInput.startsWith('-')) {
      this.currentInput = this.currentInput.substring(1);
    } else {
      this.currentInput = '-' + this.currentInput;
    }
    this.updateDisplay();
  }

  // Scientific Special Function Handler
  applyScientific(func) {
    this.playClickSound(640);
    if (this.currentInput === 'Error') return;
    const x = parseFloat(this.currentInput);

    let res = null;
    switch (func) {
      case 'sin': {
        const rad = this.isAngleDeg ? (x * Math.PI) / 180 : x;
        res = Math.sin(rad);
        break;
      }
      case 'cos': {
        const rad = this.isAngleDeg ? (x * Math.PI) / 180 : x;
        res = Math.cos(rad);
        break;
      }
      case 'tan': {
        const rad = this.isAngleDeg ? (x * Math.PI) / 180 : x;
        if (Math.abs(Math.cos(rad)) < 1e-12) res = NaN;
        else res = Math.tan(rad);
        break;
      }
      case 'sqrt':
        res = x >= 0 ? Math.sqrt(x) : NaN;
        break;
      case 'pow2':
        res = Math.pow(x, 2);
        break;
      case 'log':
        res = x > 0 ? Math.log10(x) : NaN;
        break;
      case 'ln':
        res = x > 0 ? Math.log(x) : NaN;
        break;
      case 'inv':
        res = x !== 0 ? 1 / x : NaN;
        break;
      case 'fact':
        res = this.factorial(x);
        break;
      case 'pi':
        res = Math.PI;
        break;
      case 'e':
        res = Math.E;
        break;
      default:
        break;
    }

    if (res !== null) {
      if (isNaN(res) || !isFinite(res)) {
        this.currentInput = 'Error';
      } else {
        this.currentInput = parseFloat(Number(res).toPrecision(12)).toString();
      }
      this.updateDisplay();
    }
  }

  factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n > 170) return Infinity;
    let val = 1;
    for (let i = 2; i <= n; i++) val *= i;
    return val;
  }

  // Memory Keys (MC, MR, M+, M-, MS)
  handleMemory(action) {
    this.playClickSound(500);
    const curVal = parseFloat(this.currentInput) || 0;
    switch (action) {
      case 'mc':
        this.memoryValue = 0;
        this.memoryBadge.style.display = 'none';
        this.showToast('Memory Cleared (MC)');
        break;
      case 'mr':
        this.currentInput = this.memoryValue.toString();
        this.showToast(`Memory Recalled: ${this.memoryValue}`);
        this.updateDisplay();
        break;
      case 'm-plus':
        this.memoryValue += curVal;
        this.memoryBadge.style.display = 'inline-block';
        this.showToast(`Added to Memory: ${curVal}`);
        break;
      case 'm-minus':
        this.memoryValue -= curVal;
        this.memoryBadge.style.display = 'inline-block';
        this.showToast(`Subtracted from Memory: ${curVal}`);
        break;
      case 'ms':
        this.memoryValue = curVal;
        this.memoryBadge.style.display = 'inline-block';
        this.showToast(`Saved to Memory: ${curVal}`);
        break;
    }
  }

  // History Management
  saveHistory(exp, result) {
    const item = {
      id: Date.now(),
      expression: exp,
      result: result,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.history.unshift(item);
    if (this.history.length > 30) this.history.pop();
    localStorage.setItem('neocalc_history', JSON.stringify(this.history));
    this.renderHistory();
  }

  renderHistory() {
    if (!this.historyList) return;
    if (this.history.length === 0) {
      this.historyList.innerHTML = `
        <div class="empty-history">
          <i class="fa-solid fa-receipt"></i>
          <p>No calculations yet</p>
          <span>Your computation tape will appear here</span>
        </div>
      `;
      return;
    }

    this.historyList.innerHTML = this.history.map(item => `
      <div class="history-item" data-res="${item.result}">
        <div class="hist-exp">${item.expression}</div>
        <div class="hist-res">= ${this.formatNumber(item.result)}</div>
      </div>
    `).join('');

    // Click item to insert result
    this.historyList.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        this.currentInput = el.dataset.res;
        this.updateDisplay();
        this.showToast(`Inserted ${el.dataset.res}`);
      });
    });
  }

  clearHistory() {
    this.history = [];
    localStorage.removeItem('neocalc_history');
    this.renderHistory();
    this.showToast('Calculation Tape Cleared');
  }

  // Theme Handling
  applyTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    this.currentTheme = themeName;
    localStorage.setItem('neocalc_theme', themeName);

    // Update active dropdown items
    document.querySelectorAll('.theme-opt').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.themeVal === themeName);
    });
  }

  // Unit Converter Logic
  initConverter() {
    const fromSelect = document.getElementById('convFromUnit');
    const toSelect = document.getElementById('convToUnit');
    const fromVal = document.getElementById('convFromVal');
    const toVal = document.getElementById('convToVal');
    const formulaDisplay = document.getElementById('convFormulaDisplay');
    const swapBtn = document.getElementById('convSwapBtn');

    const updateUnits = () => {
      const cat = this.converterCategories[this.activeConvCat];
      fromSelect.innerHTML = cat.units.map((u, i) => `<option value="${i}">${u}</option>`).join('');
      toSelect.innerHTML = cat.units.map((u, i) => `<option value="${i}">${u}</option>`).join('');
      toSelect.selectedIndex = cat.units.length > 1 ? 1 : 0;
      runConversion();
    };

    const runConversion = () => {
      const cat = this.converterCategories[this.activeConvCat];
      const val = parseFloat(fromVal.value);
      if (isNaN(val)) {
        toVal.value = '';
        return;
      }
      const fromIdx = parseInt(fromSelect.value);
      const toIdx = parseInt(toSelect.value);

      let result = 0;
      if (cat.isTemp) {
        // Temperature conversion
        let celsius = val;
        if (fromIdx === 1) celsius = (val - 32) * (5 / 9); // F -> C
        else if (fromIdx === 2) celsius = val - 273.15; // K -> C

        if (toIdx === 0) result = celsius;
        else if (toIdx === 1) result = (celsius * 9 / 5) + 32;
        else if (toIdx === 2) result = celsius + 273.15;
      } else {
        // Standard ratio conversion
        const inBase = val * cat.toBase[fromIdx];
        result = inBase / cat.toBase[toIdx];
      }

      toVal.value = parseFloat(result.toPrecision(7));
      formulaDisplay.textContent = `1 ${cat.units[fromIdx].split(' ')[0]} ≈ ${(1 * (cat.toBase ? cat.toBase[fromIdx]/cat.toBase[toIdx] : 1)).toFixed(4)} ${cat.units[toIdx].split(' ')[0]}`;
    };

    fromVal.addEventListener('input', runConversion);
    fromSelect.addEventListener('change', runConversion);
    toSelect.addEventListener('change', runConversion);

    swapBtn.addEventListener('click', () => {
      const tempIdx = fromSelect.value;
      fromSelect.value = toSelect.value;
      toSelect.value = tempIdx;
      runConversion();
    });

    document.querySelectorAll('.conv-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.conv-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeConvCat = tab.dataset.conv;
        updateUnits();
      });
    });

    updateUnits();
  }

  // Event Listeners setup
  attachEventListeners() {
    // Mode Switchers
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.mode-tab').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const mode = tab.dataset.mode;
        this.activeMode = mode;

        if (mode === 'standard') {
          this.scientificKeypad.classList.remove('show');
          this.standardKeypad.style.display = 'grid';
          this.converterPanel.style.display = 'none';
        } else if (mode === 'scientific') {
          this.scientificKeypad.classList.add('show');
          this.standardKeypad.style.display = 'grid';
          this.converterPanel.style.display = 'none';
        } else if (mode === 'converter') {
          this.scientificKeypad.classList.remove('show');
          this.standardKeypad.style.display = 'none';
          this.converterPanel.style.display = 'flex';
        }
      });
    });

    // Keypad Click Events
    document.querySelectorAll('.key').forEach(key => {
      key.addEventListener('click', () => {
        // Animation
        key.classList.add('pressed');
        setTimeout(() => key.classList.remove('pressed'), 120);

        if (key.dataset.val !== undefined) {
          if (key.dataset.val === '.') {
            this.inputDecimal();
          } else if (key.dataset.val === '(' || key.dataset.val === ')') {
            this.playClickSound(600);
            if (this.currentInput === '0') this.currentInput = key.dataset.val;
            else this.currentInput += key.dataset.val;
            this.updateDisplay();
          } else {
            this.inputDigit(key.dataset.val);
          }
        } else if (key.dataset.op) {
          this.inputOperator(key.dataset.op);
        } else if (key.dataset.action) {
          const act = key.dataset.action;
          if (act === 'equals') this.calculate();
          else if (act === 'clear-all') this.clearAll();
          else if (act === 'backspace') this.backspace();
          else if (act === 'percent') this.percentage();
          else if (act === 'negate') this.negate();
          else if (act === 'toggle-angle') {
            this.isAngleDeg = !this.isAngleDeg;
            this.angleModeBadge.textContent = this.isAngleDeg ? 'DEG' : 'RAD';
            this.angleToggleBtn.textContent = this.isAngleDeg ? 'RAD' : 'DEG';
            this.showToast(`Switched to ${this.isAngleDeg ? 'Degrees (DEG)' : 'Radians (RAD)'}`);
          }
        } else if (key.dataset.func) {
          this.applyScientific(key.dataset.func);
        }
      });
    });

    // Memory Bar Events
    document.querySelectorAll('.mem-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleMemory(btn.dataset.action));
    });

    // Copy Result Button
    document.getElementById('copyBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(this.currentInput).then(() => {
        this.showToast(`Copied ${this.currentInput} to clipboard!`);
      }).catch(() => {
        this.showToast('Unable to copy');
      });
    });

    // Sound Toggle Button
    const soundToggle = document.getElementById('soundToggle');
    soundToggle.addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      soundToggle.innerHTML = this.soundEnabled ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
      soundToggle.classList.toggle('active', !this.soundEnabled);
      this.showToast(this.soundEnabled ? 'Audio Click Enabled' : 'Audio Muted');
    });

    // History Toggle Button
    const historyToggle = document.getElementById('historyToggle');
    historyToggle.addEventListener('click', () => {
      this.calcContainer.classList.toggle('with-history');
      historyToggle.classList.toggle('active');
    });

    // Clear History Button
    document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());

    // Theme Selector Menu
    const themeDropdownBtn = document.getElementById('themeDropdownBtn');
    themeDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.themeMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      this.themeMenu.classList.remove('show');
    });

    document.querySelectorAll('.theme-opt').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        this.applyTheme(opt.dataset.themeVal);
        this.themeMenu.classList.remove('show');
        this.showToast(`Theme changed to ${opt.textContent.trim()}`);
      });
    });

    // Shortcuts Modal
    const shortcutsBtn = document.getElementById('shortcutsBtn');
    const closeShortcutsModal = document.getElementById('closeShortcutsModal');

    shortcutsBtn.addEventListener('click', () => this.shortcutsModal.showModal());
    closeShortcutsModal.addEventListener('click', () => this.shortcutsModal.close());
    this.shortcutsModal.addEventListener('click', (e) => {
      if (e.target === this.shortcutsModal) this.shortcutsModal.close();
    });

    // Keyboard Shortcuts Listener
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      // Digits
      if (/^[0-9]$/.test(e.key)) {
        this.inputDigit(e.key);
      } else if (e.key === '.') {
        this.inputDecimal();
      } else if (['+', '-', '*', '/'].includes(e.key)) {
        this.inputOperator(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        this.calculate();
      } else if (e.key === 'Backspace') {
        this.backspace();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        this.clearAll();
      } else if (e.key === '%') {
        this.percentage();
      } else if (e.key === '(' || e.key === ')') {
        if (this.currentInput === '0') this.currentInput = e.key;
        else this.currentInput += e.key;
        this.updateDisplay();
      } else if (e.key === '^') {
        this.inputOperator('^');
      } else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        this.applyScientific('sin');
      } else if (e.key.toLowerCase() === 'o') {
        this.applyScientific('cos');
      } else if (e.key.toLowerCase() === 't') {
        this.applyScientific('tan');
      } else if (e.key.toLowerCase() === 'r') {
        this.applyScientific('sqrt');
      } else if (e.key.toLowerCase() === 'p') {
        this.applyScientific('pi');
      } else if (e.key.toLowerCase() === 'e') {
        this.applyScientific('e');
      } else if (e.key.toLowerCase() === 'h') {
        this.calcContainer.classList.toggle('with-history');
        historyToggle.classList.toggle('active');
      }
    });
  }
}

// Instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.neoCalc = new NeoCalculator();
});

// Changed for BrowOS: Chrome extensions block `new Function`, so the
// expression is calculated with this small parser instead.
function evaluateExpression(text) {
  const tokens = text.match(/Math\.[A-Za-z]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?|\.\d+|[()+\-*/,]/g) || [];

  // Every character (except spaces) must belong to a known token
  if (tokens.join('') !== text.replace(/\s+/g, '')) {
    throw new Error('Unknown input');
  }

  const mathFunctions = ['pow', 'sqrt', 'sin', 'cos', 'tan', 'log'];
  let position = 0;

  function peek() {
    return tokens[position];
  }

  function next() {
    return tokens[position++];
  }

  function expect(token) {
    if (next() !== token) {
      throw new Error('Expected ' + token);
    }
  }

  // a + b, a - b
  function parseSum() {
    let value = parseProduct();
    while (peek() === '+' || peek() === '-') {
      const operator = next();
      const right = parseProduct();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  }

  // a * b, a / b
  function parseProduct() {
    let value = parseValue();
    while (peek() === '*' || peek() === '/') {
      const operator = next();
      const right = parseValue();
      value = operator === '*' ? value * right : value / right;
    }
    return value;
  }

  // numbers, -x, (x), Math.PI, Math.E, Math.pow(a, b) ...
  function parseValue() {
    const token = next();

    if (token === undefined) {
      throw new Error('Unexpected end');
    }
    if (token === '-') {
      return -parseValue();
    }
    if (token === '+') {
      return parseValue();
    }
    if (token === '(') {
      const value = parseSum();
      expect(')');
      return value;
    }
    if (token === 'Math.PI') {
      return Math.PI;
    }
    if (token === 'Math.E') {
      return Math.E;
    }
    if (token.startsWith('Math.')) {
      const name = token.slice(5);
      if (!mathFunctions.includes(name)) {
        throw new Error('Unknown function');
      }
      expect('(');
      const args = [parseSum()];
      while (peek() === ',') {
        next();
        args.push(parseSum());
      }
      expect(')');
      return Math[name](...args);
    }
    if (/^[\d.]/.test(token)) {
      return parseFloat(token);
    }
    throw new Error('Unexpected ' + token);
  }

  const result = parseSum();
  if (position !== tokens.length) {
    throw new Error('Unexpected input');
  }
  return result;
}
