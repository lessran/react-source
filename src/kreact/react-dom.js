import { TEXT, PLACEMENT } from "./const";
/* eslint-disable */


// 下一个单元任务
let nextUnitOfWork = null;
// work in progress fiber root
let wipRoot = null;

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
    updateNode(props, node);
    return node
}

// function reconcileChildren (children, parentNode) {
//     if (children.length) {
//         children.map(child => {
//             render(child, parentNode);
//         })
//     }
// }

function updateNode (props, node) {
    Object.keys(props).filter(k => k !=="children").map(k => {
        if (k.slice(0, 2) === "on") {
            let eventName = k.slice(2).toLowerCase();
            node.addEventListener(eventName, props[k]);
          } else {
            node[k] = props[k];
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
    
    for(let i = 0; i < children.length; i++) {
        const child = children[i];
        let newFiber = {
            type: child.type,
            props: child.props,
            node: null,
            base: null,
            return: workInProgressFiber,
            effectTag: PLACEMENT
        };
        if (i === 0 ) {
            workInProgressFiber.child = newFiber
        } else {
            prevSibling.sibling = newFiber
        }
        prevSibling = newFiber
    }
    // console.log(workInProgressFiber);
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
    commitWorker(wipRoot.child);
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
    let parentNode = parentNodeFiber.node;
    if (fiber.effectTag === PLACEMENT && fiber.node) {
        // console.log(parentNode, fiber.node);
        parentNode.appendChild(fiber.node)
    }
    commitWorker(fiber.child);
    commitWorker(fiber.sibling);
}


requestIdleCallback(workLoop);

export const useState = (initState) => {

    const setState = (action) => {
        console.log(action);
    }

    return [initState, setState];
}


// eslint-disable-next-line
export default { render }