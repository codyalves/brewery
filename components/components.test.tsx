// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FAN_CONTENT_NOTICE, Footer } from './footer';
import { ManaCost } from './mana-cost';

describe('components', () => {
  it('draws a cost as pips a screen reader reads as words', () => {
    render(<ManaCost cost="{2}{U}{U}" />);

    expect(screen.getByRole('img', { name: '2 generic, blue, blue' }).children).toHaveLength(3);
  });

  it('carries the Fan Content Policy notice word for word', () => {
    render(<Footer />);

    expect(screen.getByText(FAN_CONTENT_NOTICE)).toBeTruthy();
  });
});
