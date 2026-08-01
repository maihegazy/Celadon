import React from 'react';
import { View } from 'react-native';
import { Card, Display, Dot, Screen, SectionLabel, Text, TextButton } from '../components';
import { BackChevron } from '../components/Buttons';
import { BellIcon } from '../components/Icons';
import { NOTIFICATION_GROUPS, toneColors } from '../data/content';
import { useAppState } from '../state/AppState';
import { colors, radius } from '../theme';
import { useAppNavigation } from '../navigation/types';

/** Notification centre — quiet by design; nothing arrives without a reason. */
export function NotificationsScreen() {
  const navigation = useAppNavigation();
  const { state, set } = useAppState();
  const groups = state.notificationsCleared ? [] : NOTIFICATION_GROUPS;

  return (
    <Screen tabs>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6 }}>
        <BackChevron onPress={() => navigation.navigate('Home')} />
        <Display size={26} style={{ flex: 1 }}>
          Notifications
        </Display>
        <TextButton
          label="Clear all"
          size={13}
          color={colors.muted}
          onPress={() => set({ notificationsCleared: true })}
        />
      </View>

      {groups.length === 0 ? (
        <View style={{ alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.sunken,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BellIcon color={colors.faint} />
          </View>
          <Text weight="semibold" size={15}>
            All caught up
          </Text>
          <Text size={13} color={colors.muted} align="center">
            We only reach out when it's genuinely useful.
          </Text>
        </View>
      ) : (
        groups.map((group) => (
          <View key={group.name}>
            <SectionLabel style={{ marginBottom: 8 }}>{group.name}</SectionLabel>
            <View style={{ gap: 8 }}>
              {group.items.map((item) => (
                <Card
                  key={item.title}
                  style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14, borderRadius: radius.tile }}
                >
                  <Dot color={toneColors[item.tone].dot} style={{ marginTop: 5 }} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                      <Text weight="semibold" size={14} style={{ flex: 1 }}>
                        {item.title}
                      </Text>
                      <Text size={11.5} color={colors.faint}>
                        {item.time}
                      </Text>
                    </View>
                    <Text size={13} color={colors.muted} lineHeight={20} style={{ marginTop: 3 }}>
                      {item.body}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        ))
      )}

      <Text size={12.5} color={colors.faint} align="center">
        Tune what you hear about in Profile → Notifications.
      </Text>
    </Screen>
  );
}
