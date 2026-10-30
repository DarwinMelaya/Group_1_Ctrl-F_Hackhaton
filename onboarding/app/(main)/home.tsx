import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText, Button, CatchRow, ConditionsCard, EmptyState, IconBadge, QuickAction, ScreenContainer, SeaScene, SyncBanner, SyncChip, TextLink } from '@/components';
import { SeaweedGrowth } from '@/components/SeaweedGrowth';
import { cycleStage, daysSince, getCrop, parsePlot } from '@/constants/aquaculture';
import { getMunicipality } from '@/constants/municipalities';
import { getReportType } from '@/constants/reportTypes';
import { actionsFor } from '@/constants/roleNav';
import { PLACES } from '@/constants/places';
import { getRole } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useRecords } from '@/hooks/useRecords';
import { useSeaConditions } from '@/hooks/useSeaConditions';
import { useSync } from '@/hooks/useSync';
import { useLocalList } from '@/storage/localList';
import { useTheme } from '@/theme';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Magandang umaga';
  if (h < 18) return 'Magandang hapon';
  return 'Magandang gabi';
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();
  const { state } = useOnboarding();
  const { auth } = useAuth();
  const { syncNow } = useSync();
  const firstName = auth.status === 'signedIn' ? auth.profile?.fullName.trim().split(/\s+/)[0] : undefined;
  const town = state.municipality ? getMunicipality(state.municipality) : undefined;
  const role = state.role ? getRole(state.role) : undefined;
  const { state: sea, refreshing, refresh } = useSeaConditions(town);

  const place = town ? [state.barangay.trim(), town.name].filter(Boolean).join(', ') : 'Marinduque';
  const waveHeight = sea.status === 'ready' ? sea.data.waveHeightM : null;

  return (
    <ScreenContainer
      edges={['top', 'left', 'right']}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            refresh();
            syncNow();
          }}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <Animated.View entering={FadeInDown.duration(360)} style={{ gap: 2, marginTop: spacing.md, marginBottom: spacing.md }}>
        <AppText variant="title" accessibilityRole="header">
          {firstName ? `${greeting()}, ${firstName}` : greeting()}
        </AppText>
        <AppText variant="body" color="textMuted">
          {role ? `${role.title} · ${place}` : place}
        </AppText>
      </Animated.View>

      <View style={{ marginBottom: spacing.sm }}>
        <SyncBanner />
      </View>

      <Animated.View entering={FadeInDown.duration(360).delay(80)}>
        <SeaScene waveHeightM={waveHeight} />
      </Animated.View>

      <Section title="Sea today" style={{ marginTop: spacing.md }}>
        <ConditionsCard townName={town?.name ?? 'your town'} state={sea} refreshing={refreshing} onRetry={refresh} />
      </Section>

      <Section title="What do you need?">
        <View style={[styles.grid, { gap: spacing.sm }]}>
          {actionsFor(state.role).map((a) => (
            <QuickAction key={a.key} icon={a.icon} tone={a.tone} label={a.label} hint={a.hint} onPress={() => router.push(a.href)} />
          ))}
        </View>
      </Section>

      <RoleSection />
    </ScreenContainer>
  );
}

// The bottom of Home follows the role: what this person checks most after the sea.
function RoleSection() {
  const { state } = useOnboarding();
  switch (state.role) {
    case 'aquaculture':
      return <FarmSummary />;
    case 'bantay-dagat':
    case 'community':
      return <RecentReports />;
    case 'tourist':
      return <PlacesPreview />;
    default:
      return <RecentCatches />;
  }
}

function useCard() {
  const { colors, radii } = useTheme();
  return [styles.card, { borderRadius: radii.lg, borderColor: colors.border, backgroundColor: colors.surface }];
}

function Row({ first, children }: { first: boolean; children: React.ReactNode }) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
        borderTopColor: colors.borderStrong,
      }}
    >
      {children}
    </View>
  );
}

function SeeAll({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong }}>
      <TextLink label={label} onPress={onPress} />
    </View>
  );
}

function RecentCatches() {
  const router = useRouter();
  const card = useCard();
  const { catches } = useRecords();
  const recent = catches.slice(0, 3);
  return (
    <Section title="Recent catches">
      {recent.length === 0 ? (
        <EmptyState
          title="Nothing logged yet"
          body="Your catches will show here, newest first, even before they are sent."
          action={<Button label="Log your first catch" variant="secondary" trailingIcon="arrow-forward" onPress={() => router.push('/log')} />}
        />
      ) : (
        <View style={card}>
          {recent.map((c, i) => (
            <Row key={c.clientUuid} first={i === 0}>
              <CatchRow record={c} />
            </Row>
          ))}
          <SeeAll label={`See all ${catches.length}`} onPress={() => router.push('/catches')} />
        </View>
      )}
    </Section>
  );
}

function FarmSummary() {
  const router = useRouter();
  const card = useCard();
  const { tones } = useTheme();
  const { items: plots } = useLocalList('farm/v1', parsePlot);
  return (
    <Section title="Your lines and cages">
      {plots.length === 0 ? (
        <EmptyState
          art={<SeaweedGrowth progress={0.6} width={140} />}
          title="No lines or cages yet"
          body="Add them on the Farm tab to see days since planting and harvest timing."
          action={<Button label="Open my farm" variant="secondary" trailingIcon="arrow-forward" onPress={() => router.push('/farm')} />}
        />
      ) : (
        <View style={card}>
          {plots.slice(0, 3).map((p, i) => {
            const stage = cycleStage(p);
            return (
              <Row key={p.id} first={i === 0}>
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <AppText variant="label">{p.name}</AppText>
                    <AppText variant="caption" color="textMuted">
                      {getCrop(p.crop).name} · Day {daysSince(p.plantedAt)}
                    </AppText>
                  </View>
                  {stage ? (
                    <View style={[styles.row, { gap: 4 }]}>
                      <MaterialCommunityIcons name={stage.icon} size={16} color={tones[stage.tone].fg} />
                      <AppText variant="caption" style={{ color: tones[stage.tone].fg }}>
                        {stage.tone === 'reef' ? 'Growing' : stage.tone === 'mangrove' ? 'Ready' : 'Check'}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </Row>
            );
          })}
          <SeeAll label="Open my farm" onPress={() => router.push('/farm')} />
        </View>
      )}
    </Section>
  );
}

function RecentReports() {
  const router = useRouter();
  const card = useCard();
  const { reports } = useRecords();
  const recent = reports.slice(0, 3);
  return (
    <Section title="Your reports">
      {recent.length === 0 ? (
        <EmptyState
          title="No reports yet"
          body="Saw dynamite fishing, a commercial boat, or trash washing in? Report it, even without signal."
          action={<Button label="Make a report" variant="secondary" trailingIcon="arrow-forward" onPress={() => router.push('/report')} />}
        />
      ) : (
        <View style={card}>
          {recent.map((r, i) => (
            <Row key={r.clientUuid} first={i === 0}>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <AppText variant="label">{getReportType(r.type).title}</AppText>
                  <AppText variant="caption" color="textMuted" numberOfLines={1}>
                    {r.description}
                  </AppText>
                </View>
                <SyncChip sync={r.sync} />
              </View>
            </Row>
          ))}
          <SeeAll label="Make a report" onPress={() => router.push('/report')} />
        </View>
      )}
    </Section>
  );
}

function PlacesPreview() {
  const router = useRouter();
  const card = useCard();
  return (
    <Section title="Places to visit">
      <View style={card}>
        {PLACES.slice(0, 3).map((p, i) => (
          <Row key={p.id} first={i === 0}>
            <View style={[styles.row, { gap: 12 }]}>
              <IconBadge icon={p.icon} tone="reef" size="sm" />
              <View style={styles.flex}>
                <AppText variant="label">{p.name}</AppText>
                <AppText variant="caption" color="textMuted" numberOfLines={1}>
                  {p.about}
                </AppText>
              </View>
            </View>
          </Row>
        ))}
        <SeeAll label={`See all ${PLACES.length} places`} onPress={() => router.push('/places')} />
      </View>
    </Section>
  );
}

function Section({ title, children, style }: { title: string; children: React.ReactNode; style?: object }) {
  const { spacing } = useTheme();
  return (
    <View style={[{ gap: spacing.sm, marginTop: spacing.lg }, style]}>
      <AppText variant="eyebrow" color="textMuted" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  card: { borderWidth: 1.5, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
});
