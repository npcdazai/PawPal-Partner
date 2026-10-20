import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '../components/AppBar';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/Button';
import { Card, SectionTitle } from '../components/Card';
import { FormField } from '../components/FormField';
import { Icon } from '../components/Icon';
import { StepHeader } from '../components/StepHeader';
import { Toast, useToast } from '../components/Toast';
import { useMascotActions } from '../mascot/MascotProvider';
import { usePartnerNavigation } from '../navigation/usePartnerNavigation';
import { usePartner, usePartnerActions, usePartnerTotals } from '../partner/PartnerProvider';
import { colors, radii, shadows } from '../theme/colors';
import { fonts, typography } from '../theme/typography';
import { NATIVE_DRIVER } from '../theme/motion';

const OTP_LENGTH = 4;
const RESEND_S = 30;
const OTP_CHECK_MS = 700;
/** Simulated document upload: front, back, then the issuer check. */
const ID_STEPS_MS = [650, 1300, 1900];
const SELFIE_SCAN_MS = 1000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const digitsOf = (value: string) => value.replace(/\D/g, '');

type OtpStage = 'idle' | 'sent' | 'checking';
type IdStage = 'idle' | 'front' | 'back' | 'checking';
/** Blocks the CTA scrolls back to when something is still missing. */
type Anchor = 'details' | 'id' | 'selfie' | 'consent';

/** REGISTER_KYC: basic details, OTP, government ID, live selfie and consent. */
export function KycScreen() {
  const insets = useSafeAreaInsets();
  const { profile, kyc } = usePartner();
  const { kycDone } = usePartnerTotals();
  const { updateProfile, updateKyc } = usePartnerActions();
  const { barkWith, focusField, blurField, setScanning } = useMascotActions();
  const nav = usePartnerNavigation();
  const toast = useToast();

  const [otpStage, setOtpStage] = useState<OtpStage>('idle');
  const [otp, setOtp] = useState('');
  const [resendLeft, setResendLeft] = useState(0);
  const [idStage, setIdStage] = useState<IdStage>('idle');
  const [scanning, setScanningLocal] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const anchors = useRef<Record<Anchor, number>>({ details: 0, id: 0, selfie: 0, consent: 0 });
  const recordAnchor = (anchor: Anchor, event: LayoutChangeEvent) => {
    anchors.current[anchor] = event.nativeEvent.layout.y;
  };

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      setScanning(false);
    };
  }, [setScanning]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  // Resend countdown while a code is out.
  useEffect(() => {
    if (otpStage !== 'sent') return undefined;
    const timer = setInterval(() => setResendLeft((left) => Math.max(0, left - 1)), 1000);
    return () => clearInterval(timer);
  }, [otpStage]);

  const phoneValid = digitsOf(profile.phone).length >= 10;
  const emailValid = EMAIL_RE.test(profile.email.trim());
  const nameValid = profile.name.trim().split(/\s+/).length >= 2;

  const sendOtp = () => {
    if (!phoneValid) {
      toast.show('Enter a 10-digit mobile number first');
      return;
    }
    setOtp('');
    setResendLeft(RESEND_S);
    setOtpStage('sent');
    toast.show(`📲 Code sent to ${profile.phone}`);
  };

  const enterOtp = (value: string) => {
    const code = digitsOf(value).slice(0, OTP_LENGTH);
    setOtp(code);
    if (code.length < OTP_LENGTH) return;
    setOtpStage('checking');
    Keyboard.dismiss();
    later(() => {
      setOtpStage('idle');
      updateKyc({ otpVerified: true });
      barkWith('Woof! Number verified 📱');
    }, OTP_CHECK_MS);
  };

  const uploadId = () => {
    if (idStage !== 'idle') return;
    updateKyc({ idVerified: false });
    setIdStage('front');
    later(() => setIdStage('back'), ID_STEPS_MS[0]);
    later(() => setIdStage('checking'), ID_STEPS_MS[1]);
    later(() => {
      setIdStage('idle');
      updateKyc({ idVerified: true });
      barkWith('Woof! ID verified 🪪');
    }, ID_STEPS_MS[2]);
  };

  const scanSelfie = () => {
    if (scanning || kyc.selfieMatched) return;
    setScanningLocal(true);
    setScanning(true);
    later(() => {
      setScanningLocal(false);
      setScanning(false);
      updateKyc({ selfieMatched: true });
      barkWith('Woof! Face matched 🤳');
    }, SELFIE_SCAN_MS);
  };

  const missing = ((): { message: string; anchor: Anchor } | null => {
    if (!nameValid) return { message: 'Enter your full legal name (first & last)', anchor: 'details' };
    if (!kyc.otpVerified) return { message: 'Verify your mobile number with the OTP', anchor: 'details' };
    if (!emailValid) return { message: 'Enter a valid email address', anchor: 'details' };
    if (!kyc.idVerified) return { message: 'Upload your government ID', anchor: 'id' };
    if (!kyc.selfieMatched) return { message: 'Take your live selfie', anchor: 'selfie' };
    if (!kyc.consent) return { message: 'Tick the safety-check consent', anchor: 'consent' };
    return null;
  })();

  const onContinue = () => {
    if (missing) {
      toast.show(missing.message);
      scrollRef.current?.scrollTo({ y: Math.max(0, anchors.current[missing.anchor] - 12), animated: true });
      return;
    }
    nav.toCareProfile();
  };

  const textFocus = { onFocus: () => focusField('text'), onBlur: blurField };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppBar
        title="Registration • Account & KYC"
        onBack={nav.back}
        trailing={<Badge label={`${kycDone}/4`} tone={kycDone === 4 ? 'success' : 'primary'} />}
      />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StepHeader
          badge="STEP 1 OF 2 • IDENTITY & TRUST"
          title="Verify Your Identity"
          subtitle="Fast, secure checks that keep every pup safe."
          progress={0.25 + (0.25 * kycDone) / 4}
        />

        <Card onLayout={(event) => recordAnchor('details', event)}>
          <SectionTitle title="👤 Your Basic Details" accessory={<Badge label="Required" />} />
          <FormField
            label="Full Legal Name"
            icon="badge"
            value={profile.name}
            onChangeText={(name) => updateProfile({ name })}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            placeholder="First & last name"
            complete={nameValid}
            {...textFocus}
          />
          <FormField
            label="Mobile Number"
            icon="phone-iphone"
            value={profile.phone}
            onChangeText={(phone) => {
              updateProfile({ phone });
              if (kyc.otpVerified) updateKyc({ otpVerified: false });
              if (otpStage !== 'idle') setOtpStage('idle');
            }}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            placeholder="+1 (555) 000-0000"
            accessory={kyc.otpVerified ? <Badge label="✓ OTP Verified" tone="success" /> : null}
            trailing={
              kyc.otpVerified ? (
                <Icon name="lock" size={20} color={colors.success} />
              ) : otpStage === 'idle' ? (
                <Pressable
                  onPress={sendOtp}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.sendOtp, pressed && styles.pressed]}
                >
                  <Text style={styles.sendOtpText}>Send OTP</Text>
                </Pressable>
              ) : null
            }
            {...textFocus}
          />
          {otpStage !== 'idle' && !kyc.otpVerified ? (
            <View style={styles.otpBox}>
              <Text style={styles.otpLabel}>Enter the 4-digit code sent to {profile.phone}</Text>
              <TextInput
                value={otp}
                onChangeText={enterOtp}
                editable={otpStage === 'sent'}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                maxLength={OTP_LENGTH}
                autoFocus
                placeholder="• • • •"
                placeholderTextColor={colors.placeholder}
                accessibilityLabel="One-time code"
                style={styles.otpInput}
                {...textFocus}
              />
              <View style={styles.otpFooter}>
                <Text style={styles.otpHint}>
                  {otpStage === 'checking' ? 'Verifying…' : 'Demo build: any 4 digits verifies'}
                </Text>
                {resendLeft > 0 ? (
                  <Text style={styles.otpHint}>Resend in 0:{resendLeft.toString().padStart(2, '0')}</Text>
                ) : (
                  <Pressable onPress={sendOtp} accessibilityRole="button" hitSlop={8}>
                    <Text style={styles.resend}>Resend code</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ) : null}
          <FormField
            label="Email Address"
            icon="mail-outline"
            value={profile.email}
            onChangeText={(email) => updateProfile({ email })}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            placeholder="you@example.com"
            complete={emailValid}
            {...textFocus}
          />
        </Card>

        <SectionTitle
          title="Identity Documents"
          accessory={
            <View style={styles.encrypted}>
              <Icon name="shield" size={14} color={colors.primary} />
              <Text style={styles.encryptedText}>Encrypted</Text>
            </View>
          }
          style={styles.sectionGap}
        />

        <View onLayout={(event) => recordAnchor('id', event)}>
          <GovernmentIdCard stage={idStage} verified={kyc.idVerified} onUpload={uploadId} />
        </View>
        <View onLayout={(event) => recordAnchor('selfie', event)}>
          <SelfieCard scanning={scanning} matched={kyc.selfieMatched} onScan={scanSelfie} />
        </View>

        <Pressable
          onLayout={(event) => recordAnchor('consent', event)}
          onPress={() => updateKyc({ consent: !kyc.consent })}
          role="checkbox"
          aria-checked={kyc.consent}
          style={({ pressed }) => [styles.consent, kyc.consent && styles.consentOn, pressed && styles.pressed]}
        >
          <View style={[styles.checkbox, kyc.consent && styles.checkboxOn]}>
            {kyc.consent ? <Icon name="check" size={16} color={colors.onPrimary} /> : null}
          </View>
          <View style={styles.flex}>
            <Text style={styles.consentTitle}>🛡️ Pet-Safe Community Guarantee</Text>
            <Text style={styles.consentText}>
              I consent to instant criminal & pet-safety verification (100% Free)
            </Text>
          </View>
        </Pressable>

        <PrimaryButton
          label="Continue to Care Profile"
          onPress={onContinue}
          style={missing ? styles.ctaPending : null}
        />
        <View style={styles.secure}>
          <Icon name="lock-outline" size={14} color={colors.slate} />
          <Text style={styles.secureText}>256-bit encrypted • Documents are never shared with pet owners</Text>
        </View>
      </ScrollView>
      <Toast message={toast.message} />
    </View>
  );
}

function GovernmentIdCard({ stage, verified, onUpload }: { stage: IdStage; verified: boolean; onUpload: () => void }) {
  const busy = stage !== 'idle';
  const status = { idle: '', front: 'Uploading front…', back: 'Uploading back…', checking: 'Verifying with issuer…' }[stage];
  const progress = { idle: 0, front: 0.33, back: 0.66, checking: 0.9 }[stage];

  return (
    <Pressable
      onPress={onUpload}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={verified ? 'Government ID verified. Tap to re-upload' : 'Upload government ID'}
      style={({ pressed }) => [styles.docCard, verified && styles.docVerified, pressed && styles.pressed]}
    >
      <View style={styles.docHead}>
        <View style={[styles.docIcon, { backgroundColor: verified ? colors.successTint : colors.stage }]}>
          <Text style={styles.docEmoji}>🪪</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.docTitle}>Government Photo ID</Text>
          <Text style={styles.docDetail}>Driver&apos;s License • Passport • State ID</Text>
          {verified ? <Badge label="✓ ID Verified" tone="success" style={styles.docBadge} /> : null}
        </View>
      </View>

      {verified ? (
        <View style={styles.idRow}>
          <IdThumb side="Front" />
          <IdThumb side="Back" />
          <View style={styles.flex}>
            <Text style={styles.idName} numberOfLines={1}>
              Driver&apos;s License •••• 7731
            </Text>
            <Text style={styles.docDetail}>Validated via secure ID check</Text>
          </View>
          <Icon name="autorenew" size={20} color={colors.slate} />
        </View>
      ) : busy ? (
        <View style={styles.uploading}>
          <Text style={styles.uploadingText}>{status}</Text>
          <View style={styles.uploadTrack}>
            <View style={[styles.uploadFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      ) : (
        <View style={styles.dropZone}>
          <Icon name="cloud-upload" size={22} color={colors.primary} />
          <Text style={styles.dropText}>Tap to Upload Front & Back</Text>
        </View>
      )}
    </Pressable>
  );
}

function IdThumb({ side }: { side: string }) {
  return (
    <View style={styles.thumb}>
      <View style={styles.thumbPhoto} />
      <View style={styles.thumbLines}>
        <View style={styles.thumbLine} />
        <View style={[styles.thumbLine, { width: '60%' }]} />
      </View>
      <Text style={styles.thumbLabel}>{side}</Text>
    </View>
  );
}

function SelfieCard({ scanning, matched, onScan }: { scanning: boolean; matched: boolean; onScan: () => void }) {
  const [sweep] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!scanning) return undefined;
    sweep.setValue(0);
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: NATIVE_DRIVER,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [scanning, sweep]);

  const translateY = useMemo(() => sweep.interpolate({ inputRange: [0, 1], outputRange: [-26, 26] }), [sweep]);

  return (
    <Pressable
      onPress={onScan}
      disabled={scanning || matched}
      accessibilityRole="button"
      accessibilityLabel={matched ? 'Face matched with ID' : 'Start live selfie scan'}
      style={({ pressed }) => [styles.selfie, matched && styles.selfieMatched, pressed && styles.pressed]}
    >
      <View style={[styles.selfieLens, matched && { borderColor: colors.success }]}>
        <Text style={styles.selfieEmoji}>{matched ? '😊' : '🤳'}</Text>
        {scanning ? (
          <Animated.View pointerEvents="none" style={[styles.scanLine, { transform: [{ translateY }] }]} />
        ) : null}
      </View>
      <Text style={styles.selfieTitle}>Live Selfie Match</Text>
      <Text style={styles.selfieText}>
        {scanning
          ? 'Hold still — scanning your face…'
          : matched
            ? 'Liveness confirmed against your ID photo'
            : 'Quick 1-second face scan to confirm it’s really you'}
      </Text>
      {matched ? (
        <View style={styles.matchPill}>
          <Icon name="verified-user" size={16} color={colors.successInk} />
          <Text style={styles.matchText}>✓ Face Matched with ID • 99.4%</Text>
        </View>
      ) : (
        <View style={styles.scanPill}>
          <Text style={styles.scanText}>{scanning ? 'Scanning…' : 'Tap to Start Scan'}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 4,
    gap: 16,
  },
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  sectionGap: {
    marginTop: 4,
    paddingHorizontal: 4,
  },
  sendOtp: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  sendOtpText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.onPrimary,
  },
  otpBox: {
    gap: 10,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.primaryTint,
  },
  otpLabel: {
    ...typography.label,
  },
  otpInput: {
    height: 52,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.card,
    textAlign: 'center',
    fontFamily: fonts.extrabold,
    fontSize: 24,
    letterSpacing: 14,
    color: colors.ink,
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  otpFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otpHint: {
    ...typography.bodySm,
  },
  resend: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primary,
  },
  encrypted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  encryptedText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.slate,
  },
  docCard: {
    gap: 14,
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    ...shadows.card,
  },
  docVerified: {
    borderColor: colors.success,
    borderLeftWidth: 5,
  },
  docHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docEmoji: {
    fontSize: 22,
  },
  docTitle: {
    ...typography.subhead,
    fontSize: 16,
  },
  docDetail: {
    ...typography.bodySm,
  },
  docBadge: {
    marginTop: 6,
  },
  dropZone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.input,
  },
  dropText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.primary,
  },
  uploading: {
    gap: 8,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.input,
  },
  uploadingText: {
    ...typography.label,
    color: colors.primary,
  },
  uploadTrack: {
    height: 6,
    borderRadius: radii.full,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  uploadFill: {
    height: '100%',
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: radii.md,
    backgroundColor: colors.input,
  },
  idName: {
    ...typography.label,
  },
  thumb: {
    width: 62,
    height: 42,
    flexDirection: 'row',
    gap: 4,
    padding: 5,
    borderRadius: 8,
    backgroundColor: '#DCE6FF',
    overflow: 'hidden',
  },
  thumbPhoto: {
    width: 14,
    height: 18,
    borderRadius: 3,
    backgroundColor: '#9FB5F0',
  },
  thumbLines: {
    flex: 1,
    gap: 3,
    paddingTop: 2,
  },
  thumbLine: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#B7C8F5',
  },
  thumbLabel: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    paddingHorizontal: 5,
    borderTopLeftRadius: 6,
    backgroundColor: 'rgba(24, 26, 32, 0.65)',
    fontFamily: fonts.bold,
    fontSize: 9,
    lineHeight: 13,
    color: colors.onPrimary,
  },
  selfie: {
    alignItems: 'center',
    gap: 6,
    padding: 18,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  selfieMatched: {
    borderStyle: 'solid',
    borderColor: colors.success,
    backgroundColor: colors.successTint,
  },
  selfieLens: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: 'hidden',
    ...shadows.soft,
  },
  selfieEmoji: {
    fontSize: 30,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
    boxShadow: '0px 0px 8px rgba(41, 98, 255, 0.8)',
  },
  selfieTitle: {
    ...typography.subhead,
    fontSize: 16,
    marginTop: 4,
  },
  selfieText: {
    ...typography.bodySm,
    textAlign: 'center',
  },
  scanPill: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.card,
  },
  scanText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primary,
  },
  matchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.card,
  },
  matchText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.successInk,
  },
  consent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: colors.stage,
    borderWidth: 1.5,
    borderColor: colors.stage,
  },
  consentOn: {
    borderColor: colors.success,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.placeholder,
    backgroundColor: colors.card,
  },
  checkboxOn: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  consentTitle: {
    ...typography.subhead,
  },
  consentText: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  ctaPending: {
    opacity: 0.75,
  },
  secure: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secureText: {
    ...typography.bodySm,
    fontSize: 11,
  },
});
