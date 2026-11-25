import React, { useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// ---- Colors, copied directly from the decompiled t0.f class ----
const COLORS = {
  keyBg: '#252D3D',
  keyText: '#F9FAFB',
  specialBg: '#1A1F2E',
  dimText: '#9CA3AF',
  accentCyan: '#00F5D4',
  darkText: '#0A0E17', // used for key text when background turns cyan (shift active)
  border: '#374151',
  rippleCyan: '#1A00F5D4', // ~10% opacity cyan
  background: '#0A0E17',
};

// ---- Key "type" enum, matches `d` in the original ----
const KeyType = {
  CHAR: 'char',
  SHIFT: 'shift',
  BACKSPACE: 'backspace',
  SYMBOLS: 'symbols', // ?123
  SPACE: 'space',
  OK: 'ok',
  SYMBOLS2: 'symbols2', // =/#
  ABC: 'abc', // back to letters
};

// weight = relative width multiplier (1 = normal key, 1.5 = wide, 5 = space bar)
const key = (label, type = KeyType.CHAR, weight = 1) => ({ label, type, weight });

// ---- The four layouts, exactly as extracted from t0.f ----
const QWERTY = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map((l) => key(l)),
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map((l) => key(l)),
  [
    key('⇧', KeyType.SHIFT, 1.5),
    ...['z', 'x', 'c', 'v', 'b', 'n', 'm'].map((l) => key(l)),
    key('⌫', KeyType.BACKSPACE, 1.5),
  ],
  [key('?123', KeyType.SYMBOLS, 1.5), key(',', KeyType.CHAR), key(' ', KeyType.SPACE, 5), key('.', KeyType.CHAR), key('OK', KeyType.OK, 1.5)],
];

const SYMBOLS_1 = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((l) => key(l)),
  ['@', '#', '$', '_', '&', '-', '+', '(', ')', '/'].map((l) => key(l)),
  [
    key('=/#', KeyType.SYMBOLS2, 1.5),
    ...['*', '"', "'", ':', ';', '!', '?'].map((l) => key(l)),
    key('⌫', KeyType.BACKSPACE, 1.5),
  ],
  [key('ABC', KeyType.ABC, 1.5), key(',', KeyType.CHAR), key(' ', KeyType.SPACE, 5), key('.', KeyType.CHAR), key('OK', KeyType.OK, 1.5)],
];

const SYMBOLS_2 = [
  ['~', '`', '|', '^', '=', '\\', '<', '>', '{', '}'].map((l) => key(l)),
  ['[', ']', '£', '€', '¥', '°', '©', '®', '™', '%'].map((l) => key(l)),
  [
    key('?123', KeyType.SYMBOLS, 1.5),
    ...['√', 'π', '÷', '×', '¶', '∆', '•'].map((l) => key(l)),
    key('⌫', KeyType.BACKSPACE, 1.5),
  ],
  [key('ABC', KeyType.ABC, 1.5), key(',', KeyType.CHAR), key(' ', KeyType.SPACE, 5), key('.', KeyType.CHAR), key('OK', KeyType.OK, 1.5)],
];

const NUMERIC = [
  ['1', '2', '3'].map((l) => key(l)),
  ['4', '5', '6'].map((l) => key(l)),
  ['7', '8', '9'].map((l) => key(l)),
  [key('.', KeyType.CHAR), key('0', KeyType.CHAR), key('⌫', KeyType.BACKSPACE, 10 / 14)],
];

export type KeyPressType = 
  'char' |
  'shift' |
  'backspace' |
  'symbols' |
  'space' |
  'ok' |
  'symbols2' |
  'abc';

const DOUBLE_TAP_MS = 400;

/**
 * Escapes a character/string the same way the original app does before
 * handing it to the page's `__ej.i()` function: backslashes first, then
 * single quotes. Order matters — escaping quotes first would corrupt a
 * literal backslash character (e.g. the "\" key on the Symbols 2 page).
 */
export function escapeForEj(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
 
/**
 * Builds the injectJavaScript string for one keyboard event, mirroring
 * the original app's W.w.i(String) behavior.
 *
 * Usage:
 *   const js = buildInjectedJs(output, type);
 *   webviewRef.current.injectJavaScript(js);
 */
export function buildInjectedJs(output: string, type: KeyPressType) {
  if (type === KeyType.BACKSPACE) {
    // Placeholder: unverified what the real page's __ej.i() expects for
    // backspace. A literal backspace char ('\b') is a guess, not confirmed
    // from the decompiled source (which only covers regular characters).
    return `__ej.i('\\b'); true;`;
  }
  return `__ej.i('${escapeForEj(output)}'); true;`;
}

/**
 * Props:
 *  - onKeyPress({ label, output, type }): called for every key, same shape
 *    as the onKeyPressed callback in the original t0.f.
 *  - inputType: 'text' | 'number' — if 'number', opens straight into NUMERIC.
 */
export default function Keyboard({
  onKeyPress,
  onKeyboardClose,
  inputType = 'text'
}: {
  onKeyPress: ({ label, output, type }: {
      label: string;
      output: string;
      type: KeyPressType;
  }) => void,
  onKeyboardClose: () => void,
  inputType: "text" | "number",
}) {
  const [page, setPage] = useState(inputType === 'number' ? 'numeric' : 'qwerty');
  const [shift, setShift] = useState(false); // one-shot shift
  const [capsLock, setCapsLock] = useState(false);
  const lastShiftTap = useRef(0);

  const layout =
    page === 'numeric'
      ? NUMERIC
      : page === 'symbols1'
      ? SYMBOLS_1
      : page === 'symbols2'
      ? SYMBOLS_2
      : QWERTY;

  const isUpper = shift || capsLock;

  const handlePress = useCallback(
    (k) => {
      switch (k.type) {
        case KeyType.SHIFT: {
          const now = Date.now();
          if (!capsLock && now - lastShiftTap.current < DOUBLE_TAP_MS) {
            // double-tap -> caps lock on
            setCapsLock(true);
            setShift(false);
          } else if (capsLock) {
            // tap while caps-lock is on -> turn it off
            setCapsLock(false);
            setShift(false);
          } else {
            setShift((s) => !s);
          }
          lastShiftTap.current = now;
          return;
        }
        case KeyType.SYMBOLS:
          setPage('symbols1');
          return;
        case KeyType.SYMBOLS2:
          setPage('symbols2');
          return;
        case KeyType.ABC:
          setPage('qwerty');
          return;
        case KeyType.CHAR: {
          const output = isUpper ? k.label.toUpperCase() : k.label;
          onKeyPress?.({ label: k.label, output, type: k.type });
          // one-shot shift releases after a letter, caps-lock stays on
          if (shift && !capsLock) setShift(false);
          return;
        }
        default:
          // backspace, space, OK — passed straight through
          onKeyPress?.({ label: k.label, output: k.label, type: k.type });
      }
    },
    [shift, capsLock, isUpper, onKeyPress],
  );

  return (
    <View style={styles.container}>
      {/* 24 dp keyboard handle area from the original Android keyboard. */}
      <TouchableOpacity
        onPress={onKeyboardClose}
      >
        <View style={styles.handleBar}>
          <View style={styles.handleIndicator} />
        </View>
      </TouchableOpacity>

      {layout.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {/* The Java keyboard centers the second letter row with half-key spacers. */}
          {page !== 'numeric' && ri === 1 && <View style={styles.halfKeySpacer} />}
          {row.map((k, ki) => {
            const isShiftKey = k.type === KeyType.SHIFT;
            const shiftActive = isShiftKey && isUpper;
            const isOkKey = k.type === KeyType.OK;
            const label =
              k.type === KeyType.CHAR && isUpper ? k.label.toUpperCase() : k.label;
            const displayLabel = isShiftKey ? (capsLock ? '⇧̲' : '⇧') : label;

            return (
              <TouchableOpacity
                key={ki}
                activeOpacity={0.6}
                onPress={() => handlePress(k)}
                style={[
                  styles.key,
                  { flex: k.weight },
                  k.type !== KeyType.CHAR && styles.specialKey,
                  isOkKey && styles.okKey,
                  shiftActive && styles.shiftActiveKey,
                ]}
              >
                <Text
                  style={[
                    styles.keyText,
                    k.type !== KeyType.CHAR && styles.specialKeyText,
                    isOkKey && styles.okKeyText,
                    shiftActive && styles.shiftActiveText,
                    isShiftKey && capsLock && styles.underline,
                  ]}
                  numberOfLines={1}
                >
                  {displayLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
          {page !== 'numeric' && ri === 1 && <View style={styles.halfKeySpacer} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    // Exact outer padding from the Java constructor.
    paddingHorizontal: 4,
    paddingBottom: 0,
  },
  // The Java keyboard creates a 24 dp handle row before the key rows.
  handleBar: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  // Java uses a 46 dp row. Each key is inset 2 dp horizontally
  // and 3 dp vertically inside that row.
  row: {
    height: 46,
    flexDirection: 'row',
  },
  halfKeySpacer: {
    flex: 0.5,
  },
  key: {
    flex: 1,
    marginHorizontal: 2,
    marginVertical: 3,
    borderRadius: 6,
    backgroundColor: COLORS.keyBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialKey: {
    backgroundColor: COLORS.specialBg,
  },
  okKey: {
    backgroundColor: COLORS.accentCyan,
  },
  okKeyText: {
    color: COLORS.darkText,
    fontWeight: 'bold',
  },
  shiftActiveKey: {
    backgroundColor: COLORS.accentCyan,
  },
  keyText: {
    color: COLORS.keyText,
    fontSize: 18,
  },
  specialKeyText: {
    color: COLORS.dimText,
    fontSize: 16,
  },
  shiftActiveText: {
    color: COLORS.darkText,
  },
  underline: {
    textDecorationLine: 'underline',
  },
});
