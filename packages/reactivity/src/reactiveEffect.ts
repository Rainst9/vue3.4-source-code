import { activeEffect, tarckEffect, triggerEffects } from './effect';


let targetMap = new WeakMap(); // 存放依赖关系

// 创建一个 key 对应的 effect 的依赖关系 
export const createDep = (cleanup, key) => {
  const dep = new Map() as any;
  dep.cleanup = cleanup; // 清理函数，之后又用
  dep.name = key; // 源码没有，方便自己查看数据结构
  return dep;
}


// 依赖收集
export const track = (target: any, key: any) => {
    console.log('track', target, key, activeEffect)
    // activeEffect 存在，说明 对象属性的获取 是在 effect 中进行的
    // 所以需要对其进行 依赖收集
    // 反之不存在，则不需要进行依赖收集
    if (activeEffect) {
        // 看下当前的 target 对象是否存在依赖关系，没有就创建一个
        // 比如：{ name: '张三', age: 18 } 这个 target
        let depsMap = targetMap.get(target);

        if (!depsMap) {
            // 没有就创建一个
            targetMap.set(target, (depsMap = new Map()));
        }

        // 看下当前的 key 是否存在依赖关系，没有就创建一个
        // 比如 key 是 name
        let dep = depsMap.get(key);

        if (!dep) {
            // 没有就创建一个
            depsMap.set(key, dep = createDep(() => depsMap.delete(key), key));
        }

        tarckEffect(activeEffect, dep);

        console.log(targetMap);
    }

}

// 触发依赖，更新视图: 某个 key 变了，通知依赖这个 key 的 effect 重新执行
export const trigger = (target: any, key: any, value: any, oldValue: any) => {
    console.log('trigger', target, key, value, oldValue)
    const depsMap = targetMap.get(target);

    if (!depsMap) {
        // 这个对象没有依赖关系，直接返回
        return;
    }

    let dep = depsMap.get(key);

    if (dep) {
        // 这个 key 属性可能对应多个 effect
        triggerEffects(dep);
    }
}

// 依赖收集，应该是什么格式的呢? 如下：
// weakMap 里是多层 map
// { name: '张三', age: 18 } 【target】 : {
//     name: 【key】 {
//         effect1: trackId,
//         effect2: trackId
//     },
//     age: 【key】 {
//         effect3: trackId,
//         effect2: trackId
//     }
// }