import { isObject } from '@vue/shared'
import { ReactiveFlags, mutableHandlers } from './baseHandler'

// 创建一个map，用于记录代理后的结果，解决重复代理的问题
const reactiveMap = new WeakMap();
// weakMap：键是弱引用，不会影响对象的生命周期，性能好，避免内存泄漏

// 创建响应式对象
function createReactiveObject(target: any) {
    // 响应式对象，前提必须是对象才行
    if (!isObject(target)) {
        return target;
    }

    // 如果已经代理过，则直接返回
    const existProxy = reactiveMap.get(target);
    if (existProxy) {
        return existProxy;
    }

    // 获取 target 的某个属性，如果触发了 get 方法，则说明是响应式对象
    if (target[ReactiveFlags.IS_REACTIVE]) {
        // 无需再次代理，直接返回
        return target;
    }

    // 返回代理对象 Proxy(Object)
    let proxy = new Proxy(target, mutableHandlers);
    reactiveMap.set(target, proxy);
    return proxy;
}

export const reactive = (target: any) => {
    return createReactiveObject(target);
}