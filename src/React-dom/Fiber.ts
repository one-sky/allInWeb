export type Fiber = {
  // 最重要的三个：return, child和sibling
  // 当前fiber的父级fiber实例
  return: Fiber | null;
  // 子Fiber
  child: Fiber | null;
  // 兄弟fiber
  sibling: Fiber | null;

  mode: TypeOfMode;

  // Effect
  effectTag: SideEffectTag;
  // 标记不同的组件类型
  // 有原生的DOM节点，有React自己的节点
  tag: WorkTag;

  // 异步组件resolve之后返回的内容，一般是function或class
  // 比如懒加载
  type: any;
  // state更新或props更新均会更新到stateNode上
  stateNode: any;

  index: number;

  // 当前处理过程中的组件props对象
  pendingProps: any;
  // 上一次渲染完成后组件props对象, 便于有更高优先级的中断，恢复props
  memoizedProps: any;

  // A queue of state updates and callbacks.
  // 组件状态更新和对应回调函数的存储队列
  updateQueue: UpdateQueue<any> | null;

  // 上一次渲染完成后组件state对象, 便于有更高优先级的中断，恢复state
  memoizedState: any;

  // 记录状态改变的Dom的next指针，类似list
  nextEffect: Fiber | null;

  // The first and last fiber with side-effect within this subtree. This allows
  // us to reuse a slice of the linked list when we reuse the work done within
  // this fiber.
  // 快速拿到状态改变的Dom而不必遍历整个 哪些element需要做insert, update或者delete，又或者哪个element需要调用周期函数。这些都通过effect list的item反映出来
  firstEffect: Fiber | null;
  lastEffect: Fiber | null;

  // Represents a time in the future by which this work should be completed.
  // 本质上是优先级
  expirationTime: ExpirationTime;

  // 快速确定子树中是否有 update
  // 如果子节点有update的话，就记录应该更新的时间
  childExpirationTime: ExpirationTime;

  // This is a pooled version of a Fiber. Every fiber that gets updated will
  // eventually have a pair. There are cases when we can clean up pairs to save
  // memory if we need to.
  alternate: Fiber | null;

  // ReactElement里面的key
  key: null | string;

  // ReactElement.type，也就是我们调用createElement的第一个参数
  elementType: any;
};
