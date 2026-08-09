import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { Card, Display, Dot, Screen, SectionLabel, Text, TextButton } from '../components';
import { BackChevron } from '../components/Buttons';
import { BellIcon } from '../components/Icons';
import { Tone, toneColors } from '../data/content';
import { NotificationKind, NotificationRecord, useNotifications } from '../services/notifications';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';
import { useAppNavigation } from '../navigation/types';

/** Each notification kind carries the design's quiet colour language. */
const KIND_TONE: Record<NotificationKind, Tone> = {
  meal_reminder: 'good',
  shopping: 'flag',
  weekly_review: 'good',
  new_recipe: 'mid',
  plan_tweak: 'mid',
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Notification centre — quiet by design; nothing arrives without a reason. */
export function NotificationsScreen() {
  const navigation = useAppNavigation();
  const { notifications, markAllRead, clearAll } = useNotifications();
  const { t, lang, row } = useI18n();

  // Opening the centre is what "reads" it.
  useEffect(() => {
    markAllRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = new Date();
  const locale = lang === 'ar' ? 'ar-EG' : 'en-GB';
  const timestamp = (item: NotificationRecord) => {
    const created = new Date(item.createdAt);
    return sameDay(created, now)
      ? created.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
      : created.toLocaleDateString(locale, { weekday: 'short' });
  };

  const groups = useMemo(() => {
    const today = notifications.filter((item) => sameDay(new Date(item.createdAt), now));
    const earlier = notifications.filter((item) => !sameDay(new Date(item.createdAt), now));
    return [
      { name: 'notifs.group.today' as const, items: today },
      { name: 'notifs.group.earlier' as const, items: earlier },
    ].filter((group) => group.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  return (
    <Screen tabs>
      <View style={{ flexDirection: row, alignItems: 'center', gap: 12, paddingTop: 6 }}>
        <BackChevron onPress={() => navigation.navigate('Home')} />
        <Display size={26} style={{ flex: 1 }}>
          {t('notifs.title')}
        </Display>
        {notifications.length > 0 && (
          <TextButton label={t('notifs.clearAll')} size={13} color={colors.muted} onPress={clearAll} />
        )}
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
            {t('notifs.empty.title')}
          </Text>
          <Text size={13} color={colors.muted} align="center">
            {t('notifs.empty.body')}
          </Text>
        </View>
      ) : (
        groups.map((group) => (
          <View key={group.name}>
            <SectionLabel style={{ marginBottom: 8 }}>{t(group.name)}</SectionLabel>
            <View style={{ gap: 8 }}>
              {group.items.map((item) => (
                <Card
                  key={item.id}
                  style={{ flexDirection: row, gap: 12, alignItems: 'flex-start', padding: 14, borderRadius: radius.tile }}
                >
                  <Dot color={toneColors[KIND_TONE[item.kind]].dot} style={{ marginTop: 5 }} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: row, justifyContent: 'space-between', gap: 8 }}>
                      <Text weight="semibold" size={14} style={{ flex: 1 }}>
                        {item.title}
                      </Text>
                      <Text size={11.5} color={colors.faint}>
                        {timestamp(item)}
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
        {t('notifs.footer')}
      </Text>
    </Screen>
  );
}
