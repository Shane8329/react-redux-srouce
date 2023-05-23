import React, { Context, ReactNode, useMemo } from 'react'
import { ReactReduxContext, ReactReduxContextValue } from './Context'
import { createSubscription } from '../utils/Subscription'
import { useIsomorphicLayoutEffect } from '../utils/useIsomorphicLayoutEffect'
import { Action, AnyAction, Store } from 'redux'

export interface ProviderProps<A extends Action = AnyAction, S = any> {
  /**
   * The single Redux store in your application.
   */
  store: Store<S, A>

  /**
   * An optional server state snapshot. Will be used during initial hydration render if available, to ensure that the UI output is consistent with the HTML generated on the server.
   */
  serverState?: S

  /**
   * Optional context to be used internally in react-redux. Use React.createContext() to create a context to be used.
   * If this is used, you'll need to customize `connect` by supplying the same context provided to the Provider.
   * Initial value doesn't matter, as it is overwritten with the internal state of Provider.
   */
  context?: Context<ReactReduxContextValue<S, A>>
  children: ReactNode
}

function Provider<A extends Action = AnyAction>({
  store,
  context,
  children,
  serverState,
}: ProviderProps<A>) {
  const contextValue = useMemo(() => {
    //创建订阅实例 后续嵌套收集订阅的关键
    const subscription = createSubscription(store)
    return {
      store,
      subscription,
      getServerState: serverState ? () => serverState : undefined,
    }
  }, [store, serverState])

  // 获取了一次最新 state 并命名为 previousState，只要 store 单例不发生变化，它是不会更新的。
  //一般项目中也不太会改变 redux 单例。
  const previousState = useMemo(() => store.getState(), [store])

  // 这里做了一个同构：在 server 环境时使用 useEffect，在浏览器环境时使用 useLayoutEffect
  //useLayoutEffect/useEffect 会在最后被调用，这时能确保子组件该注册订阅的都注册了，同时也能确保子组件渲染过程中可能发生的更新都已经发生了。
  //所以再最后读取一次 state，比较一下是否要通知它们更新。
  useIsomorphicLayoutEffect(() => {
    const { subscription } = contextValue
    subscription.onStateChange = subscription.notifyNestedSubs
    subscription.trySubscribe()

    if (previousState !== store.getState()) {
      subscription.notifyNestedSubs()
    }
    return () => {
      subscription.tryUnsubscribe()
      subscription.onStateChange = undefined
    }
  }, [contextValue, previousState])

  const Context = context || ReactReduxContext

  // @ts-ignore 'AnyAction' is assignable to the constraint of type 'A', but 'A' could be instantiated with a different subtype
  return <Context.Provider value={contextValue}>{children}</Context.Provider>
}

export default Provider
