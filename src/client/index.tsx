import { SamplingSettings } from "./components/SamplingSettings";
import { ProxyRules } from "./components/ProxyRules";

export const inject = ["slots"];

export function apply(ctx: any) {
  try {
    ctx.slots.inject('settings.section', () => {
      ctx.slots.register({
        name: 'settings.section',
        id: 'fetch-modifier-sampling',
        order: 1,
        label: () => 'Sampling Parameters',
      }, SamplingSettings);
    });
  } catch (e) {
    console.error('[fetch-modifier] sampling slot error:', e);
  }

  try {
    ctx.slots.inject('settings.section', () => {
      ctx.slots.register({
        name: 'settings.section',
        id: 'fetch-modifier-proxy',
        order: 2,
        label: () => 'Proxy Rules',
      }, ProxyRules);
    });
  } catch (e) {
    console.error('[fetch-modifier] proxy slot error:', e);
  }
}
