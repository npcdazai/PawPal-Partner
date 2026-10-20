import React, { useRef, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';
import { colors, radii, shadows } from '../theme/colors';

const THUMB = 26;

interface RateSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Lets the screen lock its ScrollView while the thumb is dragged. */
  onSlidingChange?: (sliding: boolean) => void;
  accessibilityLabel: string;
  accessibilityValueText?: string;
}

/**
 * A themed horizontal slider on the plain responder system, so it needs no
 * native slider module and looks the same on iOS, Android and web.
 */
export function RateSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  onSlidingChange,
  accessibilityLabel,
  accessibilityValueText,
}: RateSliderProps) {
  const [width, setWidth] = useState(0);
  const drag = useRef({ trackX: 0 });
  const fraction = Math.min(1, Math.max(0, (value - min) / (max - min)));

  const clampStep = (raw: number) => {
    const stepped = min + Math.round((raw - min) / step) * step;
    return Math.min(max, Math.max(min, Number(stepped.toFixed(2))));
  };

  const update = (pageX: number) => {
    if (!width) return;
    const ratio = Math.min(1, Math.max(0, (pageX - drag.current.trackX) / width));
    const next = clampStep(min + ratio * (max - min));
    if (next !== value) onChange(next);
  };

  const onGrant = (event: GestureResponderEvent) => {
    // Children ignore touches, so locationX is measured from the track's left edge.
    drag.current.trackX = event.nativeEvent.pageX - event.nativeEvent.locationX;
    onSlidingChange?.(true);
    update(event.nativeEvent.pageX);
  };

  const end = () => onSlidingChange?.(false);

  return (
    <View
      style={styles.hitArea}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={onGrant}
      onResponderMove={(event) => update(event.nativeEvent.pageX)}
      onResponderRelease={end}
      onResponderTerminate={end}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value, text: accessibilityValueText }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        const delta = event.nativeEvent.actionName === 'increment' ? step : -step;
        onChange(clampStep(value + delta));
      }}
    >
      <View pointerEvents="none" style={styles.track}>
        <View style={[styles.fill, { width: `${fraction * 100}%` }]} />
      </View>
      <View pointerEvents="none" style={[styles.thumb, { left: fraction * width - THUMB / 2 }]}>
        <View style={styles.thumbDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    height: 40,
    justifyContent: 'center',
    marginHorizontal: THUMB / 2,
    cursor: 'pointer',
    userSelect: 'none',
  },
  track: {
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  thumb: {
    position: 'absolute',
    top: (40 - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.primary,
  },
  thumbDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
});
