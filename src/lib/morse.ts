// ITU morse code map (A-Z + 0-9). Used by the kiosk "Make a Call" demo.
export const MORSE: Record<string, string> = {
  A: ".-",    B: "-...",  C: "-.-.",  D: "-..",   E: ".",
  F: "..-.",  G: "--.",   H: "....",  I: "..",    J: ".---",
  K: "-.-",   L: ".-..",  M: "--",    N: "-.",    O: "---",
  P: ".--.",  Q: "--.-",  R: ".-.",   S: "...",   T: "-",
  U: "..-",   V: "...-",  W: ".--",   X: "-..-",  Y: "-.--",
  Z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
  "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
};

const REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE).map(([k, v]) => [v, k])
);

export function decodeSymbols(symbols: string): string | null {
  return REVERSE[symbols] ?? null;
}

export const MORSE_ALPHABET: { char: string; code: string }[] = Object.entries(
  MORSE
).map(([char, code]) => ({ char, code }));
