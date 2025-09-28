const person = {
    // 属性值
    name: 'rain',
    age: 18,
    // 方法
    getName () {
        return this.name
    },
    // getter 获取器，是对象的一个特殊属性类型
    // 当访问这个属性时，会自动调用这个方法
    get aliasName() {
        return this.name + ' alias'
    }
}

// console.log(person.getName())

const proxyPerson = new Proxy(person, {
    get(target, key, receiver) {
        console.log('get', key)
        // 这样写时，aliasName 里的 this 指向 target，
        // 所以 this.name 不会走代理，所以没有触发 get， 没有输出 'get name'
        // return target[key] 
        // 这样写是可以触发代理，但是会死循环
        // return receiver[key] 

        // 这样写是正确的，可以解决上面的问题
        // 相当于在执行 aliasName 里的 this.name 时，把 this 指向 receiver
        return Reflect.get(target, key, receiver)
    }
})

console.log(proxyPerson.aliasName, proxyPerson.name)