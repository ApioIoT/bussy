import EventEmitter2 from 'eventemitter2'
import { v4 as uuidv4 } from 'uuid'

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

  onData(cb: (data: T) => void): () => void {
    this.emitter.on(this.topic, cb)

    return () => {
      this.emitter.off(this.topic, cb)
    }
  }

  publish(data: T) {
    this.emitter.emit(this.topic, data)
  }
}

class ReqRes<T, K> {
  private topicRequest = uuidv4()
  private topicResponse = uuidv4()

  private hasListener = false

  constructor(private emitter: EventEmitter2) {}

  request(data: T, onReply: (res?: K, err?: Error) => void) {
    if (!this.hasListener) {
      onReply(undefined, new Error('Missing listener for request'))
      return
    }

    this.emitter.once(this.topicResponse, onReply)
    this.emitter.emit(this.topicRequest, data)
  }

  onRequest(cb: (data: T, reply: (data: K) => void) => void): () => void {
    if (this.hasListener) {
      throw new Error('Listener already exists')
    }

    this.hasListener = true

    const f = (data: T) => {
      cb(data, (res) => {
        this.emitter.emit(this.topicResponse, res)
      })
    }
    this.emitter.on(this.topicRequest, f)

    return () => {
      this.emitter.off(this.topicRequest, f)
      this.hasListener = false
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

  static createReqResBus<T, K>() {
    return new ReqRes<T, K>(this.emitter)
  }
}

export default Bussy
