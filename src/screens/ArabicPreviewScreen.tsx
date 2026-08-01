import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  Card,
  Chip,
  Display,
  FeatureCard,
  Hatch,
  NoteCard,
  Pill,
  PrimaryButton,
  Screen,
  ScoreRing,
  SmallButton,
  Text,
} from '../components';
import { colors, radius } from '../theme';
import { useAppNavigation } from '../navigation/types';

/**
 * Arabic (RTL) preview.
 *
 * Layout is mirrored explicitly — rows reverse, text aligns right — rather
 * than by flipping the whole app with I18nManager, which needs a restart. It
 * shows the same identity working right-to-left across four key surfaces.
 *
 * When full localisation lands, these strings move to a translation catalogue
 * and this screen becomes the language switcher.
 */
export function ArabicPreviewScreen() {
  const navigation = useAppNavigation();
  const [tab, setTab] = useState(0);

  const tabs = ['الرئيسية', 'نتيجة الفحص', 'الخطة', 'الاشتراك'];

  return (
    <Screen tabs gap={18}>
      <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
        <View style={{ alignItems: 'flex-end' }}>
          <Text weight="medium" size={13.5} color={colors.faint}>
            السبت ١ أغسطس
          </Text>
          <Display size={27} style={{ marginTop: 2 }}>
            صباح الخير يا مايا
          </Display>
        </View>
        <SmallButton label="English ‹" onPress={() => navigation.navigate('Profile')} />
      </View>

      <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
        {tabs.map((label, i) => (
          <Chip
            key={label}
            label={label}
            selected={tab === i}
            onPress={() => setTab(i)}
            size={12.5}
            paddingVertical={9}
            paddingHorizontal={0}
            style={{ flex: 1, borderRadius: 18 }}
          />
        ))}
      </View>

      {tab === 0 ? (
        <>
          <FeatureCard style={{ padding: 18 }}>
            <Text weight="semibold" size={12} color={colors.greenPale} align="right">
              تركيز اليوم اللطيف
            </Text>
            <Text weight="serif" size={19} color={colors.white} lineHeight={29} align="right" style={{ marginTop: 6 }}>
              أضيفي مصدرًا واحدًا للأوميغا ٣ — طبق السلمون على الغداء يكفي تمامًا.
            </Text>
            <Text size={13} color={colors.greenPale} align="right" style={{ marginTop: 8 }}>
              الخطوات الصغيرة تتراكم. هذه هي الخطة كلها.
            </Text>
          </FeatureCard>

          <View>
            <Text weight="semibold" size={16} align="right" style={{ marginBottom: 10 }}>
              وجبات اليوم
            </Text>
            <View style={{ gap: 10 }}>
              <ArabicMealRow slot="الفطور" name="بصارة بالخضار وزيت الزيتون" meta="١٠ دقائق" badge="داعم" />
              <ArabicMealRow slot="الغداء" name="سلطة السلمون بالكينوا" meta="٢٥ دقيقة" badge="أوميغا ٣" />
              <ArabicMealRow slot="العشاء" name="ملوخية بالدجاج المشوي" meta="٣٥ دقيقة" badge="داعم" />
            </View>
          </View>
        </>
      ) : null}

      {tab === 1 ? (
        <>
          <Card style={{ flexDirection: 'row-reverse', gap: 16, alignItems: 'center', padding: 18, borderRadius: radius.cardLg }}>
            <ScoreDialArabic />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row-reverse', gap: 6, flexWrap: 'wrap' }}>
                <Pill label="داعم" />
                <Pill label="ثقة عالية" background={colors.sunken} color={colors.muted} weight="semibold" />
              </View>
              <Text size={13.5} color={colors.muted} lineHeight={23} align="right" style={{ marginTop: 8 }}>
                اختيار قوي — الأوميغا ٣ وزيت الزيتون يقومان بالعمل الأساسي.
              </Text>
            </View>
          </Card>

          <Card style={{ paddingVertical: 14, paddingHorizontal: 18 }}>
            <View style={{ flexDirection: 'row-reverse', gap: 18, flexWrap: 'wrap' }}>
              <ArabicMacro value="٥٤٠" label="سعرة" />
              <ArabicMacro value="٣٤غ" label="بروتين" />
              <ArabicMacro value="٤٢غ" label="كربوهيدرات" />
              <ArabicMacro value="٢١غ" label="دهون" />
            </View>
            <Text
              size={12}
              color={colors.faint}
              align="right"
              style={{ marginTop: 10, paddingTop: 9, borderTopWidth: 1, borderTopColor: colors.sunken }}
            >
              السعرات المقدّرة من الصور تقديرية وليست قياسًا دقيقًا.
            </Text>
          </Card>
        </>
      ) : null}

      {tab === 2 ? (
        <>
          <Card style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 }}>
            <ScoreRing value={84} size={58} thickness={7}>
              <Text weight="bold" size={16} color={colors.greenDeep}>
                ٨٤
              </Text>
            </ScoreRing>
            <View style={{ flex: 1 }}>
              <Text weight="semibold" size={14} align="right">
                درجة اليوم · داعم
              </Text>
              <Text size={12.5} color={colors.muted} align="right" style={{ marginTop: 2 }}>
                ١٬٥٦٠ سعرة · بروتين ٩٦غ · دهون ٦٢غ
              </Text>
            </View>
          </Card>
          <ArabicMealRow slot="الغداء" name="سلطة السلمون بالكينوا" action="بدّلي" thumb={52} />
          <ArabicMealRow slot="العشاء" name="ملوخية بالدجاج المشوي" action="بدّلي" thumb={52} />
        </>
      ) : null}

      {tab === 3 ? (
        <>
          <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
            <View
              style={{
                flex: 1,
                padding: 16,
                borderRadius: radius.card,
                borderWidth: 1.5,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <Text weight="semibold" size={13} color={colors.muted} align="right">
                شهري
              </Text>
              <Text weight="bold" size={19} align="right" style={{ marginTop: 3 }}>
                ٢٤٩ ج.م
              </Text>
              <Text size={12} color={colors.faint} align="right" style={{ marginTop: 2 }}>
                شهريًا
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                padding: 16,
                borderRadius: radius.card,
                borderWidth: 1.5,
                borderColor: colors.green,
                backgroundColor: colors.greenLight,
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: -9,
                  left: 12,
                  backgroundColor: colors.amber,
                  borderRadius: 9,
                  paddingVertical: 3,
                  paddingHorizontal: 9,
                }}
              >
                <Text weight="bold" size={10.5} color={colors.white}>
                  وفّري ٣٣٪
                </Text>
              </View>
              <Text weight="semibold" size={13} color={colors.muted} align="right">
                سنوي
              </Text>
              <Text weight="bold" size={19} align="right" style={{ marginTop: 3 }}>
                ١٦٦ ج.م
              </Text>
              <Text size={12} color={colors.faint} align="right" style={{ marginTop: 2 }}>
                شهريًا · ١٬٩٩٠ ج.م سنويًا
              </Text>
            </View>
          </View>
          <PrimaryButton label="ابدئي ٧ أيام مجانًا" />
          <Text size={12.5} color={colors.faint} align="center" lineHeight={21}>
            الإلغاء بلمسة واحدة في أي وقت — نذكّرك قبل انتهاء التجربة بيومين.
          </Text>
        </>
      ) : null}

      <NoteCard style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
        <Text size={12.5} color={colors.muted} lineHeight={21} align="right">
          معاينة الواجهة العربية — التخطيط كامل من اليمين إلى اليسار، مع الحفاظ على نفس الهوية البصرية.
        </Text>
      </NoteCard>
    </Screen>
  );
}

function ScoreDialArabic() {
  return (
    <ScoreRing value={82} size={92} thickness={10}>
      <Text weight="bold" size={24} color={colors.greenDeep}>
        ٨٢
      </Text>
      <Text weight="semibold" size={9.5} color={colors.faint}>
        درجة سيلادون
      </Text>
    </ScoreRing>
  );
}

function ArabicMealRow({
  slot,
  name,
  meta,
  badge,
  action,
  thumb = 56,
}: {
  slot: string;
  name: string;
  meta?: string;
  badge?: string;
  action?: string;
  thumb?: number;
}) {
  return (
    <Card style={{ flexDirection: 'row-reverse', gap: 12, alignItems: 'center', padding: 12 }}>
      <Hatch band={6} radius={radius.thumb} style={{ width: thumb, height: thumb }} />
      <View style={{ flex: 1 }}>
        <Text weight="semibold" size={11.5} color={colors.faint} align="right">
          {slot}
        </Text>
        <Text weight="semibold" size={15} align="right" style={{ marginTop: 1 }}>
          {name}
        </Text>
        {meta ? (
          <Text size={12.5} color={colors.muted} align="right" style={{ marginTop: 2 }}>
            {meta}
          </Text>
        ) : null}
      </View>
      {badge ? <Pill label={badge} weight="semibold" size={12} /> : null}
      {action ? (
        <Pressable
          style={{
            borderWidth: 1.5,
            borderColor: colors.border,
            borderRadius: 16,
            paddingVertical: 6,
            paddingHorizontal: 13,
          }}
        >
          <Text weight="semibold" size={12.5} color={colors.muted}>
            {action}
          </Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

function ArabicMacro({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: 'flex-end' }}>
      <Text weight="bold" size={17}>
        {value}
      </Text>
      <Text weight="medium" size={11.5} color={colors.faint}>
        {label}
      </Text>
    </View>
  );
}
