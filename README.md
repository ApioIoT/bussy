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

events.on('test.*', () => {
  console.log('Nuovo messaggio')
})

events.emit('test.a')
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

data.onData((user: User) => {
  console.log(user.username, user.password)
})

data.publish({ 
  username: 'username',
  password: 'password'
})
```

### Request/Reply

Events bus implementing Request/Reply pattern.

```typescript
import Bussy from '@apio/bussy'

const chat = Bussy.createReqResBus<string, number>()

chat.onRequest((data, reply) => {
  const len = data.length
  reply(len)
})

chat.request('Ciao', (res, err) => {
  if (err) {
    console.error(err)
  } else {
    console.log(res)
  }
})
```
