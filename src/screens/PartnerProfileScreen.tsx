import React, { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { BOTTOM_NAV_HEIGHT } from '../components/BottomNavigation';
import { Card, SectionTitle } from '../components/Card';
import { FormField } from '../components/FormField';
import { Icon } from '../components/Icon';
import { PageTitle } from '../components/PageTitle';
import { Toast, useToast } from '../components/Toast';
import { Toggle } from '../components/Toggle';
import { MascotDockSlot } from '../mascot/MascotDockSlot';
import { useMascotActions } from '../mascot/MascotProvider';
import { usePartnerNavigation } from '../navigation/usePartnerNavigation';
import { maskAccount, shortMoney } from '../partner/format';
import { REFERRAL_CODE } from '../partner/partnerModel';
import { usePartner, usePartnerActions, usePartnerTotals } from '../partner/PartnerProvider';
import { RatesEditor } from '../partner/RatesEditor';
import { colors, radii, shadows } from '../theme/colors';
import { fonts, typography } from '../theme/typography';

type MenuKey = 'rates' | 'kyc' | 'tax' | 'safety' | 'support';

/** Lifetime walks before this week's. */
const PAST_WALKS = 104;

/** PARTNER_PROFILE_SETTINGS: who you are, where your money goes, and the rest. */
export function PartnerProfileScreen() {
  const insets = useSafeAreaInsets();
  const partner = usePartner();
  const totals = usePartnerTotals();
  const { setPrimaryBank, setAutoTransfer, logout } = usePartnerActions();
  const { barkWith } = useMascotActions();
  const nav = usePartnerNavigation();
  const toast = useToast();
  const [open, setOpen] = useState<MenuKey | null>(null);
  const [addingBank, setAddingBank] = useState(false);
  const [sliding, setSliding] = useState(false);

  const { care, profile } = partner;
  const toggleMenu = (key: MenuKey) => setOpen((current) => (current === key ? null : key));

  const copyReferral = async () => {
    try {
      await Clipboard.setStringAsync(REFERRAL_CODE);
      barkWith('Woof! Code copied 🎁');
      toast.show(`🎁 Code ${REFERRAL_CODE} copied — share it to earn $50`);
    } catch {
      toast.show(`Your referral code: ${REFERRAL_CODE}`);
    }
  };

  const bottomPad = BOTTOM_NAV_HEIGHT + Math.max(insets.bottom, 12) + 28;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        scrollEnabled={!sliding}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PageTitle title="Profile & Bank" />

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Avatar initials="AR" tint={colors.primaryTint} ink={colors.primary} size={64} style={styles.avatar} />
              <View style={styles.avatarBadge}>
                <Icon name="verified" size={15} color={colors.primary} />
              </View>
            </View>
            <View style={styles.flex}>
              <Text style={styles.name} numberOfLines={1}>
                {profile.name}
              </Text>
              <Text style={styles.verifiedRole}>Verified Dog Walker & Caretaker ✓</Text>
              <Text style={styles.stats}>
                ⭐ {partner.rating.toFixed(2)} • {PAST_WALKS + totals.walks} Walks • Joined 2026
              </Text>
            </View>
            <MascotDockSlot variant="compact-dock" />
          </View>
          <View style={styles.status}>
            <Text style={styles.statusText}>🏅 Top Walker Status: 100% On-Time</Text>
            <Text style={styles.statusLevel}>Level 4</Text>
          </View>
        </View>

        <Card>
          <SectionTitle
            title="🏦 Manage Bank Accounts & Payouts"
            accessory={
              <Pressable
                onPress={() => setAddingBank((on) => !on)}
                accessibilityRole="button"
                hitSlop={8}
                style={({ pressed }) => [styles.addBank, pressed && styles.pressed]}
              >
                <Text style={styles.addBankText}>{addingBank ? 'Close' : '+ Add Bank'}</Text>
              </Pressable>
            }
          />

          {addingBank ? (
            <AddBankForm
              onSaved={(name, last4) => {
                setAddingBank(false);
                barkWith('Woof! Bank linked 🏦');
                toast.show(`🏦 ${name} ${maskAccount(last4)} linked`);
              }}
              onError={toast.show}
            />
          ) : null}

          {partner.banks.map((bank) => {
            const primary = bank.id === partner.primaryBankId;
            return (
              <Pressable
                key={bank.id}
                onPress={() => {
                  if (primary) return;
                  setPrimaryBank(bank.id);
                  toast.show(`⭐ ${bank.name} is now your primary payout account`);
                }}
                role="radio"
                aria-checked={primary}
                aria-label={`${bank.name} ${maskAccount(bank.last4)}`}
                style={({ pressed }) => [styles.bank, primary && styles.bankPrimary, pressed && styles.pressed]}
              >
                <View style={styles.bankIcon}>
                  <Icon name={bank.id === 'upi' ? 'credit-card' : 'account-balance'} size={22} color={colors.primary} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.bankName} numberOfLines={2}>
                    {bank.name}
                  </Text>
                  <Text style={styles.bankMask}>{maskAccount(bank.last4)}</Text>
                  {primary ? <Text style={styles.bankReady}>● Primary • Instant Payout Ready</Text> : null}
                </View>
                {primary ? (
                  <View style={styles.primaryPill}>
                    <Text style={styles.primaryPillText}>Primary</Text>
                  </View>
                ) : (
                  <View style={styles.setPrimary}>
                    <Text style={styles.setPrimaryText}>Set as Primary</Text>
                  </View>
                )}
              </Pressable>
            );
          })}

          <View style={styles.autoRow}>
            <View style={styles.flex}>
              <Text style={styles.autoTitle}>📅 Weekly Free Auto-Transfer (Every Monday)</Text>
              <Text style={styles.autoText}>
                {partner.autoTransfer && totals.primaryBank
                  ? `To ${totals.primaryBank.name} ${maskAccount(totals.primaryBank.last4)}`
                  : 'Off — cash out manually anytime'}
              </Text>
            </View>
            <Toggle
              value={partner.autoTransfer}
              onValueChange={setAutoTransfer}
              accessibilityLabel="Weekly free auto-transfer"
            />
          </View>
        </Card>

        <Card style={styles.menu}>
          <Text style={styles.menuHeading}>PREFERENCES & SAFETY</Text>

          <MenuRow
            emoji="🦮"
            title="Service Rates & Availability Hours"
            detail={`${shortMoney(care.walkRate)}/walk • ${care.radiusKm.toFixed(1)} km radius`}
            open={open === 'rates'}
            onPress={() => toggleMenu('rates')}
          >
            <RatesEditor onSlidingChange={setSliding} showAvailability />
          </MenuRow>

          <MenuRow
            emoji="🪪"
            title="Identity & KYC"
            detail="Government ID, selfie & background check"
            badge={
              totals.kycComplete ? (
                <Badge label="All 3 Verified ✓" tone="success" />
              ) : (
                <Badge label="Pending" tone="amber" />
              )
            }
            open={open === 'kyc'}
            onPress={() => toggleMenu('kyc')}
          >
            <CheckLine done={partner.kyc.idVerified} text="Government photo ID" />
            <CheckLine done={partner.kyc.selfieMatched} text="Live selfie matched with ID" />
            <CheckLine done={partner.kyc.consent} text="Criminal & pet-safety background check" />
          </MenuRow>

          <MenuRow
            emoji="📄"
            title="Tax Documents (1099 / GST)"
            detail="2026 statement ready for download"
            open={open === 'tax'}
            onPress={() => toggleMenu('tax')}
          >
            <Pressable
              onPress={() => toast.show('📄 2026 tax statement saved to Downloads')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.inlineButton, pressed && styles.pressed]}
            >
              <Icon name="file-download" size={18} color={colors.primary} />
              <Text style={styles.inlineButtonText}>Download 2026 PDF</Text>
            </Pressable>
          </MenuRow>

          <MenuRow
            emoji="🛡️"
            title="Partner Safety Toolkit"
            detail="$1M Liability Active"
            open={open === 'safety'}
            onPress={() => toggleMenu('safety')}
          >
            <CheckLine done text="$1M commercial pet-care liability on every booking" />
            <CheckLine done text="24/7 vet hotline during walks & sits" />
            <CheckLine done text="In-walk SOS shares your live location with support" />
          </MenuRow>

          <MenuRow
            emoji="🎁"
            title="Refer a Fellow Dog Walker"
            detail={`Share code ${REFERRAL_CODE}`}
            badge={
              <View style={styles.bonus}>
                <Text style={styles.bonusText}>Earn $50 Bonus</Text>
              </View>
            }
            onPress={copyReferral}
          />

          <MenuRow
            emoji="💬"
            title="24/7 Partner Support"
            detail="Dedicated specialist & live chat"
            open={open === 'support'}
            onPress={() => toggleMenu('support')}
            last
          >
            <View style={styles.supportRow}>
              <Pressable
                onPress={() => toast.show('💬 Connecting you to a support specialist…')}
                accessibilityRole="button"
                style={({ pressed }) => [styles.inlineButton, styles.flex, pressed && styles.pressed]}
              >
                <Icon name="chat" size={18} color={colors.primary} />
                <Text style={styles.inlineButtonText}>Live Chat</Text>
              </Pressable>
              <Pressable
                onPress={() => toast.show('📞 Partner line: +1 (800) 555-0199')}
                accessibilityRole="button"
                style={({ pressed }) => [styles.inlineButton, styles.flex, pressed && styles.pressed]}
              >
                <Icon name="call" size={18} color={colors.primary} />
                <Text style={styles.inlineButtonText}>Call Us</Text>
              </Pressable>
            </View>
          </MenuRow>
        </Card>

        <Pressable
          onPress={() => nav.toSplash(logout)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
        >
          <Icon name="power-settings-new" size={20} color={colors.coral} />
          <Text style={styles.logoutText}>Switch to Offline & Log Out</Text>
        </Pressable>
        <Text style={styles.version}>Pawsome Partner App v2.4.1</Text>
      </ScrollView>
      <Toast message={toast.message} bottomOffset={BOTTOM_NAV_HEIGHT + 24} />
    </View>
  );
}

function MenuRow({
  emoji,
  title,
  detail,
  badge,
  open,
  onPress,
  last = false,
  children,
}: {
  emoji: string;
  title: string;
  detail: string;
  badge?: ReactNode;
  /** Undefined for rows that act instead of expanding. */
  open?: boolean;
  onPress: () => void;
  last?: boolean;
  children?: ReactNode;
}) {
  const expandable = open !== undefined;
  return (
    <View style={[styles.menuItem, !last && styles.menuDivider]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={expandable ? { expanded: open } : undefined}
        style={({ pressed }) => [styles.menuRow, pressed && styles.menuPressed]}
      >
        <View style={styles.menuIcon}>
          <Text style={styles.menuEmoji}>{emoji}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.menuTitle}>{title}</Text>
          <Text style={styles.menuDetail} numberOfLines={2}>
            {detail}
          </Text>
          {badge ? <View style={styles.menuBadge}>{badge}</View> : null}
        </View>
        <Icon
          name={expandable && open ? 'expand-less' : expandable ? 'expand-more' : 'content-copy'}
          size={expandable ? 24 : 18}
          color={colors.placeholder}
        />
      </Pressable>
      {expandable && open ? <View style={styles.menuBody}>{children}</View> : null}
    </View>
  );
}

function CheckLine({ done, text }: { done: boolean; text: string }) {
  return (
    <View style={styles.checkLine}>
      <Icon
        name={done ? 'check-circle' : 'radio-button-unchecked'}
        size={18}
        color={done ? colors.success : colors.placeholder}
      />
      <Text style={styles.checkText}>{text}</Text>
    </View>
  );
}

function AddBankForm({
  onSaved,
  onError,
}: {
  onSaved: (name: string, last4: string) => void;
  onError: (message: string) => void;
}) {
  const { addBank } = usePartnerActions();
  const { focusField, blurField } = useMascotActions();
  const [name, setName] = useState('');
  const [holder, setHolder] = useState('Alex Rivera');
  const [account, setAccount] = useState('');
  const [routing, setRouting] = useState('');

  const save = () => {
    const digits = account.replace(/\D/g, '');
    if (name.trim().length < 2) return onError('Enter your bank’s name');
    if (holder.trim().length < 2) return onError('Enter the account holder’s name');
    if (digits.length < 6 || digits.length > 17) return onError('Account number should be 6–17 digits');
    if (routing.trim().length < 4) return onError('Enter the routing number or IFSC');
    addBank({ name: name.trim(), kind: 'Standard payout • 1–2 days', last4: digits.slice(-4) });
    onSaved(name.trim(), digits);
  };

  return (
    <View style={styles.addForm}>
      <FormField
        label="Bank Name"
        icon="account-balance"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Wells Fargo Savings"
        autoCapitalize="words"
        onFocus={() => focusField('text')}
        onBlur={blurField}
      />
      <FormField
        label="Account Holder"
        icon="person-outline"
        value={holder}
        onChangeText={setHolder}
        autoCapitalize="words"
        onFocus={() => focusField('text')}
        onBlur={blurField}
      />
      <FormField
        label="Account Number"
        icon="pin"
        value={account}
        onChangeText={(value) => setAccount(value.replace(/[^\d ]/g, ''))}
        placeholder="6–17 digits"
        keyboardType="number-pad"
        secureTextEntry
        accessory={<Text style={styles.peek}>🙈 Barnaby won&apos;t peek</Text>}
        onFocus={() => focusField('password')}
        onBlur={blurField}
      />
      <FormField
        label="Routing Number / IFSC"
        icon="tag"
        value={routing}
        onChangeText={setRouting}
        autoCapitalize="characters"
        placeholder="e.g. 021000021"
        onFocus={() => focusField('text')}
        onBlur={blurField}
      />
      <Pressable
        onPress={save}
        accessibilityRole="button"
        style={({ pressed }) => [styles.saveBank, pressed && styles.pressed]}
      >
        <Text style={styles.saveBankText}>Link Bank Account</Text>
      </Pressable>
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
    gap: 16,
  },
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  header: {
    gap: 14,
    padding: 18,
    borderRadius: radii.xl,
    backgroundColor: colors.stage,
    ...shadows.card,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    borderWidth: 3,
    borderColor: colors.card,
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  name: {
    ...typography.headline,
    fontSize: 20,
  },
  verifiedRole: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.primary,
  },
  stats: {
    ...typography.bodySm,
    color: colors.ink,
    marginTop: 2,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.full,
    backgroundColor: colors.card,
  },
  statusText: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.ink,
  },
  statusLevel: {
    fontFamily: fonts.extrabold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primary,
  },
  addBank: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.primaryTint,
  },
  addBankText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.primary,
  },
  addForm: {
    gap: 12,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  peek: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 15,
    color: colors.slate,
  },
  saveBank: {
    height: 48,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    ...shadows.primary,
  },
  saveBankText: {
    ...typography.button,
    fontSize: 15,
  },
  bank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    backgroundColor: colors.input,
  },
  bankPrimary: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  bankIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  bankName: {
    ...typography.subhead,
  },
  bankMask: {
    ...typography.bodySm,
    letterSpacing: 1,
  },
  bankReady: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 15,
    color: colors.primary,
    marginTop: 2,
  },
  primaryPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  primaryPillText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    lineHeight: 15,
    color: colors.onPrimary,
  },
  setPrimary: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.card,
  },
  setPrimaryText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    lineHeight: 15,
    color: colors.primary,
  },
  autoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.input,
  },
  autoTitle: {
    ...typography.label,
  },
  autoText: {
    ...typography.bodySm,
    marginTop: 2,
  },
  menu: {
    gap: 0,
    paddingVertical: 8,
  },
  menuHeading: {
    ...typography.overline,
    paddingVertical: 6,
  },
  menuItem: {
    paddingVertical: 4,
  },
  menuDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
  },
  menuPressed: {
    backgroundColor: colors.input,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.stage,
  },
  menuEmoji: {
    fontSize: 20,
  },
  menuTitle: {
    ...typography.subhead,
  },
  menuDetail: {
    ...typography.bodySm,
    marginTop: 1,
  },
  menuBadge: {
    flexDirection: 'row',
    marginTop: 6,
  },
  menuBody: {
    gap: 10,
    paddingTop: 4,
    paddingBottom: 12,
  },
  checkLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkText: {
    ...typography.body,
    fontSize: 13,
    color: colors.ink,
    flex: 1,
  },
  inlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    backgroundColor: colors.primaryTint,
  },
  inlineButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    lineHeight: 18,
    color: colors.primary,
  },
  supportRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bonus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    backgroundColor: colors.coral,
  },
  bonusText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.onPrimary,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.coral,
    backgroundColor: colors.card,
    ...shadows.soft,
  },
  logoutText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.coralInk,
  },
  version: {
    ...typography.bodySm,
    textAlign: 'center',
  },
});
