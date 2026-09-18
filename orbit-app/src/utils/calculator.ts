export interface CalcState {
  display: string;
  expr: string;
  acc: number | null;
  op: string | null;
  fresh: boolean;
}

export const initialCalcState: CalcState = { display: "0", expr: "", acc: null, op: null, fresh: true };

export function fmt(n: number): string {
  if (!isFinite(n)) return "Error";
  return String(Math.round(n * 1e10) / 1e10);
}

function apply(a: number, b: number, op: string): number {
  switch (op) {
    case "+": return a + b;
    case "−": return a - b;
    case "×": return a * b;
    case "÷": return b === 0 ? NaN : a / b;
    case "^": return Math.pow(a, b);
    default: return b;
  }
}

const UNARY: Record<string, (v: number) => number> = {
  "√": Math.sqrt, "x²": (v) => v * v, sin: Math.sin, cos: Math.cos, tan: Math.tan,
  ln: Math.log, log: Math.log10, "1/x": (v) => 1 / v, "π": () => Math.PI, e: () => Math.E,
  "n!": (v) => { let r = 1; for (let i = 2; i <= Math.round(v); i++) r *= i; return r; }
};

export function applyKey(s: CalcState, k: string): CalcState {
  if (/^[0-9]$/.test(k)) {
    if (s.fresh || s.display === "0") return { ...s, display: k, fresh: false };
    return { ...s, display: (s.display + k).slice(0, 14), fresh: false };
  }
  if (k === ".") {
    if (s.display.includes(".")) return s;
    if (s.fresh || s.display === "0") return { ...s, display: s.fresh ? "0." : s.display + ".", fresh: false };
    return { ...s, display: (s.display + ".").slice(0, 14), fresh: false };
  }
  if (k === "AC") return { ...initialCalcState };
  if (k === "±") return { ...s, display: String(parseFloat(s.display) * -1) };
  if (k === "%") return { ...s, display: String(parseFloat(s.display) / 100) };
  if (UNARY[k]) {
    const r = UNARY[k](parseFloat(s.display));
    return { ...s, display: fmt(r), expr: `${k}(${s.display})`, fresh: true };
  }
  if (["+", "−", "×", "÷", "^"].includes(k)) {
    const v = parseFloat(s.display);
    const acc = s.acc === null ? v : apply(s.acc, v, s.op || "");
    return { ...s, acc, op: k, expr: `${fmt(acc)} ${k}`, fresh: true, display: fmt(acc) };
  }
  if (k === "=") {
    if (s.acc === null || !s.op) return s;
    const v = parseFloat(s.display);
    const r = apply(s.acc, v, s.op);
    return { ...s, display: fmt(r), expr: `${fmt(s.acc)} ${s.op} ${fmt(v)} =`, acc: null, op: null, fresh: true };
  }
  return s;
}

export const BASIC_KEYS = ["AC", "±", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "0", ".", "="];
export const SCIENTIFIC_KEYS = ["√", "x²", "^", "π", "AC", "sin", "cos", "tan", "ln", "÷", "log", "7", "8", "9", "×", "1/x", "4", "5", "6", "−", "n!", "1", "2", "3", "+", "e", "%", "0", ".", "="];

export function daysBetween(from: Date, to: Date) {
  const totalDays = Math.round((to.getTime() - from.getTime()) / 86400000);
  const weeks = Math.floor(totalDays / 7);
  const remDays = totalDays % 7;
  let workingDays = 0;
  const cur = new Date(from);
  cur.setDate(cur.getDate() + 1);
  while (cur <= to) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) workingDays++;
    cur.setDate(cur.getDate() + 1);
  }
  const sprints = Math.floor(workingDays / 15);
  return { totalDays, weeks, remDays, workingDays, sprints };
}
