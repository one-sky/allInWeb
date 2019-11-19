/**
 * Suspense 让组件遇到异步操作时进入“悬停”状态，等异步操作有结果时再回归正常状态。
 * <Suspense fallback={<div>Loading...</div>}>
 *   <section>
 *     <OtherComponent />
 *     <AnotherComponent />
 *   </section>
 * </Suspense>
 */

// 用于确定work何时执行的过程
var Scheduler = require("scheduler");
var Scheduler_runWithPriority = Scheduler.unstable_runWithPriority;
//将任务组成双向链表, 并按照过期时间作为优先级
var Scheduler_scheduleCallback = Scheduler.unstable_scheduleCallback;
var Scheduler_cancelCallback = Scheduler.unstable_cancelCallback;
var Scheduler_shouldYield = Scheduler.unstable_shouldYield;
var Scheduler_requestPaint = Scheduler.unstable_requestPaint;
var Scheduler_now = Scheduler.unstable_now;
var Scheduler_getCurrentPriorityLevel =
  Scheduler.unstable_getCurrentPriorityLevel;
var Scheduler_ImmediatePriority = Scheduler.unstable_ImmediatePriority;
var Scheduler_UserBlockingPriority = Scheduler.unstable_UserBlockingPriority;
var Scheduler_NormalPriority = Scheduler.unstable_NormalPriority;
var Scheduler_LowPriority = Scheduler.unstable_LowPriority;
var Scheduler_IdlePriority = Scheduler.unstable_IdlePriority;
// fiber.mode
const NoMode = 0;
const StrictMode = 1; // TODO: Remove BatchedMode and ConcurrentMode by reading from the root
const BatchedMode = 2;
const ConcurrentMode = 4; // 异步模式
const ProfileMode = 8;

// 根据时间计算的expirationTime 数字越大，优先级越高
// Math.pow(2, 30) - 1;
var MAX_SIGNED_31_BIT_INT = 1073741823;
var NoWork = 0; // 没有任务等待处理
var Never = 1; // 不执行，优先级最低
var Idle = 2; // 闲置的
var Sync = MAX_SIGNED_31_BIT_INT; // 同步模式，立即处理任务 优先级最高，最大值30位浮点数
var Batched = Sync - 1;
var UNIT_SIZE = 10; // ms 分片
var MAGIC_NUMBER_OFFSET = Batched - 1; // 异步任务优先级最大值为Batched-1

// priority任务调度的优先级，90开始: 防止和Scheduler的优先级冲突
var ImmediatePriority = 99;
var UserBlockingPriority$2 = 98;
var NormalPriority = 97;
var LowPriority = 96;
var IdlePriority = 95; // NoPriority is the absence of priority. Also React-only.
var NoPriority = 90;

var initialTimeMs = Scheduler_now();
var now =
  initialTimeMs < 10000
    ? Scheduler_now
    : function() {
        return Scheduler_now() - initialTimeMs;
      };
// 获取当前的任务调度优先等级
function getCurrentPriorityLevel() {
  switch (Scheduler_getCurrentPriorityLevel()) {
    case Scheduler_ImmediatePriority:
      return ImmediatePriority;

    case Scheduler_UserBlockingPriority:
      return UserBlockingPriority$2;

    case Scheduler_NormalPriority:
      return NormalPriority;

    case Scheduler_LowPriority:
      return LowPriority;

    case Scheduler_IdlePriority:
      return IdlePriority;

    default:
      (function() {
        {
          {
            throw ReactError(Error("Unknown priority level."));
          }
        }
      })();
  }
}

// 1 expirationTime === 10ms   ms -> expirationTime | 0取整
function msToExpirationTime(ms) {
  return MAGIC_NUMBER_OFFSET - ((ms / UNIT_SIZE) | 0);
}
// expirationTimems -> ms
function expirationTimeToMs(expirationTime) {
  return (MAGIC_NUMBER_OFFSET - expirationTime) * UNIT_SIZE;
}

// 返回距离num最近的precision的倍数
// ceiling(110,20) return 120
function ceiling(num, precision) {
  return (((num / precision) | 0) + 1) * precision;
}

function computeExpirationBucket(currentTime, expirationInMs, bucketSizeMs) {
  return (
    MAGIC_NUMBER_OFFSET -
    ceiling(
      MAGIC_NUMBER_OFFSET - currentTime + expirationInMs / UNIT_SIZE,
      bucketSizeMs / UNIT_SIZE
    )
  );
}

// suspense 的ExpirationTime
function computeSuspenseExpiration(currentTime, timeoutMs) {
  return computeExpirationBucket(
    currentTime,
    timeoutMs,
    LOW_PRIORITY_BATCH_SIZE
  );
}

// Interactive 的ExpirationTime
var HIGH_PRIORITY_EXPIRATION = 500;
var HIGH_PRIORITY_BATCH_SIZE = 100;
function computeInteractiveExpiration(currentTime) {
  return computeExpirationBucket(
    currentTime,
    HIGH_PRIORITY_EXPIRATION,
    HIGH_PRIORITY_BATCH_SIZE
  );
}

// Async 的ExpirationTime
var LOW_PRIORITY_EXPIRATION = 5000;
var LOW_PRIORITY_BATCH_SIZE = 250;
function computeAsyncExpiration(currentTime) {
  return computeExpirationBucket(
    currentTime,
    LOW_PRIORITY_EXPIRATION,
    LOW_PRIORITY_BATCH_SIZE
  );
}

function inferPriorityFromExpirationTime(currentTime, expirationTime) {
  if (expirationTime === Sync) {
    return ImmediatePriority;
  }

  if (expirationTime === Never || expirationTime === Idle) {
    return IdlePriority;
  }

  var msUntil =
    expirationTimeToMs(expirationTime) - expirationTimeToMs(currentTime);

  if (msUntil <= 0) {
    return ImmediatePriority;
  }

  if (msUntil <= HIGH_PRIORITY_EXPIRATION + HIGH_PRIORITY_BATCH_SIZE) {
    return UserBlockingPriority$2;
  }

  if (msUntil <= LOW_PRIORITY_EXPIRATION + LOW_PRIORITY_BATCH_SIZE) {
    return NormalPriority;
  } // TODO: Handle LowPriority
  // Assume anything lower has idle priority

  return IdlePriority;
}

var currentEventTime = NoWork;
function requestCurrentTime() {
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    return msToExpirationTime(now());
  }

  if (currentEventTime !== NoWork) {
    return currentEventTime;
  }

  currentEventTime = msToExpirationTime(now());
  return currentEventTime;
}

// suspenseConfig = React.ReactSharedInternals.ReactCurrentBatchConfig.suspense
//基于时间的分级机制,设置fiber任务的优先级,结合mode+priporityLevel得到优先级
function computeExpirationForFiber(currentTime, fiber, suspenseConfig) {
  var mode = fiber.mode;

  if ((mode & BatchedMode) === NoMode) {
    return Sync;
  }

  var priorityLevel = getCurrentPriorityLevel();

  if ((mode & ConcurrentMode) === NoMode) {
    return priorityLevel === ImmediatePriority ? Sync : Batched;
  }

  if ((executionContext & RenderContext) !== NoContext) {
    // Use whatever time we're already rendering
    // TODO: Should there be a way to opt out, like with `runWithPriority`?
    return renderExpirationTime;
  }

  var expirationTime;

  if (suspenseConfig !== null) {
    // Compute an expiration time based on the Suspense timeout.
    expirationTime = computeSuspenseExpiration(
      currentTime,
      suspenseConfig.timeoutMs | 0 || LOW_PRIORITY_EXPIRATION
    );
  } else {
    // Compute an expiration time based on the Scheduler priority.
    switch (priorityLevel) {
      case ImmediatePriority:
        expirationTime = Sync;
        break;

      case UserBlockingPriority$2:
        // TODO: Rename this to computeUserBlockingExpiration
        expirationTime = computeInteractiveExpiration(currentTime);
        break;

      case NormalPriority:
      case LowPriority:
        // 计算异步更新的过期时间
        expirationTime = computeAsyncExpiration(currentTime);
        break;

      case IdlePriority:
        expirationTime = Idle;
        break;

      default:
        (function() {
          {
            {
              throw ReactError(Error("Expected a valid priority level"));
            }
          }
        })();
    }
  }

  var workInProgressRoot = null; // The fiber we're working on
  if (workInProgressRoot !== null && expirationTime === renderExpirationTime) {
    // This is a trick to move this update into a separate batch
    expirationTime -= 1;
  }

  return expirationTime;
}
