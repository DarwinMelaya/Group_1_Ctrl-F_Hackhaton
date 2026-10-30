import { useRouter } from "expo-router";
import { View } from "react-native";

import {
  AppText,
  Button,
  ScreenContainer,
  SelectCard,
  StepHeader,
} from "@/components";
import { ROLES } from "@/constants/roles";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useLanguage } from "@/hooks/useLanguage";
import { useUsername } from "@/hooks/useUsername";
import { useTheme } from "@/theme";

export default function RoleScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const { state, setRole } = useOnboarding();
  const nickname = useUsername();
  const { t } = useLanguage();

  return (
    <ScreenContainer
      header={<StepHeader step={2} total={4} />}
      footer={
        <Button
          label={t("Continue", "Tuloy")}
          trailingIcon="arrow-forward"
          disabled={!state.role}
          accessibilityHint={
            state.role ? undefined : t("Choose a role first", "Pumili muna")
          }
          onPress={() => router.push("/location")}
        />
      }
    >
      <View
        style={{
          gap: spacing.xs,
          marginTop: spacing.md,
          marginBottom: spacing.lg,
        }}
      >
        <AppText variant="title" accessibilityRole="header">
          {nickname ? t(`Hello, ${nickname}! `, `Kumusta, ${nickname}! `) : ""}
          {t("What do you do by the sea?", "Ano ang ginagawa mo sa dagat?")}
        </AppText>
        <AppText variant="body" color="textMuted">
          {t(
            "We will put the tools you need up front. You can change this later.",
            "Uunahin namin ang mga kailangan mo. Puwede mo itong palitan mamaya.",
          )}
        </AppText>
      </View>

      <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
        {ROLES.map((role) => (
          <SelectCard
            key={role.id}
            title={t(role.title, role.titleFil)}
            description={t(role.description, role.descriptionFil)}
            icon={role.icon}
            tone={role.tone}
            selected={state.role === role.id}
            onPress={() => setRole(role.id)}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}
