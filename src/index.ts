import EventEmitter2 from 'eventemitter2'
import { v4 as uuidv4 } from 'uuid'

export class BussyError extends Error {}

export type UnsubscribeFn = () => void
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventListener = (event: string, ...values: any[]) => void
export type DataListener<T> = (data: T) => void
export type RequestListener<T, K> = (req: T, reply: (res: K) => void) => void
export type ReplyFn<T> = (res?: T, err?: Error) => void
type RequestPayload<T> = { uuid: string, data: T }
type ReplyPayload<T> = { data: T }

export interface EventBus {
  on(event: string, listener: EventListener): UnsubscribeFn
  emit: (event: string, ...values: unknown[]) => void
}

export interface DataBus<T> {
  listen: (listener: DataListener<T>) => UnsubscribeFn
  publish: (data: T) => void
}

export interface RequestBus<T, K> {
  listen: (listener: RequestListener<T, K>) => UnsubscribeFn 
  create: (data: T, onReply: ReplyFn<K>) => void
  createAsync: (data: T) => Promise<K>
}

class MyEventBus implements EventBus {
  constructor(private emitter: EventEmitter2) {}

  on(event: string, listener: EventListener): UnsubscribeFn {
    this.emitter.on(event, listener)

    return () => {
      this.emitter.off(event, listener)
    }
  }

  emit(event: string, ...values: unknown[]) {
    this.emitter.emit(event, event, ...values)
  }
}

class MyDataBus<T> implements DataBus<T> {
  private topic = uuidv4()
  
  constructor(private emitter: EventEmitter2) {}

  listen(listener: DataListener<T>): UnsubscribeFn {
    this.emitter.on(this.topic, listener)

    return () => {
      this.emitter.off(this.topic, listener)
    }
  }

  publish(data: T) {
    this.emitter.emit(this.topic, data)
  }
}

class MyRequestBus<T, K> implements RequestBus<T, K> {
  private hasListener = false
  private uuid = uuidv4()

  constructor(private emitter: EventEmitter2) {}

  create(data: T, onReply: ReplyFn<K>) {
    if (!this.hasListener) {
      onReply(undefined, new BussyError('Missing listener for request'))
      return
    }

    const uuid = uuidv4()
    const request: RequestPayload<T> = {
      uuid,
      data
    }

    this.emitter.once(['reply', this.uuid, uuid], (data: ReplyPayload<K>) => {
      onReply(data.data)
    })
    this.emitter.emit(['request', this.uuid, uuid], request)
  }

  createAsync(data: T): Promise<K> {
    return new Promise((resolve, reject) => {
      this.create(data, (data, err) => {
        if (err) {
          reject(err)
        } else {
          resolve(data!)
        }
      })
    })
  }

  listen(listener: RequestListener<T, K>): UnsubscribeFn {
    if (this.hasListener) {
      throw new BussyError('Listener already exists')
    }

    this.hasListener = true
    const f = (data: RequestPayload<T>) => {
      listener(data.data, (res) => {
        const response: ReplyPayload<K> = {
          data: res
        }
        this.emitter.emit(['reply', this.uuid, data.uuid], response)
      })
    }
    this.emitter.on(['request', this.uuid, '*'], f)

    return () => {
      this.hasListener = false
      this.emitter.off(['request', this.uuid, '*'], f)
    }
  }
}

abstract class Bussy {
  private static emitter = new EventEmitter2({
    wildcard: true,
    delimiter: '.', 
    newListener: false, 
    removeListener: false, 
    verboseMemoryLeak: true,
    ignoreErrors: true
  })

  static createEventBus(): EventBus {
    return new MyEventBus(this.emitter)
  }

  static createDataBus<T>(): DataBus<T> {
    return new MyDataBus<T>(this.emitter)
  }

  static createRequestBus<T, K>(): RequestBus<T, K> {
    return new MyRequestBus<T, K>(this.emitter)
  }
}

export default Bussy
