import type { CreateVueClientOptions, VueClientDefaults } from './client';
import { readonly, ref } from 'vue-demi';

export function areArraysEqual(
  a: unknown[] | null | undefined,
  b: unknown[] | null | undefined
) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  const size = a.length;
  if (size !== b.length) return false;

  for (let i = 0; i < size; ++i) if (a[i] !== b[i]) return false;

  return true;
}

export type VueClientOptionsWithDefaults = Omit<
  CreateVueClientOptions,
  'defaults'
> & {
  defaults: Required<VueClientDefaults>;
};

export function useReducer(reducer: any, initialArg: any, init?: any) {
  const state = ref(init ? init(initialArg) : initialArg);
  const dispatch = (action: any) => {
    state.value = reducer(state.value, action);
  };

  return [readonly(state), dispatch];
}

export function useState(initialState: any) {
  const state = ref(initialState);
  const setState = (newState: any) => {
    state.value = newState;
  };

  return [readonly(state), setState];
}
