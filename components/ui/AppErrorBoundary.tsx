import React from 'react';
import { View, Text } from 'react-native';
import { recordDiagnostic } from '@/lib/diagnostics';
import { AppButton } from './AppButton';
import { Typography } from '@/constants/typography';
export class AppErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { reference: string | null; failed: boolean }
> {
  state = { reference: null as string | null, failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.setState({ reference: recordDiagnostic('app_crash') });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: 24,
          gap: 16,
          backgroundColor: '#FAF8F5',
        }}
      >
        <Text accessibilityRole="header" style={[Typography.heading, { color: '#1B1A18' }]}>
          Let’s get you back
        </Text>
        <Text style={[Typography.body, { color: '#1B1A18' }]}>
          Something went wrong. Reopen this screen or contact support with the reference below.
        </Text>
        <Text selectable style={[Typography.caption, { color: '#555' }]}>
          Reference: {this.state.reference ?? 'pending'}
        </Text>
        <AppButton
          title="Try again"
          onPress={() => this.setState({ failed: false, reference: null })}
        />
      </View>
    );
  }
}
