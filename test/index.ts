import Bussy from '../src'

const events = Bussy.createEventBus()

const unsub1 = events.on('test.*', () => {
  console.log('Nuovo messaggio')
  unsub1()
})

events.emit('test.a')
events.emit('test.b')

type User = {
  id: number
  name: string
}

const data = Bussy.createDataBus<User>()

const unsub2 = data.onData((user) => {
  console.log(user.id, user.name)
  unsub2()
})

data.publish({ id: 1, name: 'Mario' })
data.publish({ id: 2, name: 'Piero' })

const chat = Bussy.createReqResBus<string, number>()

const unsub3 = chat.onRequest((data, reply) => {
  reply(data.length)
})

chat.request('Messaggio 1', (res, err) => {
  if (err) {
    console.error(err)
  } else {
    console.log(res)
  }

  unsub3()
})

chat.request('Messaggio 2', (res, err) => {
  if (err) {
    console.error(err)
  } else {
    console.log(res)
  }
})