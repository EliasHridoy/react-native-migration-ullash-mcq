import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GradientButton } from '../GradientButton';

test('calls onPress when tapped', () => {
  const mockPress = jest.fn();
  const { getByText } = render(<GradientButton label="Test" onPress={mockPress} />);
  fireEvent.press(getByText('Test'));
  expect(mockPress).toHaveBeenCalled();
});

test('does not call onPress when disabled', () => {
  const mockPress = jest.fn();
  const { getByText } = render(<GradientButton label="Test" onPress={mockPress} disabled />);
  fireEvent.press(getByText('Test'));
  expect(mockPress).not.toHaveBeenCalled();
});
