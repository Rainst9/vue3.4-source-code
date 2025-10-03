export const effect = (fn: () => void, options?: any) => {
    // 创建一个响应式 effect，数据变化后可以重新执行
    const _effect = new ReactiveEffect(fn, () => {
        // 调度执行 scheduler
        _effect.run();
    })

    // 默认执行一次
    _effect.run();

    // 自定义调度函数，用户传的参数覆盖默认的
    if (options) {
        Object.assign(_effect, options);
    }
    
    // 返回一个函数，用户可以手动调用
    const runner = _effect.run.bind(_effect); 
    runner.effect = _effect;
    return runner;
}

export let activeEffect; // 全局变量，初始化一次

// 每次执行前，做些清理工作
function preCleanEffect(effect) {
    effect._depsLength = 0; // 仅清空依赖长度的变量
    effect._trackId++; // 每次执行id都+1，用于解决 同一个 effect 里多次收集属性 A
}

function postCleanEffect(effect) {
    // 上一次 effect 的依赖：[ flag, age, name]
    // 这一次 effect 的依赖：[ flag ]
    // 那么需要清理的依赖是：[ age, name ] 
    if (effect.deps.length > effect._depsLength) {
        for (let i = effect._depsLength; i < effect.deps.length; i++) {
            cleanDepEffect(effect.deps[i], effect); // 删除 targetMap 中 effect 对应的依赖
        }
        effect.deps.length = effect._depsLength; // 删除多余的依赖
    }
}

class ReactiveEffect {
    _trackId = 0; // 用于记录当前的 effect 执行了几次
    deps = []; // 用于记录当前的 effect 依赖了哪些 key
    _depsLength = 0;
    public active = true; // 创建的 effect 默认是激活状态
    // fn 用户编写的函数
    // scheduler 调度执行
    constructor(public fn: () => void, public scheduler: () => void) {}
    run() {
        if (!this.active) {
            // 不是激活的，执行后不用做别的
            return this.fn();
        }

        let lastEffect = activeEffect;
        try {
            activeEffect = this;

            // effect 执行前，做些清理工作
            preCleanEffect(this);

            return this.fn();
            // 激活的，进行依赖收集，即 
            // fn 中的 state.name 和 state.age 和 effect 建立联系
        } finally {
            // effect 执行后，做些清理工作
            postCleanEffect(this);
            
            // 当这次的 effect 执行完，把 activeEffect 设置为 undefined
            // 下次再执行 effect 时，会重新赋值，避免混乱 

            // 恢复上一次的 activeEffect，解决 bug
            activeEffect = lastEffect;
        }
    }
}

// 清理依赖
function cleanDepEffect(dep, effect) {
    dep.delete(effect);
    if (dep.size === 0) {
        dep.cleanup();
    }
}

// 依赖收集
export const tarckEffect = (effect, dep) => {
    // console.log('tarckEffect', effect, dep)
    // dep 是一个 map，其外层是 key：dep
    // 这样，key -> effect 就建立了联系，即 key 对应/依赖的 effect 是谁
    // （双向记忆中的一向： key -> effect）

    // debugger;
    if (dep.get(effect) !== effect._trackId) {
        // 不相等，说明这个属性 key 在 这个 effect 执行的第 _trackId 次里是第一次收集这个 effect
        dep.set(effect, effect._trackId);

        let oldDep = effect.deps[effect._depsLength];
        if (oldDep !== dep) {
            if (oldDep) {
                cleanDepEffect(oldDep, effect);
            }
            effect.deps[effect._depsLength++] = dep;
        } else {
            effect._depsLength++;
        }
    }

    // // 同时 effect -> key 也要记录下
    // effect.deps[effect._depsLength++] = dep;
    // console.log(effect.deps, 'deps');
}

// 触发依赖，更新视图
export const triggerEffects = (dep) => {
    // dep 是一个 map，格式为： { effect1: trackId, effect2: trackId }
   for (const effect of dep.keys()) {
        // 如果 effect 有 scheduler，则调用 scheduler
        // scheduler 里会调用 effect.run()，从而重新执行 fn()，即 effect
        if (effect.scheduler) {
            effect.scheduler();
        }
   }
}