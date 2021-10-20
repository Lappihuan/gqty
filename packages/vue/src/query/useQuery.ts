import { GQtyClient, prepass } from 'gqty';
// import { useMemo, useState } from 'react';
import type { Ref } from 'vue-demi';

import {
  OnErrorHandler,
  useInterceptSelections,
  // useIsomorphicLayoutEffect,
} from '../common';
import type { VueClientOptionsWithDefaults } from '../utils';
import {
  // computed,
  getCurrentInstance,
  onUnmounted,
  shallowRef,
} from 'vue-demi';

export interface UseQueryPrepareHelpers<
  GeneratedSchema extends {
    query: object;
  }
> {
  readonly prepass: typeof prepass;
  readonly query: GeneratedSchema['query'];
}

export interface UseQueryOptions<
  GeneratedSchema extends {
    query: object;
  } = never
> {
  // suspense?: boolean;
  staleWhileRevalidate?: boolean | object | number | string | null;
  onError?: OnErrorHandler;
  prepare?: (helpers: UseQueryPrepareHelpers<GeneratedSchema>) => void;
}

export type UseQueryReturnValue<GeneratedSchema extends { query: object }> =
  GeneratedSchema['query'] & {};

export interface UseQuery<GeneratedSchema extends { query: object }> {
  (options?: UseQueryOptions<GeneratedSchema>): Ref<
    UseQueryReturnValue<GeneratedSchema>
  >;
}

export function createUseQuery<
  GeneratedSchema extends {
    query: object;
    mutation: object;
    subscription: object;
  }
>(client: GQtyClient<GeneratedSchema>, opts: VueClientOptionsWithDefaults) {
  const {
    // suspense: defaultSuspense,
    staleWhileRevalidate: defaultStaleWhileRevalidate,
  } = opts.defaults;
  const { scheduler, eventHandler, interceptorManager } = client;

  const clientQuery: GeneratedSchema['query'] = client.query;
  const query = shallowRef(clientQuery);

  const prepareHelpers: UseQueryPrepareHelpers<GeneratedSchema> = {
    prepass,
    query: clientQuery,
  };

  const useQuery: UseQuery<GeneratedSchema> = function useQuery({
    // suspense = defaultSuspense,
    staleWhileRevalidate = defaultStaleWhileRevalidate,
    onError,
    prepare,
  }: UseQueryOptions<GeneratedSchema> = {}): Ref<
    UseQueryReturnValue<GeneratedSchema>
  > {
    const { unsubscribe } = useInterceptSelections({
      staleWhileRevalidate,
      eventHandler,
      interceptorManager,
      scheduler,
      query,
      onError,
      updateOnFetchPromise: true,
    });

    // const isLoading = computed(() => fetchingPromise.value !== null)

    if (prepare) {
      try {
        prepare(prepareHelpers);
      } catch (err) {
        if (err instanceof Error && Error.captureStackTrace!) {
          Error.captureStackTrace(err, useQuery);
        }
        throw err;
      }
    }

    onUnmounted(() => {
      const instance = getCurrentInstance();
      if (instance) {
        unsubscribe();
      }
    });

    return query;
  };

  return useQuery;
}
