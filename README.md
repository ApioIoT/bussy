# @apio/bussy

An easy events bus with advance features.

## Installation

```
npm i @apio/bussy
```

## Usage

### EventBus

Generic events emitter. Support topic wildcards.

```typescript
import Bussy from '@apio/bussy'

const events = Bussy.createEventBus()

events.on('test.*', (event, data) => {
  console.log(`New event: ${event}: ${data}`)
  // New event: test.a: sample data
})

events.emit('test.a', 'sample data')
```

### DataBus

Typed data bus.

```typescript
import Bussy from '@apio/bussy'

type User = {
  username: string
  password: string
}

const dataBus = Bussy.createDataBus<User>()

dataBus.listen((user: User) => {
  console.log(user.username, user.password)
})

dataBus.publish({ 
  username: 'username',
  password: 'password'
})
```

### Request / Reply

Events bus implementing `Request/Reply` pattern.

```typescript
import Bussy from '@apio/bussy'

const request = Bussy.createRequestBus<string, number>()

request.listen((data, reply) => {
  const len = data.length
  reply(len)
})

request.create('Messaggio', (res, err) => {
  if (err) {
    console.error(err)
  } else {
    console.log(res)
  }
})

// Or with a Promise version

try {
  const res = await request.createAsync('Messaggio async')
  console.log(res)
} catch (e) {
  console.error(e)
}
```

## Todo

* Implements **timeout** feature in `Request/Reply` pattern.
