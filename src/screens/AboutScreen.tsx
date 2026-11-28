import { useMemo, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import DeviceInfo from "react-native-device-info";
import { Appbar, Divider, List, Surface, Text, TouchableRipple, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type contributorType = {
  name: string;
  githubName?: string;
  notes?: string;
  task?: string;
  githubProfileUrl?: string; // THIS IS TEMPORARY
}

const CONTRIBUTORS: contributorType[] = [
  {
    name: "Molimen",
    githubName: "Molimen",
    notes: "And the me of someday becomes who I am today.",
    task: "from the UI and the backend.",
    githubProfileUrl: "https://avatars.githubusercontent.com/u/95009791?v=4",
  },
  {
    name: "---",
    notes: "Want to contribute to this little project? contact me!",
    task: "anything"
  }
]

function FieldRow({ label, value }: { label: string; value?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
      <Text variant="labelLarge" style={{ color: colors.onSecondaryContainer }}>
        {label}
      </Text>
      <Text
        variant="bodyLarge"
        style={{ color: value ? colors.onSurface : colors.outline, marginTop: 2 }}
      >
        {value ?? 'Not recorded'}
      </Text>
    </View>
  );
}

function FieldCard({ children }: { children: React.ReactNode }) {
  return (
    <Surface mode="flat" elevation={2} style={{ borderRadius: 16, overflow: 'hidden' }}>
      {children}
    </Surface>
  );
}

export default function AboutScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [index, setIndex] = useState(0);
  const contributor = useMemo(() => CONTRIBUTORS[index], [index])
  const goTo = (num: number) => setIndex((index + num + CONTRIBUTORS.length) % CONTRIBUTORS.length)

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Appbar.Header mode="small" elevated>
        <Appbar.Content title="About" />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, padding: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* <View
          style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
        >
          <TouchableRipple
            onPress={() => goTo(-1)}
            style={{
              minWidth: 48,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.secondaryContainer
            }}
            accessibilityLabel="Previous contributor"
            borderless
          >
            <List.Icon icon="arrow-left-circle" />
          </TouchableRipple>

          <View
            style={{ flex: 1, flexDirection: 'row', gap: 3 }}
          >
            {Array.from({ length: CONTRIBUTORS.length}).map((_, i) => {
              const selected = i === index;
              return (
                <TouchableRipple
                  key={i}
                  onPress={() => setIndex(i)}
                  accessibilityLabel={`Contributor ${i+1}`}
                  accessibilityState={{ selected }}
                  style={{
                    flex: 1,
                    height: 28,
                    borderRadius: 6,
                    borderWidth: 2,
                    backgroundColor: selected ? theme.colors.onSurface : theme.colors.primaryContainer,
                    borderColor: selected ? theme.colors.onSurface : 'transparent'
                  }}
                >
                  <View />
                </TouchableRipple>
              )
            })}
          </View>

          <TouchableRipple
            onPress={() => goTo(1)}
            style={{
              minWidth: 48,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.secondaryContainer
            }}
            accessibilityLabel="Next contributor"
            borderless
          >
            <List.Icon icon="arrow-right-circle" />
          </TouchableRipple>
        </View>

        <Surface mode="flat" elevation={3}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, gap: 12 }}
        >
          <View style={{ flex: 1 }}>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
              {contributor.name}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Contributor {index + 1} of {CONTRIBUTORS.length}
            </Text>
          </View>
          {
            contributor.githubProfileUrl 
            ? (
              <Image
                source={{ uri: contributor.githubProfileUrl }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                }}
                resizeMode="cover"
              />
            )
            : (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  justifyContent: "center",
                  alignItems:"center",
                  backgroundColor: theme.colors.tertiary
                }}
              >
                <Text
                  style={{ color: "#000" }}
                >
                  ???
                </Text>
              </View>
            )
          }
        </Surface>

        <FieldCard>
          <View style={{ flexDirection: 'row' }}>
            <FieldRow label="Task" value={contributor.task} />
          </View>
          <Divider />
          <View style={{ flexDirection: 'row' }}>
            <FieldRow label="Notes" value={contributor.notes} />
          </View>
        </FieldCard>

        <Divider bold /> */}

        <FieldCard>
          <View style={{ flexDirection: 'row' }}>
            <FieldRow label="App version" value={`v${DeviceInfo.getVersion()}`} />
          </View>
        </FieldCard>
      </ScrollView>
    </View>
  )
}