/**
 * 作用： 1.负责编译模版，解析指令差值表达式；
 * 2.负责页面的首次渲染
 * 当数据变化后重新渲染视图
 */
class Compiler {
    constructor (vm) {
        this.el = vm.$el
        this.vm = vm
        this.compile(this.el)
    }
    // 编译模版，处理文本节点和元素节点
    compile(el) {
        let childNodes = el.childNodes
        Array.from(childNodes).forEach(node => {
            if(this.isTextNode(node)) {
                // 处理文本节点
                this.compileText(node)
            } else if (this.isElementNode(node)) {
                // 处理元素节点
                this.compileElement(node)
            }
             // 判断node 节点， 是否含有子节点，如果有子节点，要递归调用 compile
            if(node.childNodes && node.childNodes.length) {
                this.compile(node)
            }
        })

       
    }
    // 编译元素节点，处理指令
    compileElement (node) {
        // 遍历所有属性节点
        Array.from(node.attributes).forEach( attr => {
            // 判断属性是否是指令，也就是是否以 v- 开头
            let attrName = attr.name
            if(this.isDirective(attrName)) {
                // 将 v-xxx 转换为 xxx
                attrName = attrName.substr(2)
                let key = attr.value // key 就是v-text=“msg” 中的 msg
                if(attrName.indexOf('on:') != -1) {  // 判断属性中是否含有v-on：
                    let funtype = attrName.substr(3)
                    this.onUpdater(node, funtype, key)
                    
                } else {
                    this.update(node, key, attrName)
                }
               
            }
        })
    }
    update (node, key, attrName) {
        let updateFn = this[attrName + 'Updater']
        updateFn && updateFn.call(this, node, this.vm[key], key)
    }
    // 处理 v-text 指令
    textUpdater (node, value,key) {
        node.textContent = value
        new Watcher(this.vm, key, (newValue) => {
            node.textContent = newValue
        })
    }
    // 处理 v-html指令
    htmlUpdater (node, value, key) {
        node.innerHTML = value
        new Watcher(this.vm, key, (newValue) => {
            node.innerHTML = newValue
        })
    }

    // 处理 v-on 指令
    // <button v-on:click="doThis"></button>
    onUpdater(node, funType, callback) {
        node['on'+funType] = this.vm.methods[callback]
    }
    // 处理 v-model
    modelUpdater (node, value,key) {
        node.value = value
        new Watcher(this.vm, key, (newValue) => {
            node.value = newValue
        })

        // 双向绑定
        node.addEventListener('input', () => {
            this.vm[key] = node.value
        })
    }
    // 编译文本节点，处理差值表达式
    compileText (node) {
        // console.dir(node);
        // {{ msg   }}
        let reg = /\{\{(.+?)\}\}/
        let value = node.textContent
        if(reg.test(value)) {
            let key = RegExp.$1.trim() // 获取 {{ }} 里面的内容
            node.textContent = value.replace(reg, this.vm[key])

            // 创建 Watcher 对象,当数据改变更新视图
            new Watcher(this.vm, key, (newValue) => {
                node.textContent = newValue
            })
        }
        
    }
    // 判断元素属性是否是指令
    isDirective (attrName) {
        return attrName.startsWith('v-')
    }
    // 判断节点是否是文本节点
    isTextNode (node) {
        return node.nodeType === 3
    }
    // 判断节点是否为元素节点
    isElementNode (node) {
        return node.nodeType === 1
    }
}