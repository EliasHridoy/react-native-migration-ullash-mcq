import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { GlassCard } from '../GlassCard';

describe('GlassCard', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <GlassCard>
        <Text>Hello inside GlassCard</Text>
      </GlassCard>
    );
    expect(getByText('Hello inside GlassCard')).toBeDefined();
  });
});
