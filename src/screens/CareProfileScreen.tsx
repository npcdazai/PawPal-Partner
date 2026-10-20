import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '../components/AppBar';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/Button';
import { Card, SectionTitle } from '../components/Card';
import { Chip } from '../components/Chip';
import { Icon } from '../components/Icon';
import { StepHeader } from '../components/StepHeader';
import { Toast, useToast } from '../components/Toast';
import { useMascotActions } from '../mascot/MascotProvider';
import { PHYSICS } from '../mascot/mascotModel';
import { usePartnerNavigation } from '../navigation/usePartnerNavigation';
import { RatesEditor } from '../partner/RatesEditor';
import { BIO_LIMIT, ROLES, SIZES, SKILLS } from '../partner/partnerModel';
import { usePartner, usePartnerActions } from '../partner/PartnerProvider';
import { colors, radii, shadows } from '../theme/colors';
import { fonts, typography } from '../theme/typography';

const MIN_BIO = 20;

/** REGISTER_PROFILE: bio, services, dog sizes, skills, rates and radius. */
export function CareProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, care } = usePartner();
  const { updateProfile, toggleRole, toggleSize, toggleSkill, completeRegistration } = usePartnerActions();
  const { setWagFps, focusField, blurField } = useMascotActions();
  const nav = usePartnerNavigation();
  const toast = useToast();
  const [sliding, setSliding] = useState(false);

  // Every selection makes Barnaby's tail wag a little faster (8 → 18 fps).
  const selections = care.roles.length + care.sizes.length + care.skills.length;
  useEffect(() => {
    setWagFps(PHYSICS.idleFps + selections);
  }, [selections, setWagFps]);
  useEffect(() => () => setWagFps(PHYSICS.idleFps), [setWagFps]);

  const checks = [care.roles.length > 0, care.sizes.length > 0, profile.bio.trim().length >= MIN_BIO];
  const progress = 0.5 + (0.5 * checks.filter(Boolean).length) / checks.length;

  const onComplete = () => {
    if (!checks[0]) return toast.show('Pick at least one service you offer');
    if (!checks[1]) return toast.show('Pick the dog sizes you can handle');
    if (!checks[2]) return toast.show(`Tell owners about yourself (${MIN_BIO}+ characters)`);
    completeRegistration();
    nav.toDashboard();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppBar title="Registration • Care Profile" onBack={nav.back} />
      <ScrollView
        scrollEnabled={!sliding}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StepHeader
          badge="STEP 2 OF 2 • CARE PROFILE"
          title="Build Your Care Profile"
          subtitle="Services, badges & sweet payout rates."
          progress={progress}
        />

        <Card>
          <View style={styles.person}>
            <View>
              <Avatar initials="AR" tint={colors.primaryTint} ink={colors.primary} size={68} style={styles.avatar} />
              <View style={styles.avatarBadge}>
                <Icon name="verified" size={16} color={colors.primary} />
              </View>
            </View>
            <View style={styles.flex}>
              <Text style={styles.name}>{profile.name || 'Your name'}</Text>
              <Text style={styles.role}>Trusted Neighbor & Companion</Text>
              <Text style={styles.ready}>⚡ Ready for instant booking</Text>
            </View>
          </View>
          <View style={styles.bioHead}>
            <Text style={styles.label}>Caregiver Bio & Experience</Text>
            <Text style={styles.counter}>
              {profile.bio.length}/{BIO_LIMIT}
            </Text>
          </View>
          <TextInput
            value={profile.bio}
            onChangeText={(bio) => updateProfile({ bio })}
            onFocus={() => focusField('text')}
            onBlur={blurField}
            multiline
            maxLength={BIO_LIMIT}
            placeholder="5+ years caring for Corgis, Retrievers & senior pups..."
            placeholderTextColor={colors.placeholder}
            accessibilityLabel="Caregiver bio"
            style={styles.bio}
          />
        </Card>

        <SectionTitle
          title="Select Your Services"
          accessory={<Text style={styles.active}>{care.roles.length} Active</Text>}
          style={styles.sectionGap}
        />
        {ROLES.map((role) => {
          const on = care.roles.includes(role.key);
          return (
            <Pressable
              key={role.key}
              onPress={() => toggleRole(role.key)}
              role="checkbox"
              aria-checked={on}
              aria-label={role.title}
              style={({ pressed }) => [styles.roleCard, on && styles.roleOn, pressed && styles.pressed]}
            >
              <View style={[styles.roleIcon, on && { backgroundColor: colors.primary }]}>
                <Text style={styles.roleEmoji}>{role.emoji}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDetail}>{role.detail}</Text>
                <View style={[styles.roleTag, on && styles.roleTagOn]}>
                  <Text style={[styles.roleTagText, on && { color: colors.coralInk }]}>{role.tag}</Text>
                </View>
              </View>
              <Icon
                name={on ? 'check-circle' : 'radio-button-unchecked'}
                size={24}
                color={on ? colors.primary : colors.placeholder}
              />
            </Pressable>
          );
        })}

        <Card>
          <SectionTitle title="Accepted Dog Sizes" accessory={<Text style={styles.hint}>Multi-choice</Text>} />
          <View style={styles.chips}>
            {SIZES.map((size) => (
              <Chip
                key={size.key}
                label={size.label}
                selected={care.sizes.includes(size.key)}
                onPress={() => toggleSize(size.key)}
              />
            ))}
          </View>
          {care.sizes.includes('medium') ? (
            <View style={styles.match}>
              <Text style={styles.matchText}>🐾 Barnaby is a Medium boy (12.5kg) — perfect match!</Text>
            </View>
          ) : null}
          <SectionTitle title="Specialized Care & Skills" style={styles.subSection} />
          <View style={styles.chips}>
            {SKILLS.map((skill) => (
              <Chip
                key={skill.key}
                label={skill.label}
                selected={care.skills.includes(skill.key)}
                onPress={() => toggleSkill(skill.key)}
              />
            ))}
          </View>
        </Card>

        <Card>
          <SectionTitle title="Rates & Service Radius" accessory={<Badge label="Live Calculator" />} />
          <RatesEditor onSlidingChange={setSliding} />
        </Card>

        <PrimaryButton label="Complete Registration & Go Online" onPress={onComplete} />
        <View style={styles.secure}>
          <Icon name="verified-user" size={14} color={colors.slate} />
          <Text style={styles.secureText}>Protected by the PawPal Satisfaction & Liability Guarantee</Text>
        </View>
      </ScrollView>
      <Toast message={toast.message} />
    </View>
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
    transform: [{ scale: 0.99 }],
  },
  sectionGap: {
    marginTop: 4,
    paddingHorizontal: 4,
  },
  subSection: {
    marginTop: 6,
  },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    ...shadows.soft,
  },
  name: {
    ...typography.headline,
  },
  role: {
    ...typography.body,
    fontSize: 13,
  },
  ready: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.coralInk,
    marginTop: 2,
  },
  bioHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.label,
  },
  counter: {
    ...typography.bodySm,
  },
  bio: {
    minHeight: 92,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    backgroundColor: colors.input,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
    textAlignVertical: 'top',
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  active: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primary,
  },
  hint: {
    ...typography.bodySm,
    fontFamily: fonts.semibold,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    backgroundColor: colors.card,
    ...shadows.card,
  },
  roleOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.stage,
  },
  roleEmoji: {
    fontSize: 24,
  },
  roleTitle: {
    ...typography.subhead,
    fontSize: 16,
  },
  roleDetail: {
    ...typography.bodySm,
    marginTop: 2,
  },
  roleTag: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: colors.track,
  },
  roleTagOn: {
    backgroundColor: colors.coralTint,
  },
  roleTagText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 15,
    color: colors.slate,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  match: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.amberTint,
  },
  matchText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.amberInk,
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
