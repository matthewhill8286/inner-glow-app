import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, TextInput } from 'react-native';

type Option = { label: string; value: string };

export default function SelectField({
  label,
  value,
  placeholder = 'Select…',
  options,
  allowCustom = false,
  customLabel = 'Custom…',
  onChange,
}: Readonly<{
  label: string;
  value?: string | null;
  placeholder?: string;
  options: Option[];
  allowCustom?: boolean;
  customLabel?: string;
  onChange: (val: string | null) => void;
}>) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');

  const display = useMemo(() => {
    if (!value) return placeholder;
    const found = options.find((o) => o.value === value);
    return found?.label ?? value;
  }, [value, options, placeholder]);

  const list = useMemo(() => {
    const base = [...options];
    if (allowCustom) base.push({ label: customLabel, value: '__custom__' });
    return base;
  }, [options, allowCustom, customLabel]);

  return (
    <View style={{ marginTop: 14 }}>
      <Text style={{ fontWeight: '900', marginBottom: 8 }}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 16,
          backgroundColor: '#f2f2f2',
        }}
      >
        <Text style={{ opacity: value ? 1 : 0.6, fontWeight: '700' }}>{display}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              padding: 16,
              maxHeight: '70%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '900' }}>{label}</Text>
              <Pressable onPress={() => setOpen(false)} style={{ padding: 10 }}>
                <Text style={{ fontWeight: '900' }}>Close</Text>
              </Pressable>
            </View>

            <FlatList
              data={list}
              keyExtractor={(i) => i.value}
              contentContainerStyle={{ paddingVertical: 10, gap: 8 }}
              renderItem={({ item }) => {
                if (item.value === '__custom__') return null;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    style={{
                      padding: 12,
                      borderRadius: 16,
                      backgroundColor: value === item.value ? '#dff7df' : '#f2f2f2',
                    }}
                  >
                    <Text style={{ fontWeight: '800' }}>{item.label}</Text>
                  </Pressable>
                );
              }}
              ListFooterComponent={
                allowCustom ? (
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ fontWeight: '900' }}>Custom</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                      <TextInput
                        value={custom}
                        onChangeText={setCustom}
                        placeholder="Type your answer…"
                        style={{
                          flex: 1,
                          padding: 12,
                          borderRadius: 16,
                          backgroundColor: '#f2f2f2',
                        }}
                      />
                      <Pressable
                        onPress={() => {
                          const v = custom.trim();
                          if (!v) return;
                          onChange(v);
                          setOpen(false);
                          setCustom('');
                        }}
                        style={{
                          paddingHorizontal: 14,
                          borderRadius: 16,
                          backgroundColor: '#a07b55',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: 'white', fontWeight: '900' }}>Use</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
