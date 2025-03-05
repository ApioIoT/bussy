import EventEmitter2 from 'eventemitter2'
import { v4 as uuidv4 } from 'uuid'

export class BussyError extends Error {}
export type UnsubscribeFn = () => void

type RequestPayload<T> = { 
  uuid: string
  data: T
}

type ReplyPayload<T> = {
  data: T
}

class EventBus {
  constructor(private emitter: EventEmitter2) {}

  on(event: string, listener: (...values: unknown[]) => void): () => void {
    this.emitter.on(event, listener)

    return () => {
      this.emitter.off(event, listener)
    }
  }

  emit(event: string, ...values: unknown[]) {
    this.emitter.emit(event, ...values)
  }
}

class DataBus<T> {
  private topic = uuidv4()
  
  constructor(private emitter: EventEmitter2) {}

  onData(cb: (data: T) => void): UnsubscribeFn {
    this.emitter.on(this.topic, cb)

    return () => {
      this.emitter.off(this.topic, cb)
    }
  }

  publish(data: T) {
    this.emitter.emit(this.topic, data)
  }
}

class RequestBus<T, K> {
  private hasListener = false
  private uuid = uuidv4()

  constructor(private emitter: EventEmitter2) {}

  create(data: T, onReply: (res?: K, err?: Error) => void) {
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

  listen(cb: (req: T, reply: (res: K) => void) => void): UnsubscribeFn {
    if (this.hasListener) {
      throw new BussyError('Listener already exists')
    }

    this.hasListener = true
    const f = (data: RequestPayload<T>) => {
      cb(data.data, (res) => {
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

  static createEventBus() {
    return new EventBus(this.emitter)
  }

  static createDataBus<T>() {
    return new DataBus<T>(this.emitter)
  }

  static createRequestBus<T, K>() {
    return new RequestBus<T, K>(this.emitter)
  }
}

export default Bussy
