import { getBatch } from './batch'

// encapsulates the subscription logic for connecting a component to the redux store, as
// well as nesting subscriptions of descendant components, so that we can ensure the
// ancestor components re-render before descendants

type VoidFunc = () => void

type Listener = {
  callback: VoidFunc
  next: Listener | null
  prev: Listener | null
}

function createListenerCollection() {
  const batch = getBatch()
  // 对listener的收集，listener是一个双向链表
  let first: Listener | null = null
  let last: Listener | null = null

  return {
    //用于清空收集的链表
    clear() {
      first = null
      last = null
    },

    // 触发链表所有节点的回调
    notify() {
      batch(() => {
        let listener = first
        while (listener) {
          listener.callback()
          listener = listener.next
        }
      })
    },

    // 以数组的形式返回所有节点
    get() {
      let listeners: Listener[] = []
      let listener = first
      while (listener) {
        listeners.push(listener)
        listener = listener.next
      }
      return listeners
    },

    // 向链表末尾添加节点，并返回一个删除该节点的undo函数
    subscribe(callback: () => void) {
      let isSubscribed = true

      // 创建一个链表节点
      let listener: Listener = (last = {
        callback,
        next: null,
        prev: last,
      })

      // 如果链表还没有节点，它则是首节点
      if (listener.prev) {
        listener.prev.next = listener
      } else {
        // 如果链表还没有节点，它则是首节点
        first = listener
      }

      // 返回双向链表的删除方法
      return function unsubscribe() {
        if (!isSubscribed || first === null) return
        isSubscribed = false

        // unsubscribe就是个双向链表的删除指定节点操作
        if (listener.next) {
          // next的prev应该为该节点的prev
          listener.next.prev = listener.prev
        } else {
          // 没有则说明该节点是最后一个，将prev节点作为last节点
          last = listener.prev
        }
        // 如果有前节点prev
        if (listener.prev) {
          // prev的next应该为该节点的next
          listener.prev.next = listener.next
        } else {
          // 否则说明该节点是第一个，把它的next给first
          first = listener.next
        }
      }
    },
  }
}

type ListenerCollection = ReturnType<typeof createListenerCollection>

export interface Subscription {
  addNestedSub: (listener: VoidFunc) => VoidFunc
  notifyNestedSubs: VoidFunc
  handleChangeWrapper: VoidFunc
  isSubscribed: () => boolean
  onStateChange?: VoidFunc | null
  trySubscribe: VoidFunc
  tryUnsubscribe: VoidFunc
  getListeners: () => ListenerCollection
}

const nullListeners = {
  notify() {},
  get: () => [],
} as unknown as ListenerCollection

export function createSubscription(store: any, parentSub?: Subscription) {
  // 自己是否被订阅的标志 防止被嵌套注册
  let unsubscribe: VoidFunc | undefined

  // 负责收集订阅的收集器
  let listeners: ListenerCollection = nullListeners

  // 做了两件事情
  //1. 让自己的订阅回调先被父级收集；
  //2. 收集子subscription的订阅回调。
  function addNestedSub(listener: () => void) {
    trySubscribe()
    return listeners.subscribe(listener)
  }
  // 通知订阅
  function notifyNestedSubs() {
    listeners.notify()
  }
  // 自己的订阅回调
  //使用外壳包装是因为订阅回调在被父级收集时 自己的回调还没确定
  function handleChangeWrapper() {
    if (subscription.onStateChange) {
      subscription.onStateChange()
    }
  }
  // 判断自己是否被订阅
  function isSubscribed() {
    return Boolean(unsubscribe)
  }
  // 让自己被父级订阅
  function trySubscribe() {
    if (!unsubscribe) {
      unsubscribe = parentSub
        ? parentSub.addNestedSub(handleChangeWrapper)
        : store.subscribe(handleChangeWrapper)

      listeners = createListenerCollection()
    }
  }
  // 从父级注销自己的订阅
  function tryUnsubscribe() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = undefined
      listeners.clear()
      listeners = nullListeners
    }
  }

  const subscription: Subscription = {
    addNestedSub,
    notifyNestedSubs,
    handleChangeWrapper,
    isSubscribed,
    trySubscribe,
    tryUnsubscribe,
    getListeners: () => listeners,
  }

  return subscription
}
