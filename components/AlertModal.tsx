import React from 'react';
import { Modal, Text, View } from 'react-native';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { AppButton } from '@/components/ui/AppButton';
import { useAlert, hideAlert, type AlertAction } from '@/lib/state';

/**
 * Confirm dialog, from Clear all conversations? (`6809:7325`) and Delete this entry? (`6809:7249`):
 * a centred card over the dimmed screen. A destructive confirm gets the soft danger orb with a trash
 * icon and a danger button. Cancel actions are text buttons below the main one.
 */
export const AlertModal: React.FC = () => {
  const alert = useAlert();
  if (!alert.visible) return null;

  const actions: AlertAction[] = alert.actions?.length ? alert.actions : [{ text: 'OK' }];
  const cancels = actions.filter((a) => a.style === 'cancel');
  const mains = actions.filter((a) => a.style !== 'cancel');
  const destructive = mains.some((a) => a.style === 'destructive');
  const press = (a: AlertAction) => {
    hideAlert();
    a.onPress?.();
  };

  return (
    <Modal
      transparent
      visible={alert.visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        hideAlert();
        cancels[0]?.onPress?.();
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(36,26,46,0.45)',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <View
          accessibilityViewIsModal
          style={{
            borderRadius: 32,
            backgroundColor: palette.bg,
            paddingHorizontal: 24,
            paddingTop: 28,
            paddingBottom: 16,
            alignItems: 'center',
            gap: 12,
          }}
        >
          {destructive ? (
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: palette.dangerSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="line/trash" size={22} color={palette.danger} />
            </View>
          ) : null}
          {!!alert.title && (
            <Text
              accessibilityRole="header"
              style={[
                Type.titleSm,
                { fontSize: 22, lineHeight: 28, color: palette.ink, textAlign: 'center' },
              ]}
            >
              {alert.title}
            </Text>
          )}
          {!!alert.message && (
            <Text
              style={[
                Type.captionM,
                { fontSize: 14, lineHeight: 19, color: palette.textMuted, textAlign: 'center' },
              ]}
            >
              {alert.message}
            </Text>
          )}
          <View style={{ alignSelf: 'stretch', gap: 4, marginTop: 8 }}>
            {mains.map((a, i) => (
              <AppButton
                key={`m${i}`}
                title={a.text}
                variant={a.style === 'destructive' ? 'danger' : i === 0 ? 'primary' : 'outline'}
                onPress={() => press(a)}
              />
            ))}
            {cancels.map((a, i) => (
              <AppButton key={`c${i}`} title={a.text} variant="text" onPress={() => press(a)} />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};
