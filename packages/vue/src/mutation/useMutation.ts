import { doRetry, GQtyClient, GQtyError, RetryOptions } from 'gqty';

// import { Dispatch, useCallback, useRef } from 'react';
import { useReducer } from '../utils';
import { computed, ref } from 'vue-demi';

import type {
  OnErrorHandler,
  // useDeferDispatch,
  // useSuspensePromise,
} from '../common';
import type { VueClientOptionsWithDefaults } from '../utils';

export interface UseMutationOptions<TData> {
  noCache?: boolean;
  onCompleted?: (data: TData) => void;
  onError?: OnErrorHandler;
  /**
   * Retry behaviour
   *
   * @default false
   */
  retry?: RetryOptions;
  /**
   * Refetch specific queries after mutation completion.
   *
   * You can give functions or parts of the schema to be refetched
   */
  refetchQueries?: unknown[];
  /**
   * Await refetch resolutions before calling the mutation actually complete
   */
  awaitRefetchQueries?: boolean;
  /**
   * Enable suspense behavior
   */
  suspense?: boolean;
  /**
   * Activate special handling of non-serializable variables,
   * for example, files uploading
   *
   * @default false
   */
  nonSerializableVariables?: boolean;
}

export interface UseMutationState<TData> {
  data: TData | undefined;
  error?: GQtyError;
  isLoading: boolean;
}

type UseMutationReducerAction<TData> =
  | { type: 'success'; data: TData }
  | { type: 'failure'; error: GQtyError }
  | { type: 'loading' };

function UseMutationReducer<TData>(
  state: UseMutationState<TData>,
  action: UseMutationReducerAction<TData>
): UseMutationState<TData> {
  switch (action.type) {
    case 'loading': {
      if (state.isLoading) return state;
      return {
        data: state.data,
        isLoading: true,
      };
    }
    case 'success': {
      return {
        data: action.data,
        isLoading: false,
      };
    }
    case 'failure': {
      return {
        data: state.data,
        isLoading: false,
        error: action.error,
      };
    }
  }
}

function InitUseMutationReducer<TData>(): UseMutationState<TData> {
  return {
    data: undefined,
    isLoading: false,
  };
}

export interface UseMutation<
  GeneratedSchema extends {
    mutation: object;
  }
> {
  <TData = unknown, TArgs = undefined>(
    mutationFn?: (mutation: GeneratedSchema['mutation'], args: TArgs) => TData,
    options?: UseMutationOptions<TData>
  ): readonly [
    (
      ...opts: undefined extends TArgs
        ? [
            {
              fn?: (
                mutation: GeneratedSchema['mutation'],
                args: TArgs
              ) => TData;
              args?: TArgs;
            }?
          ]
        : [
            {
              fn?: (
                mutation: GeneratedSchema['mutation'],
                args: TArgs
              ) => TData;
              args: TArgs;
            }
          ]
    ) => Promise<TData>,
    UseMutationState<TData>
  ];
}

export function createUseMutation<
  GeneratedSchema extends {
    mutation: object;
    query: object;
    subscription: object;
  }
>(
  client: GQtyClient<GeneratedSchema>,
  {
    defaults: { mutationSuspense: defaultSuspense },
  }: VueClientOptionsWithDefaults
) {
  const { resolved, refetch } = client;
  const clientMutation: GeneratedSchema['mutation'] = client.mutation;

  const useMutation: UseMutation<GeneratedSchema> = function useMutation<
    TData,
    TArgs = undefined
  >(
    mutationFn?: (mutation: typeof clientMutation, args: TArgs) => TData,
    opts: UseMutationOptions<TData> = {}
  ): readonly [
    ({
      fn: fnArg,
      args,
    }?: {
      fn?: (mutation: GeneratedSchema['mutation'], args: TArgs) => TData;
      args?: TArgs;
    }) => Promise<TData>,
    UseMutationState<TData>
  ] {
    const optsRef = ref(opts);
    optsRef.value = Object.assign({}, opts);
    optsRef.value.suspense ??= defaultSuspense;

    // const setSuspensePromise = useSuspensePromise(optsRef);

    const [state] = useReducer(
      UseMutationReducer,
      undefined,
      InitUseMutationReducer
    ) as [UseMutationState<TData>, UseMutationReducerAction<TData>];
    // const dispatch = useDeferDispatch(dispatchReducer);

    const fnRef = ref(mutationFn);
    fnRef.value = mutationFn;

    const callRefetchQueries = (): Promise<unknown> | void => {
      const { refetchQueries, awaitRefetchQueries } = optsRef.value;

      if (refetchQueries?.length) {
        const refetchPromise = Promise.all(
          refetchQueries.map((v: any) => refetch(v))
        ).catch((err) => {
          console.log(err);
          // dispatch({
          //   type: 'failure',
          //   error: GQtyError.create(err, useMutation),
          // });
        });

        if (awaitRefetchQueries) return refetchPromise;
      }
    };

    const mutate = function mutateFn({
      fn: fnArg,
      args,
    }: { fn?: typeof mutationFn; args?: any } = {}) {
      // dispatch({ type: 'loading' });

      const refFn = fnRef.value;

      const functionResolve = fnArg
        ? () => fnArg(clientMutation, args)
        : refFn
        ? () => refFn(clientMutation, args)
        : (() => {
            throw new GQtyError(
              'You have to specify a function to be resolved',
              {
                caller: mutateFn,
              }
            );
          })();

      return resolved<TData>(functionResolve, {
        noCache: optsRef.value.noCache,
        refetch: true,
        nonSerializableVariables: optsRef.value.nonSerializableVariables,
      }).then(
        async (data) => {
          const refetchingQueries = callRefetchQueries();
          if (refetchingQueries) await refetchingQueries;

          optsRef.value.onCompleted?.(data);
          // dispatch({
          //   type: 'success',
          //   data,
          // });

          return data;
        },
        (err: unknown) => {
          const error = GQtyError.create(err, useMutation);
          optsRef.value.onError?.(error);
          // dispatch({
          //   type: 'failure',
          //   error,
          // });

          throw error;
        }
      );
    };

    const { retry = false } = opts;

    const fn = computed(() => {
      const localFn: typeof mutate = retry
        ? (...args: any[]) => {
            const promise = mutate(...args).catch((err) => {
              doRetry(retry, {
                onRetry: () => {
                  const promise = mutate(...args).then(() => {});

                  // setSuspensePromise(promise);

                  return promise;
                },
              });

              throw err;
            });

            // setSuspensePromise(promise);

            return promise;
          }
        : mutate;
      return localFn;
    });
    return [fn.value, state];
    // , [state, mutate, retry, optsRef, setSuspensePromise]);
  };

  return useMutation;
}
