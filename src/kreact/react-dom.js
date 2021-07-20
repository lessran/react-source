import { TEXT, PLACEMENT, UPDATE, DELETION } from "./const";
/* eslint-disable */


// 下一个单元任务
let nextUnitOfWork = null;
// work in progress fiber root
let wipRoot = null;

let wipFiber = null;

let currentNode = null;

let deletions = null;

function render (vnode, container) {
    // console.log(vnode,container);
    // const node = createNode(vnode);
    wipRoot = {
        node: container,
        props: {
          children: [vnode]
        }
      };
    // container.appendChild(node);
    nextUnitOfWork = wipRoot;
}

function createNode (vnode) {
    const {type, props} = vnode;
    let node;
    if (type === TEXT) {
        node = document.createTextNode("");
    } else if (typeof type === "string") {
        node = document.createElement(type);
    } else if (typeof type === "function") {
        // console.log(vnode);
        node = type.isReactComponent ?
        updateClassComponent(vnode) :
        updateFunctionComponent(vnode);
    }
    // reconcileChildren(props.children, node);
    updateNode(node, {}, props);
    return node
}

// function reconcileChildren (children, parentNode) {
//     if (children.length) {
//         children.map(child => {
//             render(child, parentNode);
//         })
//     }
// }

function updateNode (node, preValue, nextValue) {
    Object.keys(preValue).filter(k => k !=="children").map(k => {
        if (k.slice(0, 2) === "on") {
            let eventName = k.slice(2).toLowerCase();
            node.removeEventListener(eventName, preValue[k]);
          } else {
            if (!(k in nextValue)) {
                node[k] = ""
            }
          }
    })

    Object.keys(nextValue).filter(k => k !=="children").map(k => {
        if (k.slice(0, 2) === "on") {
            let eventName = k.slice(2).toLowerCase();
            node.addEventListener(eventName, nextValue[k]);
          } else {
            node[k] = nextValue[k];
          }
    })
}

function updateHostComponent(fiber) {
    
    if (!fiber.node) {
        fiber.node = createNode(fiber);
    }
    const {children} = fiber.props;
    reconcileChildren(fiber, children);
    // console.log("fiber----", fiber); //sy-log
}


function updateFunctionComponent (fiber) {
    wipFiber = fiber;
    wipFiber.hooks = [];
    wipFiber.hookIndex = 0;
    const { type, props } = fiber;
    const children = [type(props)];
    reconcileChildren(fiber, children);
}

function updateClassComponent (vnode) {
    const {type, props} = vnode;
    const cmp = new type(props);
    const vvnode = cmp.render();
    return createNode(vvnode);
}

function reconcileChildren(workInProgressFiber, children) {
    let prevSibling = null;
    let oldFiber = workInProgressFiber.base && workInProgressFiber.base.child;
    for(let i = 0; i < children.length; i++) {
        const child = children[i];
        let newFiber= null;
        const sameType = child && oldFiber && oldFiber.type === child.type;
        if (sameType) {
            newFiber = {
                type: child.type,
                props: child.props,
                node: oldFiber.node,
                base: oldFiber,
                return: workInProgressFiber,
                effectTag: UPDATE,
            }
        }
        if (!sameType && child) {
            newFiber = {
                type: child.type,
                props: child.props,
                node: null,
                base: null,
                return: workInProgressFiber,
                effectTag: PLACEMENT,
            }
        }
        if (!sameType && oldFiber) {
            oldFiber.effectTag = DELETION;
            deletions.push(oldFiber);
        }
        if (oldFiber) {
            oldFiber = oldFiber.sibling
        }
        if (i === 0 ) {
            workInProgressFiber.child = newFiber
        } else {
            prevSibling.sibling = newFiber
        }
        prevSibling = newFiber
    }
    // console.log(workInProgressFiber);
}

function commitDeletions (fiber, parentNode) {
    if (fiber.node) {
        parentNode.removeChild(fiber.node);
    } else {
        fiber.child && commitDeletions(fiber.child, parentNode);
    }
}



function performUnitOfWork(fiber) {
    const {type} = fiber;
    if (typeof type === "function") {
        updateFunctionComponent(fiber)
    } else {
        updateHostComponent(fiber)
    }


    if (fiber.child) {
        return fiber.child;
    }
    let nextFiber = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling
        }
        nextFiber = nextFiber.return;
    }
}


function workLoop(deadline) {
    while (nextUnitOfWork && deadline.timeRemaining() > 1) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    }
    if (!nextUnitOfWork && wipRoot) {
        commitRoot()
    }
    requestIdleCallback(workLoop);
}

function commitRoot() {
    deletions.forEach(commitWorker);
    commitWorker(wipRoot.child);
    currentNode = wipRoot;
    wipRoot = null;
}

function commitWorker(fiber) {
    if (!fiber) {
        return;
    }
    let parentNodeFiber = fiber.return;
    while (!parentNodeFiber.node) {
        parentNodeFiber = parentNodeFiber.return
    }
    const parentNode = parentNodeFiber.node;
    if (fiber.effectTag === PLACEMENT && fiber.node) {
        // console.log(parentNode, fiber.node);
        parentNode.appendChild(fiber.node)
    } else if (fiber.effectTag === UPDATE && fiber.node) {
        console.log(fiber);
        updateNode(fiber.node, fiber.base.props, fiber.props)
    } else if (fiber.effectTag === DELETION && fiber.node) {
        commitDeletions(fiber, parentNode);
    }
    commitWorker(fiber.child);
    commitWorker(fiber.sibling);
}


requestIdleCallback(workLoop);

export const useState = (initState) => {
    const oldHook = wipFiber.base && wipFiber.base.hooks[wipFiber.hookIndex];

    const hook = oldHook 
    ? {
        state: oldHook.state,
        queue: oldHook.queue,
    } 
    : 
    {
        state: initState,
        queue: []
    }
    hook.queue.forEach(action => {hook.state = action});
    const setState = (action) => {
        hook.queue.push(action);
        const newFiber = {
            node: currentNode.node,
            props: currentNode.props,
            base: currentNode,
        }
        wipRoot = newFiber;
        nextUnitOfWork = newFiber
    }
    wipFiber.hooks.push(hook);
    wipFiber.hookIndex++;
    deletions = [];

    return [hook.state, setState];
}


// eslint-disable-next-line
export default { render }