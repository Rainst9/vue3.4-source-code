// 提取 handler 中的公共逻辑
import { track, trigger } from './reactiveEffect';

// 响应式对象的标志
// enum 枚举，是 ts 的语法，用来定义一组常量
// 好处：1. 代码更直观，2. 类型安全 
export enum ReactiveFlags {
    IS_REACTIVE = "__v_isReactive" // 特殊的命名，避免和用户自己定义的属性冲突
}

// mutable 可变的，可修改的
// proxy 需要搭配 reflect 使用
export const mutableHandlers: ProxyHandler<any> = {
    get(target, key, receiver) {
        // receiver 代理对象，就是createReactiveObject返回的proxy
        if (key === ReactiveFlags.IS_REACTIVE) {
            return true;
        }
        // todo: 依赖收集 - 对象&对象的属性和effect建立联系
        track(target, key); 

        // return target[key]; 
        return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
        console.log('set', key)
        // return target[key] = value;
        // todo: 触发依赖，更新视图 - 属性变化，通知effect重新执行
        let oldValue = target[key]; // 旧值
        let result = Reflect.set(target, key, value, receiver);
        // 如果旧值和新值不相等，则触发依赖，更新视图
        if (oldValue !== value) {
            trigger(target, key, value, oldValue);
        }
        return result;
    }
}