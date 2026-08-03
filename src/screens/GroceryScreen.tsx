import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  Card,
  CheckBox,
  Field,
  PrimaryButton,
  Screen,
  ScreenHeader,
  SectionLabel,
  SmallButton,
  Text,
} from '../components';
import { CUSTOM_GROCERY_CATEGORY, GROCERY_CATEGORIES } from '../data/content';
import { useAppState } from '../state/AppState';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';
import { useAppNavigation } from '../navigation/types';

/**
 * Shopping list generated from the week's plan. Checking things off and
 * removing what you already have are both one tap, and nothing is ever
 * deleted from the plan itself.
 */
export function GroceryScreen() {
  const navigation = useAppNavigation();
  const { state, dispatch } = useAppState();
  const [draft, setDraft] = useState('');
  const { t, tp, row } = useI18n();

  const categories = GROCERY_CATEGORIES.map((category, ci) => {
    const items: { name: string; qty: string | null; custom?: boolean }[] = [
      ...category.items.map((item) => ({ name: t(item.name), qty: item.qty ? t(item.qty) : null })),
      ...(ci === CUSTOM_GROCERY_CATEGORY
        ? state.customGroceryItems.map((name) => ({ name, qty: null, custom: true }))
        : []),
    ];
    return {
      name: t(category.name),
      items: items
        .map((item, ii) => ({ ...item, key: `${ci}-${ii}` }))
        .filter((item) => !state.groceryRemoved[item.key]),
    };
  }).filter((category) => category.items.length > 0);

  const remaining = categories
    .flatMap((category) => category.items)
    .filter((item) => !state.groceryChecked[item.key]).length;

  const addCustom = () => {
    const value = draft.trim();
    if (!value) return;
    dispatch({ type: 'addGroceryItem', name: value });
    setDraft('');
  };

  return (
    <Screen tabs>
      <ScreenHeader
        title={t('grocery.title')}
        subtitle={tp('grocery.subtitle', remaining)}
        onBack={() => navigation.navigate('Plan')}
        trailing={<SmallButton label={t('common.share')} />}
      />

      {categories.map((category) => (
        <View key={category.name}>
          <SectionLabel size={12} style={{ marginBottom: 8 }}>
            {category.name}
          </SectionLabel>
          <Card style={{ overflow: 'hidden' }}>
            {category.items.map((item, index) => {
              const checked = !!state.groceryChecked[item.key];
              return (
                <View
                  key={item.key}
                  style={{
                    flexDirection: row,
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderBottomWidth: index === category.items.length - 1 ? 0 : 1,
                    borderBottomColor: colors.sunken,
                  }}
                >
                  <CheckBox
                    checked={checked}
                    borderRadius={radius.check}
                    onPress={() => dispatch({ type: 'toggleGrocery', key: item.key })}
                  />
                  <Pressable style={{ flex: 1 }} onPress={() => dispatch({ type: 'toggleGrocery', key: item.key })}>
                    <Text
                      weight="medium"
                      size={14.5}
                      style={{
                        textDecorationLine: checked ? 'line-through' : 'none',
                        opacity: checked ? 0.5 : 1,
                      }}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                  {item.qty ? (
                    <Text size={12.5} color={colors.faint}>
                      {item.qty}
                    </Text>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('grocery.a11y.remove', { item: item.name })}
                    hitSlop={8}
                    onPress={() => dispatch({ type: 'removeGroceryItem', key: item.key })}
                  >
                    <Text size={15} color={colors.chevron}>
                      ×
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </Card>
        </View>
      ))}

      <View style={{ flexDirection: row, gap: 8 }}>
        <Field
          shape="pill"
          placeholder={t('grocery.addPlaceholder')}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addCustom}
          returnKeyType="done"
          containerStyle={{ flex: 1 }}
        />
        <PrimaryButton
          label={t('common.add')}
          size={14}
          style={{ borderRadius: radius.chip, paddingVertical: 12, paddingHorizontal: 20 }}
          onPress={addCustom}
        />
      </View>

      <Text size={12.5} color={colors.faint} align="center">
        {t('grocery.note')}
      </Text>
    </Screen>
  );
}
