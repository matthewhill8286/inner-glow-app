import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useAlert, hideAlert } from '@/lib/state';

export const AlertModal: React.FC = () => {
  const alert = useAlert();

  if (!alert.visible) return null;

  return (
    <Modal transparent visible={alert.visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {!!alert.title && <Text style={styles.title}>{alert.title}</Text>}
          {!!alert.message && <Text style={styles.message}>{alert.message}</Text>}
          <View style={styles.actions}>
            {(alert.actions && alert.actions.length ? alert.actions : [{ text: 'OK' }]).map(
              (a, i) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    hideAlert();
                    a.onPress?.();
                  }}
                  style={[styles.button, a.style === 'destructive' && styles.destructive]}
                >
                  <Text
                    style={[styles.buttonText, a.style === 'destructive' && styles.destructiveText]}
                  >
                    {a.text}
                  </Text>
                </Pressable>
              ),
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
    color: '#333',
  },
  message: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  buttonText: {
    fontWeight: '800',
    color: '#333',
  },
  destructive: {
    backgroundColor: '#ffe8e8',
  },
  destructiveText: {
    color: '#cc0000',
  },
});
