import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Chip } from '../components/Chip';
import { RateSlider } from '../components/RateSlider';
import { Stepper } from '../components/Stepper';
import { useMascotActions } from '../mascot/MascotProvider';
import { colors, radii } from '../theme/colors';
import { fonts, typography } from '../theme/typography';
import { money, shortMoney } from './format';
import { AVAILABILITY, HOURLY_RATE, PARTNER_SHARE, RADIUS_KM, WALK_RATE } from './partnerModel';
import { usePartner, usePartnerActions } from './PartnerProvider';

interface RatesEditorProps {
  onSlidingChange?: (sliding: boolean) => void;
  /** Profile & Bank also edits the hours you take bookings. */
  showAvailability?: boolean;
}

/**
 * 45-min walk rate with the live 85% net payout, hourly sitting rate and
 * service radius. Dragging the rate makes Barnaby tilt his head.
 */
export function RatesEditor({ onSlidingChange, showAvailability = false }: RatesEditorProps) {
  const { care } = usePartner();
  const { setWalkRate, setHourlyRate, setRadiusKm, toggleAvailability } = usePartnerActions();
  const { glance } = useMascotActions();
  const net = care.walkRate * PARTNER_SHARE;

  return (
    <View style={styles.editor}>
      <View style={styles.rateBox}>
        <View style={styles.rateHead}>
          <View style={styles.flex}>
            <Text style={styles.rateLabel}>Base 45-Min Walk Rate</Text>
            <Text style={styles.rateHint}>
              Recommended: {shortMoney(WALK_RATE.recommended[0])} – {shortMoney(WALK_RATE.recommended[1])}
            </Text>
          </View>
          <Text style={styles.rateValue}>
            {shortMoney(care.walkRate)}
            <Text style={styles.rateUnit}> /walk</Text>
          </Text>
        </View>
        <RateSlider
          value={care.walkRate}
          min={WALK_RATE.min}
          max={WALK_RATE.max}
          step={WALK_RATE.step}
          onChange={(rate) => {
            setWalkRate(rate);
            glance();
          }}
          onSlidingChange={onSlidingChange}
          accessibilityLabel="45-minute walk rate"
          accessibilityValueText={`${shortMoney(care.walkRate)} per walk`}
        />
        <View style={styles.scale}>
          <Text style={styles.scaleText}>{shortMoney(WALK_RATE.min)}</Text>
          <Text style={styles.scaleText}>{shortMoney(WALK_RATE.max)}</Text>
        </View>
        <View style={styles.net}>
          <Text style={styles.netText}>
            💚 You keep <Text style={styles.netAmount}>{money(net)}</Text> net payout (85%)
          </Text>
        </View>
      </View>

      <View style={styles.steppers}>
        <Stepper
          label="Hourly Sitting"
          hint="Drop-ins, daycare & overnights"
          value={care.hourlyRate}
          min={HOURLY_RATE.min}
          max={HOURLY_RATE.max}
          step={HOURLY_RATE.step}
          format={(rate) => `${shortMoney(rate)}/hr`}
          onChange={setHourlyRate}
        />
        <Stepper
          label="Service Radius"
          hint={`📍 Within ${care.radiusKm.toFixed(1)} km of Home`}
          value={care.radiusKm}
          min={RADIUS_KM.min}
          max={RADIUS_KM.max}
          step={RADIUS_KM.step}
          format={(km) => `${km.toFixed(1)} km`}
          onChange={setRadiusKm}
        />
      </View>

      {showAvailability ? (
        <View style={styles.availability}>
          <Text style={styles.rateLabel}>Availability Hours</Text>
          <View style={styles.chips}>
            {AVAILABILITY.map((slot) => (
              <Chip
                key={slot.key}
                label={slot.label}
                selected={care.availability.includes(slot.key)}
                onPress={() => toggleAvailability(slot.key)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  editor: {
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  rateBox: {
    gap: 6,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.input,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
  },
  rateHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rateLabel: {
    ...typography.label,
    fontSize: 14,
  },
  rateHint: {
    ...typography.bodySm,
  },
  rateValue: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
    color: colors.primary,
  },
  rateUnit: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.slate,
    letterSpacing: 0,
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  scaleText: {
    ...typography.bodySm,
    fontSize: 11,
  },
  net: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.successTint,
  },
  netText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.successInk,
  },
  netAmount: {
    fontFamily: fonts.extrabold,
    color: colors.successInk,
  },
  steppers: {
    gap: 10,
  },
  availability: {
    gap: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
